"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getWhatsAppStatus, 
  sendWhatsAppMessage,
  startWhatsAppSession,
  getWhatsAppQRCode,
  stopWhatsAppSession,
} from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import UsageStats from "@/components/UsageStats";
import Loader from "@/components/Loader";

export default function WhatsAppPage() {
  const { canManageWhatsApp, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  // Load initial status
  useEffect(() => {
    if (token) {
      checkStatus();
    }
  }, [token]);

  // Auto-refresh status only (NOT QR code) - with proper cleanup
  // ✅ REDUCED polling frequency to 30 seconds to avoid spam detection
  useEffect(() => {
    if (!token) return;
    
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    // Only poll when page is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - stop polling
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Page is visible - start polling if not already started
        if (!intervalId && isMounted) {
          intervalId = setInterval(() => {
            if (isMounted && !document.hidden) {
              checkStatus();
            }
          }, 30000); // ✅ 30 seconds instead of 5 seconds
        }
      }
    };
    
    // Start initial interval
    if (!document.hidden) {
      intervalId = setInterval(() => {
        if (isMounted && !document.hidden) {
          checkStatus();
        }
      }, 30000); // ✅ 30 seconds instead of 5 seconds
    }
    
    // Listen to visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]); // Removed status?.status from dependencies to prevent loop

  // Poll for QR code ONLY when waiting after starting session
  useEffect(() => {
    if (!isWaitingForQR || !token) return;
    
    console.log('[WhatsApp] Starting QR code polling...');
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 30; // Try for 30 seconds (30 attempts * 2 seconds)
    
    const interval = setInterval(async () => {
      if (!isMounted) {
        clearInterval(interval);
        return;
      }
      
      attempts++;
      console.log(`[WhatsApp] QR polling attempt ${attempts}/${maxAttempts}, status:`, status?.status, 'hasQR:', !!qrCode);
      
      // Check if we have QR code or are connected
      const currentStatus = status?.status;
      const currentQR = qrCode;
      
      if (currentStatus === 'CONNECTED') {
        console.log('[WhatsApp] Connected - stopping QR polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
        return;
      }
      
      if (currentQR) {
        console.log('[WhatsApp] QR code received - stopping polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
        return;
      }
      
      // If still waiting, fetch QR code
      if (attempts <= maxAttempts) {
        console.log('[WhatsApp] Fetching QR code...');
        await refreshQRCode();
      } else {
        console.log('[WhatsApp] QR polling timeout after', attempts, 'attempts');
        setIsWaitingForQR(false);
        clearInterval(interval);
        if (!currentQR) {
          setError("انتهت مهلة انتظار رمز QR. يرجى المحاولة مرة أخرى. تأكد من أن الاتصال بالإنترنت مستقر.");
        }
      }
    }, 2000); // Check every 2 seconds (reduced frequency to avoid too many requests)
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isWaitingForQR, token]); // Removed status and qrCode to prevent re-triggering

  // Check permissions after all hooks
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <Loader 
          text="جاري التحقق من الصلاحيات..." 
          size="lg" 
          variant="primary"
          showDots
          fullScreen={false}
          className="py-16"
        />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة الواتساب</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إدارة الواتساب</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح الباقات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageWhatsApp()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة الواتساب</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية إدارة الواتساب</h3>
            <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل إدارة الواتساب</p>
            <Button 
              onClick={() => window.location.href = '/plans'}
              className="bg-green-600 hover:bg-green-700"
            >
              ترقية الباقة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function checkStatus() {
    try {
      const data = await getWhatsAppStatus(token);
      console.log('[WhatsApp] Status check:', data.status, 'Current QR:', qrCode ? 'EXISTS' : 'EMPTY');
      setStatus(data);
      
      // ONLY clear QR when successfully connected - keep it visible while waiting!
      if (data.status === 'CONNECTED') {
        console.log('[WhatsApp] ✅ Connected! Clearing QR code');
        setSuccess("✅ تم الاتصال بنجاح!");
        setQrCode(""); // Clear QR code when connected
        setError(""); // Clear any errors
        setIsWaitingForQR(false);
      }
      // DON'T clear QR on disconnected - user might still be scanning!
      // NEVER auto-refresh QR code - only when user explicitly starts session
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function refreshQRCode() {
    try {
      console.log('[WhatsApp] Calling getWhatsAppQRCode API...');
      const data = await getWhatsAppQRCode(token);
      console.log('[WhatsApp] QR API response:', { 
        success: data.success, 
        hasQR: !!data.qrCode, 
        qrLength: data.qrCode?.length || 0,
        message: data.message 
      });
      
      if (data.success && data.qrCode && data.qrCode.length > 100) {
        console.log('[WhatsApp] ✅ QR code received! Length:', data.qrCode.length);
        console.log('[WhatsApp] QR preview:', data.qrCode.substring(0, 50) + '...');
        console.log('[WhatsApp] Setting QR code in state NOW');
        setQrCode(data.qrCode);
        setIsWaitingForQR(false); // Stop polling when QR is received
        setSuccess("✅ تم توليد رمز QR بنجاح. امسحه الآن!");
        setError(""); // Clear any errors
      } else {
        console.log('[WhatsApp] No QR code in response yet:', data.message);
        // Don't set error - QR might still be generating
      }
    } catch (e: any) {
      console.error('[WhatsApp] QR refresh error:', e.message);
      // Only set error if it's not a "no QR yet" case
      if (!e.message?.includes('No QR Code available') && !e.message?.includes('still initializing')) {
        setError(`خطأ في جلب QR Code: ${e.message}`);
      }
    }
  }

  async function startSession() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setQrCode(""); // Clear old QR code
      
      console.log('[WhatsApp] Starting session...');
      const result = await startWhatsAppSession(token);
      console.log('[WhatsApp] Session start response:', {
        success: result.success,
        hasQR: !!result.qrCode,
        qrLength: result.qrCode?.length || 0,
        status: result.status,
        message: result.message
      });
      
      if (result.success) {
        // Set QR code if returned immediately in response
        if (result.qrCode && result.qrCode.length > 100) {
          console.log('[WhatsApp] ✅ QR code received immediately from startSession');
          setQrCode(result.qrCode);
          setSuccess("✅ تم توليد رمز QR بنجاح. امسحه الآن!");
          setIsWaitingForQR(false);
        } else {
          // If no QR yet, start polling
          console.log('[WhatsApp] No QR in initial response, starting polling...');
          setSuccess("جاري تشغيل الجلسة... يرجى انتظار رمز QR");
          setIsWaitingForQR(true); // Start polling for QR
        }
        
        // Check status after starting
        await checkStatus();
      } else {
        setError(result.message || "فشل في بدء الجلسة");
        setIsWaitingForQR(false);
      }
    } catch (e: any) {
      console.error('[WhatsApp] Start session error:', e);
      setError(e.message || "حدث خطأ أثناء بدء الجلسة");
      setIsWaitingForQR(false);
    } finally {
      setLoading(false);
    }
  }

  async function stopSession() {
    try {
      setLoading(true);
      setError("");
      setIsWaitingForQR(false); // Stop polling
      const result = await stopWhatsAppSession(token);
      if (result.success) {
        setSuccess("تم إيقاف الجلسة بنجاح!");
        setQrCode("");
        await checkStatus();
      } else {
        setError(result.message || "فشل في إيقاف الجلسة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!testPhoneNumber || !testMessage) {
      setError("يرجى إدخال رقم الهاتف والرسالة");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log(`[WhatsApp Frontend] Sending message to ${testPhoneNumber}: ${testMessage}`);
      const result = await sendWhatsAppMessage(token, testPhoneNumber, testMessage);
      
      if (result.success) {
        setSuccess("تم إرسال الرسالة بنجاح!");
        setTestMessage("");
      } else {
        console.log(`[WhatsApp Frontend] Message send failed:`, result.message);
        setError(result.message || "فشل في إرسال الرسالة");
      }
    } catch (e: any) {
      console.error('[WhatsApp Frontend] Send message error:', e);
      setError(`فشل في الإرسال: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md p-4 bg-green-50 text-green-700">
          {success}
        </div>
      )}
<div className="flex  w-full gap-3">
      {/* Usage Statistics */}
     <div className="w-1/2 ">
     {canManageWhatsApp && hasActiveSubscription && (
        <UsageStats platform="whatsapp" />
      )}
     </div>

      {/* WhatsApp Connection */}
      <Card className=" gradient-border  w-1/2">
        <CardHeader className="border-text-primary/50 text-white flex items-center justify-between">اتصال الواتساب
        
        <div className="">
              <p className="text-sm  bg-green-900 text-white p-1 rounded-md">
                الحالة: <span className={`${status?.status === 'CONNECTED' ? 'text-green-500' : 'text-red-300'}`}>{status?.status || 'غير معروف'} </span> 
              </p>
              {/* {status?.message || 'لا توجد جلسة'} */}
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
         
            <div className="flex items-center gap-2 w-full">
              <Button className="w-1/2 primary-button after:bg-[#01191080] before:bg-[#01191080]" onClick={checkStatus} disabled={loading} variant="secondary">
                تحديث
              </Button>
              {status?.status === 'disconnected' || !status ? (
                <button className="w-1/2 primary-button after:bg-[#131240] relative overflow-hidden" onClick={startSession} disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                        <div className="relative w-5 h-5">
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                      </div>
                      <span className="text-white font-medium">جاري الربط...</span>
                    </span>
                  ) : (
                    <span> ربط حسابك</span>
                  )}
                </button>
              ) : (
                <Button className="w-1/2" onClick={stopSession} disabled={loading} variant="destructive">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الإيقاف...
                    </span>
                  ) : (
                    'إيقاف الربط'
                  )}
                </Button>
              )}
            </div>
         
          
          {/* QR Code Display */}
          {qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-white mb-4">
                امسح رمز QR هذا بتطبيق الواتساب على هاتفك للاتصال:
              </p>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="border-2 border-gray-300 rounded-lg shadow-lg bg-white p-2"
                  style={{ maxWidth: '350px', height: 'auto' }}
                  onError={(e) => {
                    console.error('[WhatsApp] QR image failed to load, QR data:', qrCode.substring(0, 50));
                    setError("فشل تحميل QR Code. يرجى المحاولة مرة أخرى.");
                    setQrCode(""); // Clear invalid QR code
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">
                ⚠️ رمز QR صالح لمدة 60 ثانية فقط. إذا انتهت صلاحيته، اضغط "ربط حسابك" مرة أخرى.
              </p>
            </div>
          )}
          
          {/* Show loading message while waiting for QR */}
          {isWaitingForQR && !qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-sm text-white">
                جاري توليد رمز QR... يرجى الانتظار
              </p>
              <p className="text-xs text-gray-400">
                قد يستغرق هذا من 5 إلى 15 ثانية
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      </div>
      {/* Send Test Message */}
      {/* <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">إرسال رسالة تجريبية</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">رقم الهاتف (مع رمز الدولة)</label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الرسالة</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="مرحباً، هذه رسالة تجريبية"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white"
              />
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !testPhoneNumber || !testMessage}
            className="w-full"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          </Button>
        </CardContent>
      </Card> */}
    </div>
  );
}
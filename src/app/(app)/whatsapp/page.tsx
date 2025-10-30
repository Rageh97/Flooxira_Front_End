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
  useEffect(() => {
    if (!token) return;
    
    let isMounted = true;
    const interval = setInterval(() => {
      if (isMounted) {
        checkStatus();
      }
    }, 5000); // Increased to 5 seconds to reduce server load
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]); // Removed status?.status from dependencies to prevent loop

  // Poll for QR code ONLY when waiting after starting session
  useEffect(() => {
    if (!isWaitingForQR || !token) return;
    
    console.log('[WhatsApp] Starting QR code polling...');
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 20; // Try for 20 seconds (increased from 10)
    
    const interval = setInterval(async () => {
      if (!isMounted || attempts >= maxAttempts) {
        clearInterval(interval);
        if (isMounted && attempts >= maxAttempts) {
          console.log('[WhatsApp] QR polling timeout after', attempts, 'attempts');
          setIsWaitingForQR(false);
          if (!qrCode) {
            setError("انتهت مهلة انتظار رمز QR. يرجى المحاولة مرة أخرى.");
          }
        }
        return;
      }
      
      attempts++;
      console.log(`[WhatsApp] QR polling attempt ${attempts}/${maxAttempts}, status:`, status?.status, 'hasQR:', !!qrCode);
      
      // Only fetch QR if not connected yet
      if (status?.status !== 'CONNECTED' && !qrCode) {
        console.log('[WhatsApp] Fetching QR code...');
        await refreshQRCode();
      } else if (status?.status === 'CONNECTED' || qrCode) {
        console.log('[WhatsApp] QR polling stopped - Connected or QR received');
        setIsWaitingForQR(false);
        clearInterval(interval);
      }
    }, 1000); // Check every second
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isWaitingForQR, token]); // Removed status and qrCode to prevent re-triggering

  // Check permissions after all hooks
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة الواتساب</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
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
      console.log('[WhatsApp] QR API response:', { success: data.success, hasQR: !!data.qrCode, message: data.message });
      
      if (data.success && data.qrCode) {
        console.log('[WhatsApp] ✅ QR code received! Length:', data.qrCode.length);
        console.log('[WhatsApp] Setting QR code in state NOW');
        setQrCode(data.qrCode);
        setIsWaitingForQR(false); // Stop polling when QR is received
        setError(""); // Clear any errors
      } else {
        console.log('[WhatsApp] No QR code in response');
      }
    } catch (e: any) {
      console.error('[WhatsApp] QR refresh error:', e.message);
    }
  }

  async function startSession() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setQrCode(""); // Clear old QR code
      setIsWaitingForQR(true); // Start polling for QR
      
      const result = await startWhatsAppSession(token);
      if (result.success) {
        setSuccess("جاري تشغيل الجلسة... يرجى انتظار رمز QR");
        
        // Set QR code if returned immediately
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setIsWaitingForQR(false);
        }
        // If no QR yet, the useEffect will poll for it
        
        // Check status after starting
        await checkStatus();
      } else {
        setError(result.message || "فشل في بدء الجلسة");
        setIsWaitingForQR(false);
      }
    } catch (e: any) {
      setError(e.message);
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
                <button className="w-1/2 primary-button after:bg-[#131240]" onClick={startSession} disabled={loading}>

                  {loading ? <span>جاري البدء...</span> : <span> ربط حسابك</span>}
                </button>
              ) : (
                <Button className="w-1/2" onClick={stopSession} disabled={loading} variant="destructive">
                  {loading ? 'جاري الإيقاف...' : 'إيقاف الربط'}
                </Button>
              )}
            </div>
         
          
          {/* QR Code Display */}
          {qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center">
              <p className="text-sm text-white mb-4">
                امسح رمز QR هذا بتطبيق الواتساب على هاتفك للاتصال:
              </p>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="border border-gray-300 rounded-lg"
                  style={{ maxWidth: '300px', height: 'auto' }}
                />
              </div>
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
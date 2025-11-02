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

export default function WhatsAppConnectionPage() {
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
    const maxAttempts = 30; // Try for 30 seconds (increased to give more time for QR generation)
    
    const interval = setInterval(async () => {
      if (!isMounted || attempts >= maxAttempts) {
        clearInterval(interval);
        if (isMounted && attempts >= maxAttempts) {
          console.log('[WhatsApp] QR polling timeout after', attempts, 'attempts');
          setIsWaitingForQR(false);
          if (!qrCode) {
            setError("انتهت مهلة انتظار رمز QR. يرجى المحاولة مرة أخرى. تأكد من أن الاتصال بالإنترنت مستقر.");
          }
        }
        return;
      }
      
      attempts++;
      console.log(`[WhatsApp] QR polling attempt ${attempts}/${maxAttempts}, status:`, status?.status, 'hasQR:', !!qrCode);
      
      // Always try to fetch QR if not connected yet and no QR received
      if (status?.status !== 'CONNECTED' && !qrCode) {
        console.log('[WhatsApp] Fetching QR code...');
        await refreshQRCode();
      } else if (status?.status === 'CONNECTED') {
        console.log('[WhatsApp] Connected - stopping QR polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
      } else if (qrCode) {
        console.log('[WhatsApp] QR code received - stopping polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
      }
    }, 2000); // Check every 2 seconds (reduced frequency to avoid too many requests)
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isWaitingForQR, token, status?.status]); // Added status?.status to dependencies

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
        setError(""); // Clear any errors
        // Don't stop polling here - let the useEffect handle it
      } else {
        console.log('[WhatsApp] No QR code in response yet, will retry...');
        // Don't set error here - QR might still be generating
      }
    } catch (e: any) {
      console.error('[WhatsApp] QR refresh error:', e.message);
      // Only set error if it's not a "no QR yet" case
      if (!e.message.includes('No QR Code available')) {
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
        status: result.status,
        message: result.message
      });
      
      if (result.success) {
        // Set QR code if returned immediately in response
        if (result.qrCode) {
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
        setSuccess("Session stopped successfully!");
        setQrCode("");
        await checkStatus();
      } else {
        setError(result.message || "Failed to stop session");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!testPhoneNumber || !testMessage) {
      setError("Please enter both phone number and message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log(`[WhatsApp Frontend] Sending message to ${testPhoneNumber}: ${testMessage}`);
      const result = await sendWhatsAppMessage(token, testPhoneNumber, testMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
        setTestMessage("");
      } else {
        console.log(`[WhatsApp Frontend] Message send failed:`, result.message);
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('[WhatsApp Frontend] Send message error:', e);
      setError(`Send failed: ${e.message}`);
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

      {/* WhatsApp Connection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">WhatsApp Connection</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-primary">
                Status: {status?.status || 'Unknown'} • {status?.message || 'No session'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={loading} variant="secondary">
                Refresh
              </Button>
              {status?.status === 'disconnected' || !status ? (
                <Button onClick={startSession} disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    'Start Session'
                  )}
                </Button>
              ) : (
                <Button onClick={stopSession} disabled={loading} variant="destructive">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Stopping...
                    </span>
                  ) : (
                    'Stop Session'
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* QR Code Display */}
          {qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-primary mb-4">
                امسح رمز QR هذا بتطبيق الواتساب على هاتفك للاتصال:
              </p>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="border-2 border-gray-300 rounded-lg shadow-lg"
                  style={{ maxWidth: '350px', height: 'auto' }}
                  onError={(e) => {
                    console.error('[WhatsApp] QR image failed to load');
                    setError("فشل تحميل QR Code. يرجى المحاولة مرة أخرى.");
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                ⚠️ رمز QR صالح لمدة 60 ثانية فقط. إذا انتهت صلاحيته، اضغط "Start Session" مرة أخرى.
              </p>
            </div>
          )}
          
          {/* Show loading message while waiting for QR */}
          {isWaitingForQR && !qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-primary">
                جاري توليد رمز QR... يرجى الانتظار
              </p>
              <p className="text-xs text-gray-500">
                قد يستغرق هذا من 5 إلى 15 ثانية
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Send Test Message</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Phone Number (with country code)</label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello, this is a test message"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !testPhoneNumber || !testMessage}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
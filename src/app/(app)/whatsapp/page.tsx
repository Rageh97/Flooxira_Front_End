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

export default function WhatsAppPage() {
  const { canManageWhatsApp, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
    }
  }, [token]);

  // Auto-refresh QR code and status
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        checkStatus();
        // Always try to refresh QR while not connected
        if (!status || status?.status !== 'CONNECTED') refreshQRCode();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token, status?.status]);

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

  if (!hasActiveSubscription()) {
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
      setStatus(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function refreshQRCode() {
    try {
      const data = await getWhatsAppQRCode(token);
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (e: any) {
      console.log('QR refresh failed:', e.message);
    }
  }

  async function startSession() {
    try {
      setLoading(true);
      setError("");
      const result = await startWhatsAppSession(token);
      if (result.success) {
        setSuccess("تم بدء الجلسة بنجاح!");
        await checkStatus();
        await refreshQRCode();
      } else {
        setError(result.message || "فشل في بدء الجلسة");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function stopSession() {
    try {
      setLoading(true);
      setError("");
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

      {/* WhatsApp Connection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">اتصال الواتساب</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-primary">
                الحالة: {status?.status || 'غير معروف'} • {status?.message || 'لا توجد جلسة'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={loading} variant="secondary">
                تحديث
              </Button>
              {status?.status === 'disconnected' || !status ? (
                <Button onClick={startSession} disabled={loading}>
                  {loading ? 'جاري البدء...' : 'بدء الجلسة'}
                </Button>
              ) : (
                <Button onClick={stopSession} disabled={loading} variant="destructive">
                  {loading ? 'جاري الإيقاف...' : 'إيقاف الجلسة'}
                </Button>
              )}
            </div>
          </div>
          
          {/* QR Code Display */}
          {qrCode && status?.status !== 'CONNECTED' && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
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

      {/* Send Test Message */}
      <Card className="bg-card border-none">
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
      </Card>
    </div>
  );
}
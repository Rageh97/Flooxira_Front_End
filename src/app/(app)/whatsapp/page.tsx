"use client";
import { useEffect, useState, useRef } from "react";
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
import { getSocket, disconnectSocket } from "@/lib/socket";

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
  
  // ✅ Use ref to track QR code without causing re-renders
  const qrCodeRef = useRef<string>("");
  const statusRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";
  
  // ✅ Sync refs with state (without triggering effects)
  useEffect(() => {
    qrCodeRef.current = qrCode;
  }, [qrCode]);
  
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Load initial status
  useEffect(() => {
    if (token) {
      checkStatus();
    }
  }, [token]);

  // ✅ Socket.IO: Listen for QR code events
  useEffect(() => {
    if (!token) {
      console.log('[WhatsApp] ⚠️ No token available, skipping Socket.IO setup');
      return;
    }

    console.log('[WhatsApp] 🔌🔌🔌 Initializing Socket.IO connection...');
    console.log('[WhatsApp] Token available:', token.substring(0, 20) + '...');
    
    const socket = getSocket(token);
    if (!socket) {
      console.error('[WhatsApp] ❌❌❌ Failed to get socket instance');
      return;
    }

    console.log('[WhatsApp] Socket instance obtained:', {
      connected: socket.connected,
      id: socket.id,
      disconnected: socket.disconnected
    });

    // Setup listener function
    const setupListener = () => {
      console.log('[WhatsApp] 🔔 Setting up QR code listener NOW...');
      
      // Remove ALL existing listeners first to avoid duplicates
      socket.off('whatsapp:qr');
      socket.removeAllListeners('whatsapp:qr');
      
      // Listen for QR code event from backend
      const qrHandler = (data: any) => {
        console.log('[WhatsApp] 📥📥📥 QR Code EVENT RECEIVED via Socket.IO!');
        console.log('[WhatsApp] Full data received:', JSON.stringify({
          success: data.success,
          hasQR: !!data.qrCode,
          qrLength: data.qrCode?.length || 0,
          qrPreview: data.qrCode?.substring(0, 80) || 'N/A',
          userId: data.userId || 'N/A',
          message: data.message || 'N/A'
        }, null, 2));

        // Check if data is valid
        if (!data) {
          console.error('[WhatsApp] ❌ Received null/undefined data');
          return;
        }

        if (!data.success) {
          console.warn('[WhatsApp] ⚠️ Data success flag is false:', data);
          return;
        }

        if (!data.qrCode) {
          console.warn('[WhatsApp] ⚠️ No QR code in data:', data);
          return;
        }

        if (data.qrCode.length < 100) {
          console.warn('[WhatsApp] ⚠️ QR code too short:', data.qrCode.length);
          return;
        }

        // Validate QR code format
        if (!data.qrCode.startsWith('data:image')) {
          console.error('[WhatsApp] ❌ Invalid QR code format!');
          console.error('[WhatsApp] QR starts with:', data.qrCode.substring(0, 50));
          return;
        }

        console.log('[WhatsApp] ✅✅✅ VALID QR CODE! Setting in state NOW...');
        console.log('[WhatsApp] QR code length:', data.qrCode.length);
        console.log('[WhatsApp] QR code preview:', data.qrCode.substring(0, 80) + '...');
        
        // Set QR code in state - FORCE UPDATE
        console.log('[WhatsApp] Setting qrCode state from Socket.IO, length:', data.qrCode.length);
        setQrCode(data.qrCode);
        setIsWaitingForQR(false); // Stop polling
        setSuccess("✅ تم توليد رمز QR بنجاح. امسحه الآن!");
        setError(""); // Clear any errors
        
        console.log('[WhatsApp] ✅✅✅ QR code state updated! UI should show QR now!');
        console.log('[WhatsApp] Current status:', status?.status || 'null');
        
        // Force a re-render by updating a dummy state if needed
        setTimeout(() => {
          setQrCode((current) => {
            console.log('[WhatsApp] Post-setTimeout - QR in state:', current ? `EXISTS (${current.length})` : 'EMPTY');
            return current; // Keep current value, just log
          });
        }, 100);
      };
      
      socket.on('whatsapp:qr', qrHandler);
      console.log('[WhatsApp] ✅✅✅ QR code listener registered successfully!');
      console.log('[WhatsApp] Listening for event: whatsapp:qr');
      
      // ✅ Listen for status updates
      socket.off('whatsapp:status');
      const statusHandler = (data: any) => {
        console.log('[WhatsApp] 📊📊📊 Status EVENT RECEIVED via Socket.IO!');
        console.log('[WhatsApp] Status data:', {
          success: data.success,
          status: data.status,
          message: data.message,
          phoneNumber: data.phoneNumber || 'N/A'
        });

        if (data && data.success) {
          // Update status immediately
          setStatus({
            success: data.success,
            status: data.status,
            message: data.message,
            phoneNumber: data.phoneNumber
          });

          // Handle different statuses
          if (data.status === 'connected' || data.status === 'CONNECTED' || data.status === 'inChat') {
            console.log('[WhatsApp] ✅✅✅ CONNECTED via Socket.IO!');
            setSuccess(data.message || "✅ تم الاتصال بنجاح!");
            setQrCode(""); // Clear QR code
            setError("");
            setIsWaitingForQR(false);
          } else if (data.status === 'qr_generated') {
            console.log('[WhatsApp] 📱 QR Generated via Socket.IO');
            if (data.qrCode) {
              setQrCode(data.qrCode);
              setIsWaitingForQR(false);
            }
          } else if (data.status === 'disconnected') {
            console.log('[WhatsApp] ⚠️ Disconnected via Socket.IO');
            setError(data.message || "تم قطع الاتصال");
            setQrCode("");
            setIsWaitingForQR(false);
          } else if (data.status === 'initializing') {
            console.log('[WhatsApp] ⏳ Initializing via Socket.IO');
            setSuccess(data.message || "جاري التهيئة...");
          }
        }
      };

      socket.on('whatsapp:status', statusHandler);
      console.log('[WhatsApp] ✅ Status listener registered successfully!');
      
      // Also listen to ALL events for debugging
      socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`[WhatsApp] 📡 Socket.IO event received: ${eventName}`);
        if (eventName === 'whatsapp:qr') {
          console.log(`[WhatsApp] 🎯 QR EVENT! Args:`, args);
          // Call handler manually if it didn't fire
          if (args && args[0]) {
            qrHandler(args[0]);
          }
        } else if (eventName === 'whatsapp:status') {
          console.log(`[WhatsApp] 🎯 STATUS EVENT! Args:`, args);
          if (args && args[0]) {
            statusHandler(args[0]);
          }
        }
      });
    };

    // If already connected, set up listener immediately
    if (socket.connected) {
      console.log('[WhatsApp] ✅ Socket already connected, setting up listener immediately');
      setupListener();
    } else {
      console.log('[WhatsApp] ⏳ Socket not connected yet, waiting...');
      
      // Wait for connection
      const connectHandler = () => {
        console.log('[WhatsApp] ✅✅✅ Socket.IO CONNECTED! Setting up listener now');
        setupListener();
      };
      
      socket.on('connect', connectHandler);

      // Also set up listener immediately (wa-automate might emit before connection)
      console.log('[WhatsApp] Also setting up listener immediately (in case event fires early)');
      setupListener();
    }

    // Handle connection errors
    socket.on('connect_error', (error: any) => {
      console.error('[WhatsApp] ❌ Socket.IO connection error:', error.message);
      console.error('[WhatsApp] Error details:', error);
      setError(`خطأ في الاتصال: ${error.message}`);
    });

    // Debug: Log all socket events
    socket.on('disconnect', (reason: string) => {
      console.log('[WhatsApp] Socket disconnected:', reason);
    });

    // Cleanup on unmount
    return () => {
      console.log('[WhatsApp] Cleaning up Socket.IO listeners...');
      if (socket) {
        socket.off('whatsapp:qr');
        socket.off('whatsapp:status');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        console.log('[WhatsApp] ✅ Cleaned up Socket.IO listeners');
      }
    };
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

  // ✅ FIXED: Poll for QR code without infinite loop
  // Use refs to avoid dependencies that cause re-renders
  useEffect(() => {
    if (!isWaitingForQR || !token) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }
    
    console.log('[WhatsApp] 🔄 Starting QR code polling from API...');
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 120; // Try for 60 seconds (120 attempts * 500ms)
    
    // Start immediately
    refreshQRCode();
    
    const interval = setInterval(async () => {
      if (!isMounted) {
        clearInterval(interval);
        pollingIntervalRef.current = null;
        return;
      }
      
      attempts++;
      
      // ✅ Use refs instead of state to avoid dependencies
      const currentStatus = statusRef.current?.status;
      const currentQR = qrCodeRef.current;
      
      if (currentStatus === 'connected' || currentStatus === 'CONNECTED') {
        console.log('[WhatsApp] ✅ Connected - stopping QR polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
        pollingIntervalRef.current = null;
        return;
      }
      
      if (currentQR && currentQR.length > 100) {
        console.log('[WhatsApp] ✅ QR code received - stopping polling');
        setIsWaitingForQR(false);
        clearInterval(interval);
        pollingIntervalRef.current = null;
        return;
      }
      
      // Continue polling
      if (attempts <= maxAttempts) {
        if (attempts % 10 === 0) {
          console.log(`[WhatsApp] 🔄 QR polling attempt ${attempts}/${maxAttempts}... (status: ${currentStatus || 'null'})`);
        }
        await refreshQRCode();
      } else {
        console.log('[WhatsApp] ⏰ QR polling timeout after', attempts, 'attempts');
        setIsWaitingForQR(false);
        clearInterval(interval);
        pollingIntervalRef.current = null;
        if (!currentQR) {
          setError("انتهت مهلة انتظار رمز QR. يرجى المحاولة مرة أخرى.");
        }
      }
    }, 1000); // ✅ Changed to 1 second instead of 500ms to reduce load
    
    pollingIntervalRef.current = interval;
    
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
      pollingIntervalRef.current = null;
    };
  }, [isWaitingForQR, token]); // ✅ REMOVED status?.status and qrCode from dependencies!

  // ✅ FORCE UI UPDATE when QR code changes - ensures re-render
  useEffect(() => {
    if (qrCode && qrCode.length > 100) {
      console.log('[WhatsApp] 🎨 QR Code changed, forcing UI update');
      console.log('[WhatsApp] QR Code length:', qrCode.length);
      console.log('[WhatsApp] Current status:', status?.status || 'null');
      
      // Force a small state update to trigger re-render if needed
      // This ensures React re-renders even if the state didn't trigger it
      setTimeout(() => {
        console.log('[WhatsApp] ✅ Post-QR-change check complete');
      }, 50);
    }
  }, [qrCode]);

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
      console.log('[WhatsApp] Status check:', {
        status: data.status,
        message: data.message,
        hasQR: !!qrCode,
        qrLength: qrCode?.length || 0
      });
      
      setStatus(data);
      
      // Handle different statuses professionally
      if (data.status === 'connected' || data.status === 'CONNECTED' || data.status === 'inChat') {
        console.log('[WhatsApp] ✅ Connected! Clearing QR code');
        setSuccess(data.message || "✅ تم الاتصال بنجاح!");
        setQrCode(""); // Clear QR code when connected
        setError(""); // Clear any errors
        setIsWaitingForQR(false);
      } else if (data.status === 'disconnected') {
        console.log('[WhatsApp] ⚠️ Disconnected');
        // Don't clear QR immediately - might be reconnecting
        // Only show error if it's a real disconnect (not during init)
        if (!data.message?.includes('Browser closed')) {
          setError(data.message || "تم قطع الاتصال");
        }
        setIsWaitingForQR(false);
      } else if (data.status === 'qr_generated') {
        console.log('[WhatsApp] 📱 QR Generated');
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setIsWaitingForQR(false);
        }
        setSuccess(data.message || "تم توليد رمز QR. امسحه الآن!");
      } else if (data.status === 'initializing') {
        console.log('[WhatsApp] ⏳ Initializing');
        setSuccess(data.message || "جاري التهيئة...");
        // Don't clear QR or error during initialization
      }
      // DON'T clear QR on disconnected - user might still be scanning!
      // NEVER auto-refresh QR code - only when user explicitly starts session
    } catch (e: any) {
      console.error('[WhatsApp] Status check error:', e);
      setError(e.message || "فشل في التحقق من الحالة");
    }
  }

  async function refreshQRCode() {
    try {
      const timestamp = Date.now();
      // ✅ Reduced logging - only log every 10 seconds to prevent spam
      const shouldLogCall = timestamp % 10000 < 500;
      
      const data = await getWhatsAppQRCode(token);
      
      // ✅ Reduce logging frequency - only log when QR is found or every 10 seconds
      const shouldLog = !!data.qrCode || shouldLogCall;
      if (shouldLog) {
        console.log(`[WhatsApp] 📥 [${timestamp}] QR API response:`, { 
          success: data.success, 
          hasQR: !!data.qrCode, 
          qrLength: data.qrCode?.length || 0,
          message: data.message
        });
      }
      
      if (data.success && data.qrCode && data.qrCode.length > 100) {
        console.log(`[WhatsApp] ✅✅✅ [${timestamp}] VALID QR CODE RECEIVED!`);
        console.log('[WhatsApp] QR length:', data.qrCode.length);
        console.log('[WhatsApp] QR preview:', data.qrCode.substring(0, 80) + '...');
        
        // Validate QR code format (should start with data:image)
        if (data.qrCode.startsWith('data:image')) {
          console.log('[WhatsApp] ✅ Valid format (data:image), setting in state NOW...');
          console.log('[WhatsApp] Setting qrCode state with length:', data.qrCode.length);
          
          // FORCE state update
          setQrCode(data.qrCode);
          setIsWaitingForQR(false); // Stop polling when QR is received
          setSuccess("✅ تم توليد رمز QR بنجاح. امسحه الآن!");
          setError(""); // Clear any errors
          
          console.log('[WhatsApp] ✅✅✅ QR code set in state! UI should display it now!');
          console.log('[WhatsApp] Current status object:', status);
          console.log('[WhatsApp] Status.status value:', status?.status || 'undefined');
          
          // Force a re-render check with current state
          setTimeout(() => {
            // Use a callback to get the updated state
            setQrCode((currentQR) => {
              console.log('[WhatsApp] Post-setTimeout check - current qrCode in state:', currentQR ? `EXISTS (${currentQR.length})` : 'EMPTY');
              return currentQR; // Don't change, just log
            });
          }, 100);
        } else {
          console.error('[WhatsApp] ❌ Invalid QR code format!');
          console.error('[WhatsApp] QR starts with:', data.qrCode.substring(0, 50));
          setError("خطأ: تنسيق رمز QR غير صحيح");
        }
      } else {
        // ✅ Reduce logging - only log important messages
        if (data.qrCode && data.qrCode.length <= 100) {
          console.warn(`[WhatsApp] ⚠️ [${timestamp}] QR code too short: ${data.qrCode.length}`);
        }
        // Don't set error - QR might still be generating
        // Don't log "No QR code yet" to reduce console spam
      }
    } catch (e: any) {
      console.error(`[WhatsApp] ❌ QR refresh error:`, e);
      console.error(`[WhatsApp] Error message:`, e.message);
      console.error(`[WhatsApp] Error stack:`, e.stack);
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
      
      console.log('[WhatsApp] 🚀 Starting session...');
      
      // ✅ Ensure Socket.IO is connected before starting session
      const socket = getSocket(token);
      if (socket && !socket.connected) {
        console.log('[WhatsApp] Socket not connected, waiting for connection...');
        socket.connect();
      }
      
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
        if (result.qrCode && result.qrCode.length > 100 && result.qrCode.startsWith('data:image')) {
          console.log('[WhatsApp] ✅ QR code received immediately from startSession');
          console.log('[WhatsApp] QR code length:', result.qrCode.length);
          console.log('[WhatsApp] Setting qrCode state...');
          
          // FORCE state update
          setQrCode(result.qrCode);
          setSuccess("✅ تم توليد رمز QR بنجاح. امسحه الآن!");
          setIsWaitingForQR(false);
          
          console.log('[WhatsApp] ✅✅✅ QR code state set! Should appear in UI now');
          console.log('[WhatsApp] Current status:', status?.status || 'null');
        } else {
          // If no QR yet, start polling immediately
          console.log('[WhatsApp] ⏳ No QR in initial response, starting polling AND waiting for Socket.IO...');
          console.log('[WhatsApp] Socket.IO status:', socket?.connected ? '✅ Connected' : '❌ Not connected');
          setSuccess("جاري تشغيل الجلسة... يرجى انتظار رمز QR");
          setIsWaitingForQR(true); // Start polling for QR
          
          // Try to get QR code immediately (it might be ready now)
          setTimeout(async () => {
            console.log('[WhatsApp] First QR refresh attempt...');
            await refreshQRCode();
          }, 1000); // Wait 1 second then try to get QR
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
     {canManageWhatsApp() && hasActiveSubscription && (
        <UsageStats platform="whatsapp" />
      )}
     </div>

      {/* WhatsApp Connection */}
      <Card className=" gradient-border  w-1/2">
        <CardHeader className="border-text-primary/50 text-white flex items-center justify-between">اتصال الواتساب
        
        <div className="">
              <p className="text-sm  bg-green-900 text-white p-1 rounded-md">
                الحالة: <span className={`${status?.status === 'connected' || status?.status === 'CONNECTED' || status?.status === 'inChat' ? 'text-green-500' : 'text-red-300'}`}>
                  {status?.status === 'connected' || status?.status === 'CONNECTED' || status?.status === 'inChat' ? 'متصل' : 
                   status?.status === 'disconnected' ? 'غير متصل' :
                   status?.status === 'qr_generated' ? 'في انتظار QR' :
                   status?.status === 'initializing' ? 'جاري التهيئة' :
                   status?.status || 'غير معروف'}
                </span> 
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
         
          
          {/* QR Code Display - FIXED: Always show when QR exists */}
          {qrCode && qrCode.length > 100 && (!status || (status?.status !== 'connected' && status?.status !== 'CONNECTED')) && (
            <div className="text-center space-y-4 mt-4">
              <p className="text-sm text-white mb-4">
                امسح رمز QR هذا بتطبيق الواتساب على هاتفك للاتصال:
              </p>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="border-2 border-gray-300 rounded-lg shadow-lg bg-white p-2"
                  style={{ maxWidth: '350px', height: 'auto', display: 'block' }}
                  onLoad={() => {
                    console.log('[WhatsApp] ✅✅✅ QR IMAGE LOADED SUCCESSFULLY IN BROWSER!');
                    console.log('[WhatsApp] QR src length:', qrCode.length);
                  }}
                  onError={(e: any) => {
                    console.error('[WhatsApp] ❌ QR image failed to load');
                    console.error('[WhatsApp] QR data length:', qrCode.length);
                    console.error('[WhatsApp] QR data preview:', qrCode.substring(0, 100));
                    console.error('[WhatsApp] QR starts with:', qrCode.substring(0, 30));
                    console.error('[WhatsApp] Error event:', e);
                    setError("فشل تحميل QR Code. يرجى المحاولة مرة أخرى.");
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">
                ⚠️ رمز QR صالح لمدة 60 ثانية فقط. إذا انتهت صلاحيته، اضغط "ربط حسابك" مرة أخرى.
              </p>
            </div>
          )}
     
          
          {/* Show loading message while waiting for QR */}
          {isWaitingForQR && !qrCode && status?.status !== 'connected' && status?.status !== 'CONNECTED' && (
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
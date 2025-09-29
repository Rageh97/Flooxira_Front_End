"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getTelegramPersonalStatus,
  getTelegramPersonalQR,
  startTelegramPersonal,
  stopTelegramPersonal,
  sendTelegramPersonalMessage,
} from "@/lib/api";

export default function TelegramPage() {
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testChatId, setTestChatId] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [botToken, setBotToken] = useState(""); // reserved if later needed

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
    }
  }, [token]);

  async function checkStatus() {
    try {
      const data = await getTelegramPersonalStatus(token);
      setStatus(data);
      if (data.status !== 'CONNECTED') {
        try {
          const q = await getTelegramPersonalQR(token);
          if (q.success && q.qrCode) setQrCode(q.qrCode);
        } catch {}
      } else {
        setQrCode("");
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function startPersonal() {
    try {
      setLoading(true);
      setError("");
      const result = await startTelegramPersonal(token);
      if (result.success) {
        setSuccess('Session starting... Scan QR if shown');
        if (result.qrCode) setQrCode(result.qrCode);
      } else {
        setError(result.message || 'Failed to start');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function stopPersonal() {
    try {
      setLoading(true);
      setError("");
      const result = await stopTelegramPersonal(token);
      if (result.success) {
        setSuccess("Bot stopped successfully!");
        await checkStatus();
      } else {
        setError(result.message || "Failed to stop bot");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!testChatId || !testMessage) {
      setError("Please enter both chat ID and message");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log(`[Telegram Frontend] Sending message to ${testChatId}: ${testMessage}`);
      const result = await sendTelegramPersonalMessage(token, testChatId, testMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
        setTestMessage("");
      } else {
        console.log(`[Telegram Frontend] Message send failed:`, result.message);
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('[Telegram Frontend] Send message error:', e);
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

      {/* Telegram Personal Connection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Telegram Personal Connection</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Status: {status?.status || 'Unknown'} • {status?.message || 'No bot'}
              </p>
              {qrCode && status?.status !== 'CONNECTED' && (
                <div className="mt-3">
                  <img src={qrCode} alt="Telegram QR" className="max-w-[260px] rounded border border-text-primary" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={loading} variant="secondary">
                Refresh
              </Button>
              {status?.status !== 'CONNECTED' ? (
                <Button onClick={startPersonal} disabled={loading}>
                  {loading ? 'Starting...' : 'Start Session'}
                </Button>
              ) : (
                <Button onClick={stopPersonal} disabled={loading} variant="destructive">
                  {loading ? 'Stopping...' : 'Stop Session'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Send Test Message</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Chat ID (user ID, group ID, or channel ID)</label>
              <input
                type="text"
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="@username or chat ID"
                className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello, this is a test message"
                className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md"
              />
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !testChatId || !testMessage}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getTelegramStatus, 
  sendTelegramMessage,
  createTelegramBot,
  getTelegramBotInfo,
  stopTelegramBot,
} from "@/lib/api";

export default function TelegramConnectionPage() {
  const [status, setStatus] = useState<any>(null);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [testChatId, setTestChatId] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [botToken, setBotToken] = useState("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
    }
  }, [token]);

  async function checkStatus() {
    try {
      const data = await getTelegramStatus(token);
      setStatus(data);
      if (data.status === 'connected') {
        const botData = await getTelegramBotInfo(token);
        if (botData.success) {
          setBotInfo(botData.bot);
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function createBot() {
    if (!botToken.trim()) {
      setError("Please enter a bot token");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await createTelegramBot(token, botToken);
      if (result.success) {
        setSuccess("Bot created successfully!");
        await checkStatus();
      } else {
        setError(result.message || "Failed to create bot");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function stopBot() {
    try {
      setLoading(true);
      setError("");
      const result = await stopTelegramBot(token);
      if (result.success) {
        setSuccess("Bot stopped successfully!");
        setBotInfo(null);
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
      const result = await sendTelegramMessage(token, testChatId, testMessage);
      
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

      {/* Telegram Bot Connection */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Telegram Bot Connection</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Status: {status?.status || 'Unknown'} • {status?.message || 'No bot'}
              </p>
              {botInfo && (
                <div className="mt-2 text-sm text-gray-300">
                  <p>Bot: @{botInfo.username} ({botInfo.first_name})</p>
                  <p>ID: {botInfo.id}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStatus} disabled={loading} variant="secondary">
                Refresh
              </Button>
              {status?.status === 'disconnected' || !status ? (
                <Button onClick={createBot} disabled={loading || !botToken.trim()}>
                  {loading ? 'Creating...' : 'Create Bot'}
                </Button>
              ) : (
                <Button onClick={stopBot} disabled={loading} variant="destructive">
                  {loading ? 'Stopping...' : 'Stop Bot'}
                </Button>
              )}
            </div>
          </div>
          
          {/* Bot Token Input */}
          {(!status || status?.status === 'disconnected') && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Bot Token</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Enter your bot token from @BotFather"
                  className="flex-1 px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md"
                />
                <Button 
                  onClick={createBot} 
                  disabled={loading || !botToken.trim()}
                >
                  Create
                </Button>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Get your bot token from @BotFather on Telegram
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
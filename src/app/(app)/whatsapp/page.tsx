"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getWhatsAppStatus, 
  uploadKnowledgeBase, 
  getKnowledgeBase, 
  deleteKnowledgeEntry,
  sendWhatsAppMessage
} from "@/lib/api";

export default function WhatsAppPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<{ id: number; keyword: string; answer: string; isActive: boolean }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
      loadKnowledgeBase();
    }
  }, [token]);

  async function checkStatus() {
    try {
      const statusData = await getWhatsAppStatus(token);
      setStatus(statusData);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadKnowledgeBase() {
    try {
      const data = await getKnowledgeBase(token);
      setKnowledgeEntries(data.entries);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // No session start needed with Cloud API

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      setError("");
      await uploadKnowledgeBase(token, file);
      await loadKnowledgeBase();
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    try {
      await deleteKnowledgeEntry(token, id);
      await loadKnowledgeBase();
    } catch (e: any) {
      setError(e.message);
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
      const result = await sendWhatsAppMessage(token, testPhoneNumber, testMessage);
      console.log('Send message result:', result);
      setError("Message sent successfully!");
      setTestMessage("");
    } catch (e: any) {
      console.error('Send message error:', e);
      setError(`Send failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">WhatsApp Bot</h1>
      
      {error && (
        <div className={`rounded-md p-4 ${error.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* WhatsApp Business Connection */}
      <Card>
        <CardHeader>WhatsApp Business</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {status ? `Configured • Phone Number ID: ${status.phoneNumberId}` : 'Not configured. Go to Settings → WhatsApp Business to configure.'}
              </p>
            </div>
            <Button onClick={checkStatus} disabled={loading}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card>
        <CardHeader>Send Test Message</CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number (with country code)</label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
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

      {/* Knowledge Base Upload */}
      <Card>
        <CardHeader>Knowledge Base</CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Excel File</label>
            <p className="mb-2 text-xs text-gray-500">
              Upload an Excel file with "keyword" and "answer" columns. The bot will use this data to respond to messages.
            </p>
            <div className="flex gap-2">
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || loading}
                size="sm"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <Card>
          <CardHeader>Knowledge Base Entries ({knowledgeEntries.length})</CardHeader>
          <CardContent>
            <div className="space-y-2">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{entry.keyword}</div>
                    <div className="text-xs text-gray-500">{entry.answer}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bot Features Info */}
      <Card>
        <CardHeader>Bot Features</CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
              <span>Basic Plan: Responds using your knowledge base only</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
              <span>Pro Plan: Uses knowledge base + OpenAI for unknown queries</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
              <span>Fuzzy matching finds similar keywords automatically</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










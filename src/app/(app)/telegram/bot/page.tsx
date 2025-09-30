"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  uploadKnowledgeBase, 
  getKnowledgeBase, 
  deleteKnowledgeEntry,
  tgWebGroups
} from "@/lib/api";

export default function TelegramBotPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<{ id: number; keyword: string; answer: string; isActive: boolean }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [autoResponse, setAutoResponse] = useState<boolean>(false);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadKnowledgeBase();
      loadGroups();
    }
  }, [token]);

  async function loadKnowledgeBase() {
    try {
      const data = await getKnowledgeBase(token);
      if (data.success) {
        setKnowledgeEntries(data.entries);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadGroups() {
    if (!token) return;
    setLoadingGroups(true);
    try {
      const res = await tgWebGroups(token);
      setGroups(res.groups || []);
    } catch (e: any) {
      setError("Failed to load groups and channels");
    }
    setLoadingGroups(false);
  }

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      setError("");
      const result = await uploadKnowledgeBase(token, file);
      if (result.success) {
        setSuccess("Knowledge base uploaded successfully!");
        setFile(null);
        await loadKnowledgeBase();
      } else {
        setError(result.message || "Upload failed");
      }
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

  async function saveOpenAISettings() {
    try {
      setLoading(true);
      // Save OpenAI key and auto-response settings
      localStorage.setItem('telegram_openai_key', openaiKey);
      localStorage.setItem('telegram_auto_response', autoResponse.toString());
      setSuccess("Settings saved successfully!");
    } catch (e: any) {
      setError(e.message);
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

      {/* Bot Configuration */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold text-white">Telegram Bot Configuration</h3>
          <p className="text-sm text-gray-400">Configure your Telegram bot for automatic responses</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">OpenAI API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Your OpenAI API key for AI-powered responses
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-response"
                checked={autoResponse}
                onChange={(e) => setAutoResponse(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="auto-response" className="text-sm text-white">
                Enable Auto Response
              </label>
            </div>
          </div>
          <Button 
            onClick={saveOpenAISettings}
            disabled={loading}
            className="bg-blue-500 text-white"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Knowledge Base Upload */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold text-white">Knowledge Base Management</h3>
          <p className="text-sm text-gray-400">Upload Excel file with keyword-answer pairs for bot responses</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Upload Excel File</label>
            <p className="mb-2 text-xs text-gray-300">
              Upload an Excel file with "keyword" and "answer" columns. The bot will prioritize this data over OpenAI responses.
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
                className="bg-green-500 text-white"
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

      {/* Connected Groups & Channels */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Connected Groups & Channels</h3>
              <p className="text-sm text-gray-400">Groups and channels where your bot is active</p>
            </div>
            <Button 
              onClick={loadGroups} 
              disabled={loadingGroups}
              variant="outline"
              size="sm"
            >
              {loadingGroups ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{group.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{group.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No groups or channels connected</div>
              <div className="text-sm text-gray-500">Connect your Telegram account to see available groups and channels</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50">
            <h3 className="text-lg font-semibold text-white">Knowledge Base Entries ({knowledgeEntries.length})</h3>
            <p className="text-sm text-gray-400">Current keyword-answer pairs in your knowledge base</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{entry.keyword}</div>
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

      {/* Bot Response Priority Info */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold text-white">Response Priority</h3>
          <p className="text-sm text-gray-400">How your bot prioritizes responses to incoming messages</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-white"><strong className="text-primary">1. Knowledge Base:</strong> Exact and fuzzy matches from your Excel file</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-white"><strong className="text-primary">2. OpenAI:</strong> AI responses for unknown queries</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span className="text-white"><strong className="text-primary">3. Fallback:</strong> Default responses when all else fails</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


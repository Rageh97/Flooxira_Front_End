"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getTelegramStatus, 
  uploadTelegramKnowledgeBase, 
  getTelegramKnowledgeBase, 
  deleteTelegramKnowledgeEntry,
  sendTelegramMessage,
  createTelegramBot,
  getTelegramBotInfo,
  stopTelegramBot,
  getTelegramChatHistory,
  getTelegramChatContacts,
  getTelegramBotStats,
  listTelegramGroups,
  sendToTelegramGroup,
  sendToTelegramGroupsBulk,
  startTelegramCampaign,
  API_URL,
} from "@/lib/api";

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState<'connection' | 'bot' | 'chats' | 'stats' | 'groups' | 'campaigns'>('connection');
  const [status, setStatus] = useState<any>(null);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<{ id: number; keyword: string; answer: string; isActive: boolean }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [testChatId, setTestChatId] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [botToken, setBotToken] = useState("");
  
  // Chat management state
  const [chats, setChats] = useState<Array<{ id: number; chatId: string; chatType: string; chatTitle: string; messageType: 'incoming' | 'outgoing'; messageContent: string; responseSource: string; knowledgeBaseMatch: string | null; timestamp: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ chatId: string; chatType: string; chatTitle: string; messageCount: number; lastMessageTime: string }>>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [botStats, setBotStats] = useState<any>(null);

  // Groups/Status state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; type: string; messageCount: number }>>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>("");
  const [groupMedia, setGroupMedia] = useState<File | null>(null);
  const [groupScheduleAt, setGroupScheduleAt] = useState<string>("");

  // Campaigns state
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignTemplate, setCampaignTemplate] = useState<string>("مرحبا {{name}} …");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(3000);
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      checkStatus();
      loadKnowledgeBase();
      loadBotStats();
    }
  }, [token]);

  // Auto-refresh status
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        checkStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Load chat data when switching to chats tab
  useEffect(() => {
    if (activeTab === 'chats' && token) {
      loadChatContacts();
      if (selectedContact) {
        loadChatHistory(selectedContact);
      }
    }
  }, [activeTab, token, selectedContact]);

  // Load groups on groups tab
  useEffect(() => {
    if (activeTab === 'groups' && token) {
      handleListGroups();
    }
  }, [activeTab, token]);

  async function checkStatus() {
    try {
      const statusData = await getTelegramStatus(token);
      setStatus(statusData);
      
      if (statusData.success && statusData.botInfo) {
        setBotInfo(statusData.botInfo);
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
        setStatus({ status: 'connected', message: 'Bot created successfully' });
        setBotInfo(result.botInfo);
        setBotToken("");
        setSuccess("Telegram bot created successfully!");
      } else {
        setError(result.message);
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
        setStatus({ status: 'disconnected', message: 'Bot stopped' });
        setBotInfo(null);
        setSuccess("Telegram bot stopped successfully!");
      } else {
        setError(result.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadKnowledgeBase() {
    try {
      const data = await getTelegramKnowledgeBase(token);
      setKnowledgeEntries(data.entries);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadChatContacts() {
    try {
      const data = await getTelegramChatContacts(token);
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadChatHistory(chatId: string) {
    try {
      const data = await getTelegramChatHistory(token, chatId);
      if (data.success) {
        setChats(data.chats);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadBotStats() {
    try {
      const data = await getTelegramBotStats(token);
      if (data.success) {
        setBotStats(data.stats);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      setError("");
      await uploadTelegramKnowledgeBase(token, file);
      await loadKnowledgeBase();
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setSuccess("Knowledge base uploaded successfully!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    try {
      await deleteTelegramKnowledgeEntry(token, id);
      await loadKnowledgeBase();
      setSuccess("Knowledge base entry deleted successfully!");
    } catch (e: any) {
      setError(e.message);
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
      const result = await sendTelegramMessage(token, testChatId, testMessage);
      
      if (result.success) {
        setSuccess("Message sent successfully!");
        setTestMessage("");
      } else {
        setError(result.message || "Failed to send message");
      }
    } catch (e: any) {
      console.error('Send message error:', e);
      setError(`Send failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleListGroups() {
    try {
      const res = await listTelegramGroups(token);
      if (res.success) setGroups(res.groups);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSendToGroup() {
    try {
      setLoading(true);
      setError("");
      if (!selectedGroupIds.length) throw new Error('Please select at least one group');
      if (!groupMessage && !groupMedia) throw new Error('Enter message or attach media');
      const res = await sendToTelegramGroupsBulk(token, {
        groupIds: selectedGroupIds,
        message: groupMessage || undefined,
        mediaFile: groupMedia,
        scheduleAt: groupScheduleAt || undefined
      });
      if (res.success) setSuccess(res.message || 'Sent');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCampaign() {
    if (!campaignFile || !campaignTemplate) { setError('Upload file and enter template'); return; }
    try {
      setLoading(true);
      setError("");
      const res = await startTelegramCampaign(
        token,
        campaignFile,
        campaignTemplate,
        campaignThrottle,
        campaignMedia || undefined,
        campaignScheduleAt || undefined,
        campaignDailyCap ? Number(campaignDailyCap) : undefined,
        campaignPerNumberDelay ? Number(campaignPerNumberDelay) : undefined
      );
      if (res.success) setSuccess(res.message || (res.summary ? `Campaign done: sent ${res.summary?.sent}/${res.summary?.total}` : 'Scheduled'));
      else setError(res.message || 'Campaign failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Telegram Bot Management</h1>
      
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

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-card p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'connection'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white '
          }`}
        >
          Connection
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bot'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white '
          }`}
        >
          Bot Settings
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chats'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white'
          }`}
        >
          Chat History
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'groups'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white'
          }`}
        >
          Groups & Broadcasting
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-light-custom text-white shadow-sm'
              : 'text-white'
          }`}
        >
          Campaigns
        </button>
      </div>

      {/* Connection Tab */}
      {activeTab === 'connection' && (
        <div className="space-y-6">
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
      )}

      {/* Bot Settings Tab */}
      {activeTab === 'bot' && (
        <div className="space-y-6">
          {/* Knowledge Base Upload */}
          <Card className="bg-card border-none">
            <CardHeader className="border-text-primary/50 text-primary">Knowledge Base Management</CardHeader>
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
            <Card className="bg-card border-none">
              <CardHeader className="border-text-primary/50 text-primary">Knowledge Base Entries ({knowledgeEntries.length})</CardHeader>
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

          {/* Bot Response Priority Info */}
          <Card className="bg-card border-none">
            <CardHeader className="border-text-primary/50 text-primary">Response Priority</CardHeader>
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
      )}

      {/* Chat History Tab */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Contacts List */}
            <Card className="bg-card border-none">
              <CardHeader className="border-text-primary/50 text-primary">Contacts ({contacts.length})</CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.chatId}
                      onClick={() => {
                        setSelectedContact(contact.chatId);
                        loadChatHistory(contact.chatId);
                      }}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedContact === contact.chatId
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm">{contact.chatTitle || contact.chatId}</div>
                      <div className="text-xs text-gray-500">
                        {contact.messageCount} messages • {contact.chatType} • {new Date(contact.lastMessageTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <div className="md:col-span-2">
              <Card className="bg-card border-none">
                <CardHeader className="border-text-primary/50 text-primary">
                  {selectedContact ? `Chat with ${contacts.find(c => c.chatId === selectedContact)?.chatTitle || selectedContact}` : 'Select a contact to view messages'}
                </CardHeader>
                <CardContent>
                  {selectedContact ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`flex ${chat.messageType === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs p-3 rounded-lg ${
                              chat.messageType === 'outgoing'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="text-sm">{chat.messageContent}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(chat.timestamp).toLocaleTimeString()}
                              {chat.responseSource && (
                                <span className="ml-2">
                                  ({chat.responseSource === 'knowledge_base' ? 'KB' : chat.responseSource === 'openai' ? 'AI' : 'FB'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Select a contact to view chat history</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {botStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card border-none">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-500">{botStats.totalMessages}</div>
                  <p className="text-xs text-primary">Total Messages</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-none">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-primary">{botStats.totalContacts}</div>
                  <p className="text-xs text-primary">Total Contacts</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-none">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-yellow-500">{botStats.incomingMessages}</div>
                  <p className="text-xs text-primary">Incoming Messages</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-none">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-500">{botStats.outgoingMessages}</div>
                  <p className="text-xs text-primary">Bot Responses</p>
                </CardContent>
              </Card>
            </div>
          )}

          {botStats && (
            <Card className="bg-card border-none">
              <CardHeader className="border-text-primary/50 text-primary">Response Sources</CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Knowledge Base</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.knowledgeBaseResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-white">{botStats.knowledgeBaseResponses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">OpenAI</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.openaiResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-white">{botStats.openaiResponses}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Fallback</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full" 
                          style={{ width: `${(botStats.fallbackResponses / botStats.outgoingMessages) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-white">{botStats.fallbackResponses}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Groups & Broadcasting Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <Card className="bg-card border-none">
            <CardHeader className="border-text-primary/50 text-primary">Groups & Channels</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={handleListGroups} variant="secondary" disabled={loading}>Refresh</Button>
                <span className="text-sm text-white">{groups.length} groups/channels</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Select Groups/Channels</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedGroupIds.length === groups.length && groups.length > 0} onChange={(e) => setSelectedGroupIds(e.target.checked ? groups.map(g => g.id) : [])} />
                      <span className="text-sm text-white">Select All</span>
                    </div>
                    {groups.map(g => (
                      <label key={g.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(g.id)}
                          onChange={(e) => {
                            const next = new Set(selectedGroupIds);
                            if (e.target.checked) next.add(g.id); else next.delete(g.id);
                            setSelectedGroupIds(Array.from(next));
                          }}
                        />
                        <span className="text-white">{g.name} ({g.type}) - {g.messageCount} msgs</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Message</label>
                    <textarea className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" rows={3} placeholder="Type your message... (optional if media attached)" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Media (image/video/document)</label>
                    <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setGroupMedia(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Schedule (optional)</label>
                    <input 
                      type="datetime-local" 
                      className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" 
                      value={groupScheduleAt} 
                      onChange={(e) => setGroupScheduleAt(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendToGroup} disabled={loading || selectedGroupIds.length === 0 || (!groupMessage && !groupMedia)}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <Card className="bg-card border-none">
            <CardHeader className="border-text-primary/50 text-primary">Start Campaign</CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Upload Excel (columns: chatId, name, message)</label>
                  <input type="file" accept=".xlsx" onChange={(e) => setCampaignFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Message Template</label>
                  <textarea className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
                  <p className="text-xs text-gray-300 mt-1">Use {'{{name}}'} placeholder.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Throttle (ms between messages)</label>
                <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '3000'))} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Media (image/video/document, optional)</label>
                  <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Schedule (optional)</label>
                  <input type="datetime-local" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignScheduleAt} onChange={(e) => setCampaignScheduleAt(e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Daily cap (numbers/day, optional)</label>
                  <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Per-number delay (ms, optional)</label>
                  <input type="number" className="w-full px-3 py-2 border border-text-primary outline-none bg-gray-700/30 text-white rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : '')} />
                </div>
              </div>
              <Button onClick={handleStartCampaign} disabled={loading || !campaignFile || !campaignTemplate}>Start Campaign</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
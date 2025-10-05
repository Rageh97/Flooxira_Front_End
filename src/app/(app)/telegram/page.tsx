"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  uploadKnowledgeBase, 
  getKnowledgeBase, 
  deleteKnowledgeEntry,
  tgWebGroups,
  telegramBotConnect,
  telegramBotInfo,
  telegramBotTest,
  telegramBotSendMessage,
  telegramBotGetChat,
  telegramBotGetChatAdmins,
  telegramBotPromoteMember,
  telegramBotGetUpdates,
  telegramBotGetChatMembers,
  telegramBotExportMembers,
  telegramBotGetBotChats
} from "@/lib/api";
import Link from "next/link";

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
  const [botToken, setBotToken] = useState<string>("");
  const [botInfo, setBotInfo] = useState<{ botUserId: string; username?: string; name?: string } | null>(null);
  
  // Bot Management States
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [chatId, setChatId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [chatAdmins, setChatAdmins] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [chatMembers, setChatMembers] = useState<any>({ totalCount: 0, members: [], note: '' });
  const [promoteMemberId, setPromoteMemberId] = useState<string>("");
  const [botChats, setBotChats] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>({
    can_manage_chat: false,
    can_delete_messages: false,
    can_manage_video_chats: false,
    can_restrict_members: false,
    can_promote_members: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
    can_post_messages: false,
    can_edit_messages: false,
    can_manage_topics: false,
    can_post_stories: false,
    can_edit_stories: false,
    can_delete_stories: false,
    can_manage_direct_messages: false
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadKnowledgeBase();
      loadGroups();
      loadBotInfo();
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

  async function loadBotInfo() {
    try {
      const res = await telegramBotInfo(token);
      setBotInfo(res.bot || null);
    } catch {
      // ignore
    }
  }

  async function sendBotMessage() {
    if (!chatId || !message) return;
    
    // Clean and validate chat ID
    let cleanChatId = chatId.trim();
    
    // Remove + signs and other invalid characters for numeric IDs
    if (!cleanChatId.startsWith('@')) {
      cleanChatId = cleanChatId.replace(/[^-0-9]/g, '');
    }
    
    if (!cleanChatId) {
      setError("Invalid chat ID format");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      const res = await telegramBotSendMessage(token, cleanChatId, message);
      if (res.success) {
        setSuccess("Message sent successfully!");
        setMessage("");
        setChatId(""); // Clear the input
      } else {
        setError("Failed to send message");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadChatInfo() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotGetChat(token, chatId);
      if (res.success) {
        setChatInfo(res.chat);
        setSuccess("Chat info loaded!");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadChatAdmins() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotGetChatAdmins(token, chatId);
      if (res.success) {
        setChatAdmins(res.administrators || []);
        setSuccess("Admins loaded!");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function promoteMember() {
    if (!chatId || !promoteMemberId) return;
    try {
      setLoading(true);
      setError("");
      const res = await telegramBotPromoteMember(token, chatId, promoteMemberId, permissions);
      if (res.success) {
        setSuccess("Member promoted successfully!");
        setPromoteMemberId("");
        await loadChatAdmins();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUpdates() {
    try {
      setLoading(true);
      const res = await telegramBotGetUpdates(token);
      if (res.success) {
        setUpdates(res.updates || []);
        setSuccess("Updates loaded!");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadChatMembers() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotGetChatMembers(token, chatId);
      if (res.success) {
        setChatMembers({
          totalCount: res.totalCount || 0,
          members: res.members || [],
          note: res.note || ''
        });
        setSuccess("Members loaded!");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportMembers() {
    if (!chatId) return;
    try {
      setLoading(true);
      setError("");
      const res = await telegramBotExportMembers(token, chatId);
      if (res.success) {
        setSuccess(`Excel file downloaded: ${res.filename}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBotChats() {
    try {
      setLoading(true);
      const res = await telegramBotGetBotChats(token);
      if (res.success) {
        setBotChats(res.chats || []);
        setSuccess(`Found ${res.total || 0} chats where your bot is active!`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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

  const tabs = [
    { id: "overview", name: "Overview", icon: "🤖" },
    { id: "messaging", name: "Send Messages", icon: "💬" },
    { id: "chat-management", name: "Chat Management", icon: "👥" },
    { id: "admin-tools", name: "Admin Tools", icon: "⚙️" },
    { id: "groups", name: "My Groups & Channels", icon: "🏢" },
    { id: "knowledge-base", name: "Knowledge Base", icon: "📚" },
    { id: "updates", name: "Recent Updates", icon: "🔄" }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">🚀 Quick Actions</h3>
          <p className="text-sm text-gray-400">Access key features quickly</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/telegram-templates"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              📝 Manage Templates
            </Link>
            <Link 
              href="/telegram-templates"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              ➕ Create New Template
            </Link>
          </div>
        </CardContent>
      </Card>

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

      {/* Bot Connection Status */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold text-white">Bot Status</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {botInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">@{botInfo.username}</div>
                    <div className="text-gray-400 text-sm">{botInfo.name} • ID: {botInfo.botUserId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError("");
                        const res = await telegramBotTest(token);
                        if (res.success) {
                          setSuccess(`Bot test successful! Can join groups: ${res.bot?.can_join_groups}`);
                        } else {
                          setError(res.message || "Bot test failed");
                        }
                      } catch (e: any) {
                        setError(e.message || "Bot test failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Testing...' : 'Test Bot'}
                  </Button>
                  <div className="text-green-500 text-sm">Connected</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="123456:ABC-DEF..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <div>
                <Button
                  className="w-full"
                  disabled={loading || !botToken}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      const res = await telegramBotConnect(token, botToken);
                      if (res.success) {
                        setSuccess("Bot connected successfully");
                        setBotToken("");
                        await loadBotInfo();
                      } else {
                        setError(res.message || "Failed to connect bot");
                      }
                    } catch (e: any) {
                      setError(e.message || "Failed to connect bot");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'Connecting...' : 'Connect Bot'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Management Tabs - Only show if bot is connected */}
      {botInfo && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">{renderTabContent()}</div>
        </>
      )}
    </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "messaging":
        return renderMessagingTab();
      case "chat-management":
        return renderChatManagementTab();
      case "admin-tools":
        return renderAdminToolsTab();
      case "groups":
        return renderGroupsTab();
      case "knowledge-base":
        return renderKnowledgeBaseTab();
      case "updates":
        return renderUpdatesTab();
      default:
        return renderOverviewTab();
    }
  }

  function renderOverviewTab() {
    return (
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Bot Overview</h3>
          <p className="text-sm text-gray-400">Manage your Telegram bot configuration and AI responses</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Enable AI-powered responses using OpenAI
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-8">
              <input
                type="checkbox"
                id="auto-response"
                checked={autoResponse}
                onChange={(e) => setAutoResponse(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="auto-response" className="text-sm text-white">
                Enable Auto Response to Messages
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
    );
  }

  function renderMessagingTab() {
    return (
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Send Messages</h3>
          <p className="text-sm text-gray-400">Send messages to users, groups, or channels</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Chat ID</label>
            <Input
              placeholder="@username, 123456789, or -100123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full"
            />
            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-400">
                <strong>Examples:</strong>
              </p>
              <p className="text-xs text-gray-300">
                • User: <code className="bg-gray-700 px-1 rounded">123456789</code> or <code className="bg-gray-700 px-1 rounded">@username</code>
              </p>
              <p className="text-xs text-gray-300">
                • Group: <code className="bg-gray-700 px-1 rounded">-100123456789</code> or <code className="bg-gray-700 px-1 rounded">@groupname</code>
              </p>
              <p className="text-xs text-yellow-400">
                💡 Send a message to your bot first, then check "Recent Updates" to see your user ID
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Message</label>
            <textarea
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-24 p-3 border rounded-md bg-gray-800 text-white border-gray-600"
              rows={4}
            />
          </div>
          <Button 
            onClick={sendBotMessage}
            disabled={loading || !chatId || !message}
            className="bg-green-500 text-white"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderChatManagementTab() {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Chat Information</h3>
            <p className="text-sm text-gray-400">Get details about groups, channels, or users</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Chat ID or @username"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={loadChatInfo}
                disabled={loading || !chatId}
                className="bg-blue-500 text-white"
              >
                {loading ? 'Loading...' : 'Get Info'}
              </Button>
            </div>
            
            {chatInfo && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Chat Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Title:</span> <span className="text-white">{chatInfo.title || chatInfo.first_name || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Type:</span> <span className="text-white">{chatInfo.type}</span></div>
                  <div><span className="text-gray-400">ID:</span> <span className="text-white">{chatInfo.id}</span></div>
                  {chatInfo.description && <div><span className="text-gray-400">Description:</span> <span className="text-white">{chatInfo.description}</span></div>}
                  {chatInfo.member_count && <div><span className="text-gray-400">Members:</span> <span className="text-white">{chatInfo.member_count}</span></div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Chat Administrators</h3>
            <p className="text-sm text-gray-400">View and manage chat administrators</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={loadChatAdmins}
              disabled={loading || !chatId}
              className="bg-purple-500 text-white"
            >
              {loading ? 'Loading...' : 'Load Administrators'}
            </Button>
            
            {chatAdmins.length > 0 && (
              <div className="space-y-2">
                {chatAdmins.map((admin, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">
                        {admin.user.first_name} {admin.user.last_name || ''}
                        {admin.user.username && <span className="text-gray-400"> (@{admin.user.username})</span>}
                      </div>
                      <div className="text-sm text-gray-400">{admin.status}</div>
                    </div>
                    <div className="text-xs text-gray-500">ID: {admin.user.id}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Group/Channel Members</h3>
            <p className="text-sm text-gray-400">View and export member information</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={loadChatMembers}
                disabled={loading || !chatId}
                className="bg-blue-500 text-white"
              >
                {loading ? 'Loading...' : 'Load Members'}
              </Button>
              <Button 
                onClick={exportMembers}
                disabled={loading || !chatId || chatMembers.members.length === 0}
                className="bg-green-500 text-white"
              >
                {loading ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </div>
            
            {chatMembers.note && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>⚠️ Note:</strong> {chatMembers.note}
                </p>
              </div>
            )}
            
            {chatMembers.totalCount > 0 && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-300">
                  <strong>Total Members:</strong> {chatMembers.totalCount} • 
                  <strong> Showing:</strong> {chatMembers.members.length} administrators
                </div>
              </div>
            )}
            
            {chatMembers.members.length > 0 && (
              <div className="space-y-2">
                {chatMembers.members.map((member: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {member.first_name} {member.last_name}
                          {member.username && <span className="text-gray-400"> (@{member.username})</span>}
                          {member.is_bot && <span className="text-blue-400 ml-2">[BOT]</span>}
                        </div>
                        <div className="text-sm text-gray-400">
                          Status: {member.status} • ID: {member.id}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.status === 'creator' && '👑'}
                        {member.status === 'administrator' && '⚙️'}
                        {member.status === 'member' && '👤'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAdminToolsTab() {
    return (
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Administrator Tools</h3>
          <p className="text-sm text-gray-400">Promote members and manage permissions</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Chat ID</label>
              <Input
                placeholder="Chat ID or @username"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Member ID</label>
              <Input
                placeholder="User ID to promote"
                value={promoteMemberId}
                onChange={(e) => setPromoteMemberId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3">Administrator Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="text-gray-300 font-medium text-sm">Basic Permissions</h5>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_chat}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_manage_chat: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Manage Chat (Full Access)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_delete_messages}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_delete_messages: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Delete Messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_restrict_members}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_restrict_members: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Restrict Members</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_promote_members}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_promote_members: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Promote Members</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_invite_users}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_invite_users: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Invite Users</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-gray-300 font-medium text-sm">Advanced Permissions</h5>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_change_info}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_change_info: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Change Chat Info</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_pin_messages}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_pin_messages: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Pin Messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_video_chats}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_manage_video_chats: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Manage Video Chats</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_topics}
                      onChange={(e) => setPermissions(prev => ({ ...prev, can_manage_topics: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Manage Topics (Forums)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>💡 Tip:</strong> Start with basic permissions like "Delete Messages" and "Restrict Members". 
                  "Manage Chat" gives full access to all features.
                </p>
              </div>
              
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  <strong>⚠️ Important:</strong> Member promotion only works in <strong>supergroups</strong> and <strong>channels</strong>. 
                  Regular groups don't support this feature. Convert your group to a supergroup first.
                </p>
              </div>
              
              {botInfo && (
                <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">
                    <strong>🤖 Bot User ID:</strong> <code className="bg-red-900/30 px-1 rounded">{botInfo.id}</code>
                  </p>
                  <p className="text-red-300 text-xs mt-1">
                    <strong>Note:</strong> Don't use the bot's ID to promote it. The bot needs to be promoted by a human admin first.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={promoteMember}
            disabled={loading || !chatId || !promoteMemberId}
            className="bg-orange-500 text-white"
          >
            {loading ? 'Promoting...' : 'Promote Member'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderKnowledgeBaseTab() {
    return (
      <div className="space-y-6">
        {/* Knowledge Base Upload */}
        <Card className="bg-card border-none">
          <CardHeader>
          <h3 className="text-lg font-semibold text-white">Knowledge Base Management</h3>
          <p className="text-sm text-gray-400">Upload Excel file with keyword-answer pairs for bot responses</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Upload Excel File</label>
            <p className="mb-2 text-xs text-gray-300">
                Upload an Excel file with "keyword" and "answer" columns. The bot will prioritize this data over AI responses.
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

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <Card className="bg-card border-none">
            <CardHeader>
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

        {/* Response Priority Info */}
      <Card className="bg-card border-none">
          <CardHeader>
          <h3 className="text-lg font-semibold text-white">Response Priority</h3>
          <p className="text-sm text-gray-400">How your bot prioritizes responses to incoming messages</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-white"><strong className="text-blue-400">1. Knowledge Base:</strong> Exact and fuzzy matches from your Excel file</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-white"><strong className="text-blue-400">2. OpenAI:</strong> AI responses for unknown queries</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                <span className="text-white"><strong className="text-blue-400">3. Fallback:</strong> Default responses when all else fails</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  }

  function renderUpdatesTab() {
    return (
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Recent Updates</h3>
          <p className="text-sm text-gray-400">View recent messages and events from your bot</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={loadUpdates}
            disabled={loading}
            className="bg-indigo-500 text-white"
          >
            {loading ? 'Loading...' : 'Load Recent Updates'}
          </Button>
          
          {updates.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {updates.map((update, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Update #{update.update_id}</span>
                    <span className="text-xs text-gray-400">
                      {update.message?.date ? new Date(update.message.date * 1000).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  
                  {update.message && (
                    <div className="space-y-1">
                      <div className="text-sm text-white">
                        <strong>From:</strong> {update.message.from?.first_name} {update.message.from?.last_name || ''} 
                        {update.message.from?.username && <span className="text-gray-400"> (@{update.message.from.username})</span>}
                      </div>
                      <div className="text-sm text-green-400">
                        <strong>User ID:</strong> 
                        <code className="bg-gray-700 px-2 py-1 rounded ml-1 cursor-pointer select-all" 
                              onClick={() => setChatId(String(update.message.from?.id))}
                              title="Click to copy to chat ID field">
                          {update.message.from?.id}
                        </code>
                        <span className="text-xs text-gray-400 ml-2">(click to use)</span>
                      </div>
                      {update.message.chat && (
                        <div className="text-sm text-gray-300">
                          <strong>Chat:</strong> {update.message.chat.title || update.message.chat.first_name || `ID: ${update.message.chat.id}`}
                          {update.message.chat.id !== update.message.from?.id && (
                            <div className="text-blue-400">
                              <strong>Chat ID:</strong> 
                              <code className="bg-gray-700 px-2 py-1 rounded ml-1 cursor-pointer select-all"
                                    onClick={() => setChatId(String(update.message.chat.id))}
                                    title="Click to copy to chat ID field">
                                {update.message.chat.id}
                              </code>
                              <span className="text-xs text-gray-400 ml-2">(click to use)</span>
                            </div>
                          )}
                        </div>
                      )}
                      {update.message.text && (
                        <div className="text-sm text-gray-200 mt-2 p-2 bg-gray-700 rounded">
                          {update.message.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderGroupsTab() {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">My Groups & Channels</h3>
            <p className="text-sm text-gray-400">Discover all groups and channels where your bot is active</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={loadBotChats}
                disabled={loading}
                className="bg-blue-500 text-white"
              >
                {loading ? 'Loading...' : '🔄 Refresh Groups & Channels'}
              </Button>
            </div>
            
            {botChats.length > 0 && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-300">
                  <strong>Found {botChats.length} chats</strong> where your bot is active
                </div>
              </div>
            )}
            
            {botChats.length > 0 && (
              <div className="space-y-3">
                {botChats.map((chat: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-white font-medium text-lg">
                            {chat.title}
                          </div>
                          <div className="flex items-center gap-1">
                            {chat.type === 'group' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">GROUP</span>}
                            {chat.type === 'supergroup' && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">SUPERGROUP</span>}
                            {chat.type === 'channel' && <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">CHANNEL</span>}
                            {chat.canManage && <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">MANAGE</span>}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 mb-2">
                          <strong>Chat ID:</strong> 
                          <code className="bg-gray-700 px-2 py-1 rounded ml-1 text-yellow-300">
                            {chat.id}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(chat.id);
                              setSuccess(`Chat ID copied: ${chat.id}`);
                            }}
                            className="text-xs text-blue-400 ml-2 hover:text-blue-300"
                          >
                            (copy)
                          </button>
                        </div>
                        
                        {chat.username && (
                          <div className="text-sm text-gray-400 mb-2">
                            <strong>Username:</strong> @{chat.username}
                          </div>
                        )}
                        
                        {chat.description && (
                          <div className="text-sm text-gray-400 mb-2">
                            <strong>Description:</strong> {chat.description}
                          </div>
                        )}
                        
                        {chat.memberCount && (
                          <div className="text-sm text-gray-400 mb-2">
                            <strong>Members:</strong> {chat.memberCount.toLocaleString()}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          <strong>Last Activity:</strong> {new Date(chat.lastActivity).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setChatId(chat.id);
                            setActiveTab('chat-management');
                            setSuccess(`Switched to Chat Management for ${chat.title}`);
                          }}
                          className="bg-green-500 text-white text-xs"
                        >
                          Manage
                        </Button>
                        
                        {chat.canManage && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                setLoading(true);
                                setError("");
                                const res = await telegramBotExportMembers(token, chat.id);
                                if (res.success) {
                                  setSuccess(`Excel file downloaded: ${res.filename}`);
                                }
                              } catch (e: any) {
                                setError(e.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="bg-blue-500 text-white text-xs"
                          >
                            Export Members
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {botChats.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-lg font-medium">No chats found</div>
                  <div className="text-sm">Your bot needs to be active in groups/channels to discover them</div>
                </div>
                <div className="text-xs text-gray-500 max-w-md mx-auto">
                  <strong>Tip:</strong> Add your bot to groups/channels and send some messages to make it active. 
                  Then click "Refresh Groups & Channels" to discover them.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}


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
  telegramBotGetChat,
  telegramBotGetChatAdmins,
  telegramBotPromoteMember,
  telegramBotGetUpdates,
  telegramBotGetChatMembers,
  telegramBotExportMembers,
  telegramBotGetBotChats,
  telegramBotGetContacts,
  telegramBotCreateCampaign,
  telegramBotListCampaigns
} from "@/lib/api";
import { listTags } from "@/lib/tagsApi";
import { usePermissions } from "@/lib/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TelegramBotPage() {
  const { canManageTelegram, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
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
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [chatAdmins, setChatAdmins] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [chatMembers, setChatMembers] = useState<any>({ totalCount: 0, members: [], note: '' });
  const [promoteMemberId, setPromoteMemberId] = useState<string>("");
  const [botChats, setBotChats] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [campaignMessage, setCampaignMessage] = useState<string>("");
  const [campaignWhen, setCampaignWhen] = useState<string>("");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(1500);
  const [campaignMediaUrl, setCampaignMediaUrl] = useState<string>("");
  const [campaignMediaFile, setCampaignMediaFile] = useState<File | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  // Auto-reply & templates admin
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(false);
  const [autoReplyTemplateId, setAutoReplyTemplateId] = useState<string>("");
  const [buttonColorDefault, setButtonColorDefault] = useState<string>("");
  const [activeTemplates, setActiveTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
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

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    if (token) {
      loadKnowledgeBase();
      // loadGroups();
      loadBotInfo();
      loadActiveTemplatesList();
      loadBotSettingsUI();
      listTags().then(res=> { if (res?.success) setAvailableTags(res.data || []); }).catch(()=>{});
    }
  }, [token]);

  // Sync active tab with route path for route-based tabs
  useEffect(() => {
    try {
      const p = typeof window !== 'undefined' ? window.location.pathname : '';
      if (p.includes('/telegram/chat-management')) setActiveTab('chat-management');
      else if (p.includes('/telegram/admin-tools')) setActiveTab('admin-tools');
      else if (p.includes('/telegram/groups')) setActiveTab('groups');
      else if (p.includes('/telegram/contacts')) setActiveTab('contacts');
      else if (p.includes('/telegram/campaigns')) setActiveTab('campaigns');
      else setActiveTab('overview');
    } catch {}
  }, []);

  // Check permissions
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة التليجرام</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة التليجرام</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
            <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى إدارة التليجرام</p>
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

  if (!canManageTelegram()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">إدارة التليجرام</h1>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية إدارة التليجرام</h3>
            <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل إدارة التليجرام</p>
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

  // async function loadGroups() {
  //   if (!token) return;
  //   setLoadingGroups(true);
  //   try {
  //     const res = await tgWebGroups(token);
  //     setGroups(res.groups || []);
  //   } catch (e: any) {
  //     setError("Failed to load groups and channels");
  //   }
  //   setLoadingGroups(false);
  // }

  async function loadBotInfo() {
    try {
      const res = await telegramBotInfo(token);
      setBotInfo(res.bot || null);
    } catch {
      // ignore
    }
  }

  async function loadActiveTemplatesList() {
    try {
      const res = await fetch(`/api/telegram-templates/templates/active`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(()=>({}));
      const list = data?.data || [];
      setActiveTemplates(list);
    } catch {}
  }

  async function loadBotSettingsUI() {
    try {
      const res = await fetch(`/api/bot-settings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(()=>({}));
      const s = data?.data || data;
      if (s) {
        setAutoReplyEnabled(!!s.autoReplyEnabled);
        setAutoReplyTemplateId(s.autoReplyTemplateId ? String(s.autoReplyTemplateId) : "");
        setButtonColorDefault(s.buttonColorDefault || "");
      }
    } catch {}
  }

  async function saveBotSettingsUI() {
    try {
      await fetch(`/api/bot-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          autoReplyEnabled,
          autoReplyTemplateId: autoReplyTemplateId ? Number(autoReplyTemplateId) : null,
          buttonColorDefault: buttonColorDefault || null,
        })
      });
      setSuccess("تم حفظ الإعدادات");
    } catch (e:any) {
      setError(e?.message || "فشل في حفظ الإعدادات");
    }
  }

  async function loadContacts() {
    try {
      setLoading(true);
      const res = await telegramBotGetContacts(token);
      if (res.success) {
        setContacts(res.contacts || []);
      }
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function loadCampaigns() {
    try {
      setLoading(true);
      const res = await telegramBotListCampaigns(token);
      if (res.success) setCampaigns(res.jobs || []);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function createCampaign() {
    if (selectedTargets.length === 0 || !campaignMessage.trim()) {
      setError('Select at least one target and enter a message');
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload: any = { targets: selectedTargets, message: campaignMessage.trim(), throttleMs: campaignThrottle };
      if (campaignMediaUrl.trim()) {
        payload.mediaUrl = campaignMediaUrl.trim();
      }
      if (campaignWhen) {
        payload.scheduleAt = campaignWhen;
        payload.timezoneOffset = new Date().getTimezoneOffset();
      }
      const res = await telegramBotCreateCampaign(token, payload);
      if (res.success) {
        setSuccess('تم جدولة الحملة بنجاح');
        setCampaignMessage('');
        setCampaignWhen('');
        setSelectedTargets([]);
        await loadCampaigns();
      }
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function sendCampaignNow() {
    if (selectedTargets.length === 0 || !campaignMessage.trim()) {
      setError('Select at least one target and enter a message');
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload: any = { targets: selectedTargets, message: campaignMessage.trim(), throttleMs: campaignThrottle };
      if (campaignMediaUrl.trim()) payload.mediaUrl = campaignMediaUrl.trim();
      await telegramBotCreateCampaign(token, payload);
      setSuccess('تم إرسال الحملة الآن');
      setCampaignMessage('');
      setCampaignMediaUrl('');
      setSelectedTargets([]);
      await loadCampaigns();
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function loadChatInfo() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotGetChat(token, chatId);
      if (res.success) {
        setChatInfo(res.chat);
        setSuccess("تم تحميل معلومات المحادثة!");
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
        setSuccess("تم تحميل الأدمن!");
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
        setSuccess("تم ترقية العضو بنجاح!");
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
        setSuccess("تم تحميل التحديثات!");
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
        setSuccess("تم تحميل الأعضاء!");
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
        setSuccess(`تم العثور على ${res.total || 0} محادثة حيث بوتك نشط!`);
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
        setSuccess("تم رفع قاعدة المعرفة بنجاح!");
        setFile(null);
        await loadKnowledgeBase();
      } else {
        setError(result.message || "فشل الرفع");
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
      setSuccess("تم حفظ الإعدادات بنجاح!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "overview", name: "نظرة عامة", icon: "🤖" },
    { id: "chat-management", name: "إدارة المحادثات", icon: "👥" },
    { id: "admin-tools", name: "أدوات الإدارة", icon: "⚙️" },
    { id: "groups", name: "مجموعاتي والقنوات", icon: "🏢" },
    { id: "contacts", name: "جهات الاتصال", icon: "👤" },
    { id: "campaigns", name: "الحملات", icon: "📣" },
    
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {/* <Card className="bg-card border-none">
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
      </Card> */}

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
          <h3 className="text-lg font-semibold text-white">حالة البوت</h3>
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
                    variant="secondary"
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
                    {loading ? 'جاري الاختبار...' : 'اختبار البوت'}
                  </Button>
                  <div className="text-green-500 text-sm">متصل</div>
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
                        setSuccess("تم ربط البوت بنجاح");
                        setBotToken("");
                        await loadBotInfo();
                      } else {
                        setError(res.message || "فشل في ربط البوت");
                      }
                    } catch (e: any) {
                      setError(e.message || "فشل في ربط البوت");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'جاري الاتصال...' : 'ربط البوت'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route-based content only (no inner tabs) */}
      {botInfo && (
          <div className="mt-6">{renderTabContent()}</div>
      )}
    </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "chat-management":
        return renderChatManagementTab();
      case "admin-tools":
        return renderAdminToolsTab();
      case "groups":
        return renderGroupsTab();
      case "contacts":
        return renderContactsTab();
      case "campaigns":
        return renderCampaignsTab();
      default:
        return renderOverviewTab();
    }
  }

  function renderOverviewTab() {
    return (
      <Card className="bg-card border-none">
        {/* <CardHeader>
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
        </CardContent> */}
      </Card>
    );
  }

  function renderContactsTab() {
    return (
      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">جهات الاتصال</h3>
          <p className="text-sm text-gray-400">المستخدمون الذين بدأوا بوتك (النشاط الأخير)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={loadContacts} disabled={loading} className="bg-blue-500 text-white">
            {loading ? 'جاري التحميل...' : 'تحديث جهات الاتصال'}
          </Button>
          {contacts.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const all = contacts.map((c:any)=> c.chatId);
                  setSelectedTargets(Array.from(new Set([...(selectedTargets as string[]), ...all])));
                  setSuccess(`تم إضافة ${all.length} جهة اتصال إلى الأهداف`);
                }}
                className="bg-yellow-600 text-white"
              >
                اختر جميع جهات الاتصال
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedTargets([])}
              >
                مسح الأهداف
              </Button>
            </div>
          )}
          {contacts.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.map((c:any, i:number) => (
                <div key={i} className="p-3 bg-gray-800 rounded flex items-center justify-between">
                  <div className="text-sm text-white">
                    <div className="font-medium">{c.chatTitle || 'User'}</div>
                    <div className="text-gray-400 text-xs">{c.chatType} • {c.chatId}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(c.chatId)}
                      onChange={(e)=>{
                        if (e.target.checked) {
                          if (!selectedTargets.includes(c.chatId)) setSelectedTargets((prev: string[]) => [...prev, c.chatId]);
                        } else {
                          setSelectedTargets((prev: string[]) => prev.filter((x: string) => x !== c.chatId));
                        }
                      }}
                    />
                    <Button size="sm" className="bg-emerald-600 text-white" onClick={() => {
                      if (!selectedTargets.includes(c.chatId)) setSelectedTargets((prev: string[]) => [...prev, c.chatId]);
                    }}>Add</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderCampaignsTab() {
    return (
      <div className="space-y-6">
      <Card className="bg-card border-none">
        <CardHeader>
            <h3 className="text-lg font-semibold text-white">Create Campaign</h3>
            <p className="text-sm text-gray-400">Select targets from Groups/Contacts and schedule a message</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
              <label className="block text-sm font-medium mb-2 text-white">Selected Targets ({selectedTargets.length})</label>
              {selectedTargets.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTargets.map(t => (
                    <span key={t} className="text-xs bg-gray-700 text-yellow-300 px-2 py-1 rounded inline-flex items-center gap-2">
                      {t}
                      <button className="text-red-400" onClick={() => setSelectedTargets((prev: string[]) => prev.filter((x: string) => x !== t))}>×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Pick chats from Groups or Contacts tabs.</div>
              )}
            </div>
            {/* Tag picker */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tags (optional)</label>
              {availableTags.length === 0 ? (
                <div className="text-xs text-gray-400">No tags yet. Create tags in Tags section.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((t:any)=> (
                    <button key={t.id} onClick={()=>{
                      setSelectedTagIds(prev=> prev.includes(t.id) ? prev.filter(x=>x!==t.id) : [...prev, t.id]);
                    }} className={`px-2 py-1 rounded text-xs border ${selectedTagIds.includes(t.id)? 'bg-yellow-600 text-white border-yellow-700':'bg-gray-800 text-gray-200 border-gray-700'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contacts picker inside Campaigns */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white">Pick Contacts</label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={loadContacts} disabled={loading} className="bg-blue-500 text-white">
                    {loading ? 'جاري التحميل...' : 'تحديث جهات الاتصال'}
                  </Button>
                  {contacts.length > 0 && (
                    <Button size="sm" onClick={() => {
                      const all = contacts.map((c:any)=> c.chatId);
                      setSelectedTargets(prev => Array.from(new Set([...(prev||[]), ...all])));
                      setSuccess(`تم إضافة ${all.length} جهة اتصال إلى الأهداف`);
                    }} className="bg-yellow-600 text-white">
                      اختر جميع جهات الاتصال
                    </Button>
                  )}
                </div>
              </div>
              {contacts.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-gray-900/40 rounded-md border border-gray-800">
                  {contacts.map((c:any, i:number) => (
                    <div key={i} className="p-2 bg-gray-800 rounded flex items-center justify-between">
                      <div className="text-xs text-white">
                        <div className="font-medium">{c.chatTitle || 'User'}</div>
                        <div className="text-gray-400">{c.chatType} • {c.chatId}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTargets.includes(c.chatId)}
                          onChange={(e)=>{
                            if (e.target.checked) {
                              if (!selectedTargets.includes(c.chatId)) setSelectedTargets(prev => [...prev, c.chatId]);
                            } else {
                              setSelectedTargets(prev => prev.filter(x => x !== c.chatId));
                            }
                          }}
                        />
                        <Button size="sm" className="bg-emerald-600 text-white" onClick={() => {
                          if (!selectedTargets.includes(c.chatId)) setSelectedTargets(prev => [...prev, c.chatId]);
                        }}>Add</Button>
            </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Message</label>
            <textarea
                placeholder="Your promotional message..."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                className="w-full h-28 p-3 border rounded-md bg-gray-800 text-white border-gray-600"
            />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Schedule At (optional)</label>
                <Input type="datetime-local" value={campaignWhen} onChange={(e)=>setCampaignWhen(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Throttle (ms)</label>
                <Input type="number" value={campaignThrottle} onChange={(e)=>setCampaignThrottle(Number(e.target.value||1500))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Media URL (optional)</label>
                <Input placeholder="https://... (image/video/document)" value={campaignMediaUrl} onChange={(e)=>setCampaignMediaUrl(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">If provided, media will be sent with the message.</p>
                <div className="mt-2 flex items-center gap-2">
                  <input type="file" onChange={(e)=> setCampaignMediaFile(e.target.files?.[0] || null)} className="text-xs text-gray-300" />
                  <Button size="sm" className="bg-blue-600 text-white" disabled={loading || !campaignMediaFile} onClick={async ()=>{
                    if (!campaignMediaFile) return;
                    try {
                      setLoading(true);
                      const form = new FormData();
                      form.append('file', campaignMediaFile);
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
                      const data = await res.json();
                      if (data?.url) {
                        setCampaignMediaUrl(data.url);
                        setSuccess('Media uploaded');
                      } else {
                        setError('Upload failed');
                      }
                    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
                  }}>Upload</Button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={createCampaign} disabled={loading || (!campaignMessage.trim()) || (selectedTargets.length===0 && selectedTagIds.length===0)} className="bg-green-600 text-white">
                {loading ? 'Scheduling...' : 'Schedule Campaign'}
          </Button>
              <Button onClick={sendCampaignNow} disabled={loading || (!campaignMessage.trim()) || (selectedTargets.length===0 && selectedTagIds.length===0)} className="bg-emerald-600 text-white" variant="secondary">
                {loading ? 'Sending...' : 'Send Now'}
              </Button>
                  <Button onClick={loadCampaigns} disabled={loading} variant="secondary">
                {loading ? 'Loading...' : 'Refresh Campaigns'}
              </Button>
            </div>
        </CardContent>
      </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Recent Campaigns</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 && <div className="text-sm text-gray-400">No campaigns yet.</div>}
            {campaigns.map((j:any,i:number)=> (
              <div key={i} className="p-3 bg-gray-800 rounded flex items-center justify-between">
                <div className="text-sm text-white">
                  <div className="font-medium">#{j.id} • {j.status}</div>
                  <div className="text-gray-400 text-xs">Scheduled: {new Date(j.scheduledAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-400">Created: {new Date(j.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
                variant="secondary"
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
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_chat: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Manage Chat (Full Access)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_delete_messages}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_delete_messages: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Delete Messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_restrict_members}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_restrict_members: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Restrict Members</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_promote_members}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_promote_members: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Promote Members</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_invite_users}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_invite_users: e.target.checked }))}
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
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_change_info: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Change Chat Info</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_pin_messages}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_pin_messages: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Pin Messages</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_video_chats}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_video_chats: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white">Manage Video Chats</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_topics}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_topics: e.target.checked }))}
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
                            <strong>🤖 Bot User ID:</strong> <code className="bg-red-900/30 px-1 rounded">{botInfo.botUserId}</code>
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
              <Button 
                onClick={() => {
                  const all = botChats.map((c:any)=> c.id);
                  setSelectedTargets(Array.from(new Set([...selectedTargets, ...all])));
                  setSuccess(`Added ${all.length} chats to targets`);
                }}
                disabled={loading || botChats.length===0}
                className="bg-yellow-600 text-white"
              >
                Select All Groups
              </Button>
              <Button 
                onClick={() => setActiveTab('campaigns')}
                className="bg-green-600 text-white"
              >
                Go to Campaigns
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
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!selectedTargets.includes(chat.id)) setSelectedTargets((prev: string[]) => ([...prev, chat.id] as string[]));
                            setSuccess(`Added ${chat.id} to targets`);
                          }}
                          className="bg-emerald-600 text-white text-xs"
                        >
                          Target
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


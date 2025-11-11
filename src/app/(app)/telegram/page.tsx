"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

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
  telegramBotListCampaigns,
  telegramBotDisconnect
} from "@/lib/api";
import { listTags } from "@/lib/tagsApi";
import { usePermissions } from "@/lib/permissions";
import Loader from "@/components/Loader";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TelegramBotPage() {
  const { canManageTelegram, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
     const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
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
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  // Auto-reply & templates admin
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(false);
  const [autoReplyTemplateId, setAutoReplyTemplateId] = useState<string>("");
  const [buttonColorDefault, setButtonColorDefault] = useState<string>("");
  const [activeTemplates, setActiveTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
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
      loadCampaigns(); // Load campaigns on initial load
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

  // Load campaigns when campaigns tab is active
  useEffect(() => {
    if (activeTab === 'campaigns' && token) {
      loadCampaigns();
      // Also load bot chats so the picker is prefilled
      loadBotChats();
    }
  }, [activeTab, token]);

  // Check permissions
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
      showError(e.message);
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
      console.log('Bot info response:', res); // Debug log
      setBotInfo(res.bot || null);
    } catch (e) {
      console.error('Error loading bot info:', e); // Debug log
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
      showSuccess("تم حفظ الإعدادات");
    } catch (e:any) {
      showError(e?.message || "فشل في حفظ الإعدادات");
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
      showError(e.message);
    } finally { setLoading(false); }
  }

  async function loadCampaigns() {
    try {
      setLoading(true);
      const res = await telegramBotListCampaigns(token);
      console.log('Campaigns response:', res); // Debug log
      if (res.success) setCampaigns(res.jobs || []);
    } catch (e:any) {
      console.error('Error loading campaigns:', e); // Debug log
      showError(e.message);
    } finally { setLoading(false); }
  }

  async function createCampaign() {
    if (selectedTargets.length === 0 || !campaignMessage.trim()) {
      showError('اختر هدف واحد على الأقل وأدخل رسالة');
      return;
    }
    try {
      setLoadingCreate(true);
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
        showSuccess('تم جدولة الحملة بنجاح');
        setCampaignMessage('');
        setCampaignWhen('');
        setSelectedTargets([]);
        await loadCampaigns();
      }
    } catch (e:any) {
      showError(e.message);
    } finally { setLoadingCreate(false); }
  }

  async function sendCampaignNow() {
    if (selectedTargets.length === 0 || !campaignMessage.trim()) {
      showError('اختر محادثة على الأقل وأدخل رسالة');
      return;
    }
    try {
      setLoadingSend(true);
      const payload: any = { targets: selectedTargets, message: campaignMessage.trim(), throttleMs: campaignThrottle };
      if (campaignMediaUrl.trim()) payload.mediaUrl = campaignMediaUrl.trim();
      await telegramBotCreateCampaign(token, payload);
      showSuccess('تم إرسال الحملة بنجاح');
      setCampaignMessage('');
      setCampaignMediaUrl('');
      setSelectedTargets([]);
      await loadCampaigns();
    } catch (e:any) {
      showError(e.message);
    } finally { setLoadingSend(false); }
  }

  async function loadChatInfo() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotGetChat(token, chatId);
      if (res.success) {
        setChatInfo(res.chat);
        showSuccess("تم تحميل معلومات المحادثة!");
      }
    } catch (e: any) {
      showError(e.message);
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
        showSuccess("تم تحميل الأدمن!");
      }
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function promoteMember() {
    if (!chatId || !promoteMemberId) return;
    try {
      setLoading(true);
      const res = await telegramBotPromoteMember(token, chatId, promoteMemberId, permissions);
      if (res.success) {
        showSuccess("تم ترقية العضو بنجاح!");
        setPromoteMemberId("");
        await loadChatAdmins();
      }
    } catch (e: any) {
      showError(e.message);
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
        showSuccess("تم تحميل التحديثات!");
      }
    } catch (e: any) {
      showError(e.message);
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
        showSuccess("تم تحميل الأعضاء!");
      }
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportMembers() {
    if (!chatId) return;
    try {
      setLoading(true);
      const res = await telegramBotExportMembers(token, chatId);
      if (res.success) {
        showSuccess(`تم تحميل ملف Excel: ${res.filename}`);
      }
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBotChats() {
    try {
      setLoadingChats(true);
      const res = await telegramBotGetBotChats(token);
      if (res.success) {
        setBotChats(res.chats || []);
        showSuccess(`تم العثور على ${res.total || 0} محادثة حيث بوتك نشط!`);
      }
    } catch (e: any) {
      showError(e.message);
    } finally { setLoadingChats(false); }
  }

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      const result = await uploadKnowledgeBase(token, file);
      if (result.success) {
        showSuccess("تم رفع قاعدة المعرفة بنجاح!");
        setFile(null);
        await loadKnowledgeBase();
      } else {
        showError(result.message || "فشل الرفع");
      }
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    try {
      await deleteKnowledgeEntry(token, id);
      await loadKnowledgeBase();
    } catch (e: any) {
      showError(e.message);
    }
  }

  async function saveOpenAISettings() {
    try {
      setLoading(true);
      // Save OpenAI key and auto-response settings
      localStorage.setItem('telegram_openai_key', openaiKey);
      localStorage.setItem('telegram_auto_response', autoResponse.toString());
      showSuccess("تم حفظ الإعدادات بنجاح!");
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "overview", name: "نظرة عامة", icon: "🤖" },
    // { id: "chat-management", name: "إدارة المحادثات", icon: "👥" },
    { id: "admin-tools", name: "أدوات الإدارة", icon: "⚙️" },
    // { id: "groups", name: "مجموعاتي والقنوات", icon: "🏢" },
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


  



      {/* Route-based content only (no inner tabs) */}
      <div className="mt-8">
        <div className="mb-6">
          {/* <h2 className="text-xl font-semibold text-white mb-2">نظرة عامة</h2> */}
          {/* <p className="text-gray-400 text-sm">استخدم الأدوات أدناه لإدارة بوت التليجرام الخاص بك</p> */}
        </div>
        {renderTabContent()}
      </div>
        </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      // case "chat-management":
      //   return renderChatManagementTab();
      case "admin-tools":
        return renderAdminToolsTab();
      // case "groups":
      //   return renderGroupsTab();
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
    <>
      {/* Bot Connection Status */}
      <Card className="gradient-border">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center justify-between gap-3">
         
           
           
                <div className="flex items-center gap-3">
            <img className="w-14 h-14" src="/Bot.gif" alt="" />
             <div className="flex flex-col gap-1">
             <h3 className="text-lg font-semibold text-white">حالة البوت</h3>
             <p className="text-sm text-gray-400">إدارة اتصال بوت التليجرام</p>
                  </div>
                </div>
            <div className="text-center">
                {/* <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🔌</span>
                </div> */}
                 {/* Disconnect Button */}
              {botInfo && (
              <div className="flex justify-center">
                <Button
                  className="primary-button after:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true);
                      const res = await telegramBotDisconnect(token);
                        if (res.success) {
                        showSuccess("تم قطع اتصال البوت بنجاح");
                        setBotInfo(null);
                        } else {
                        showError(res.message || "فشل في قطع اتصال البوت");
                        }
                      } catch (e: any) {
                      showError(e.message || "فشل في قطع اتصال البوت");
                      } finally {
                        setLoading(false);
                      }
                    }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري قطع الاتصال...</span>
                </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      
                      <span>قطع الاتصال</span>
                </div>
                  )}
                </Button>
              </div>
              )}
               
              </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {botInfo ? (
            <div className="space-y-6">
              {/* Bot Info Display */}
              <div className="bg-secondry rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                 
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">متصل</span>
                  </div>
                  <div className="flex items-center gap-4">
                    
                  <div className="flex items-end gap-1 flex-col">
                      <div className="text-white font-semibold text-lg">@{botInfo.username || 'غير محدد'}</div>
                      <div className="text-gray-400 text-sm">{botInfo.name || 'غير محدد'}</div>
                      <div className="text-gray-500 text-xs">ID: {botInfo.botUserId || 'غير محدد'}</div>
                  </div>
                  <div className="w-15 h-15  rounded-full flex items-center justify-center">
                      <img className="w-15 h-15" src="/bott.gif" alt="" />
                    </div>
                </div>
                </div>
              </div>

             
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bot Connection Status */}
              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 text-sm font-medium">غير متصل</span>
                </div>
                <p className="text-red-300 text-sm">البوت غير متصل. يرجى إدخال توكن البوت للاتصال.</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">توكن البوت</label>
                  <Input
                    placeholder="أدخل توكن البوت من @BotFather"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="py-3  text-white placeholder-gray-500"
                  />
                  <p className="text-xs text-green-500 mt-1">احصل على التوكن من @BotFather في التليجرام</p>
                </div>
                 
                <Button
                   className={`${!botToken ? 'primary-button after:bg-[#011910]' : 'primary-button'} w-50 text-white py-3 rounded-lg font-medium transition-colors`}
                  disabled={loading || !botToken}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await telegramBotConnect(token, botToken);
                      if (res.success) {
                        showSuccess("تم ربط البوت بنجاح");
                        setBotToken("");
                        await loadBotInfo();
                        // Prefetch chats/groups after successful connection
                        try { await loadBotChats(); } catch {}
                        // Navigate to campaigns to allow selecting groups quickly
                        setActiveTab('campaigns');
                      } else {
                        showError(res.message || "فشل في ربط البوت");
                      }
                    } catch (e: any) {
                      showError(e.message || "فشل في ربط البوت");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2 ">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري الاتصال...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      
                      <span>ربط البوت</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card className="gradient-border">
          <CardHeader className="border-text-primary/50 text-primary">
            <div className="flex items-center gap-3">
              
              <div>
                <p className="text-xl text-white">أدوات وادارة البوت</p>
    </div>
            </div>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#01191060] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                  <img  className="text-white" src="/true.png" alt="" />
                  </div>
            <div>
                    <div className="text-white font-semibold">المحادثات</div>
                    <div className="text-gray-400 text-sm">إدارة المحادثات</div>
            </div>
            </div>
          </div>
              
              <div className="bg-[#01191060] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                    <img  className="text-white" src="/true.png" alt="" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">المجموعات</div>
                    <div className="text-gray-400 text-sm">إدارة المجموعات</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#01191060] rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                  <img  className="text-white" src="/true.png" alt="" />
                  </div>
            <div>
                    <div className="text-white font-semibold">الحملات</div>
                    <div className="text-gray-400 text-sm">إدارة الحملات</div>
            </div>
            </div>
          </div>
            </div>
            
            
          </CardContent>
      </Card>
      </div>
    </>
  );
}

  function renderContactsTab() {
    return (
      <Card className="gradient-border">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
          <h3 className="text-lg font-semibold text-white">جهات الاتصال</h3>
          <p className="text-sm text-gray-400">المستخدمون الذين بدأوا بوتك (النشاط الأخير)</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={loadContacts} 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <span>تحديث جهات الاتصال</span>
                </div>
              )}
          </Button>
          </div>
          {contacts.length > 0 && (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const all = contacts.map((c:any)=> c.chatId);
                  setSelectedTargets(Array.from(new Set([...(selectedTargets as string[]), ...all])));
                  showSuccess(`تم إضافة ${all.length} جهة اتصال إلى الأهداف`);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>اختر جميع جهات الاتصال</span>
                </div>
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedTargets([])}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>مسح الأهداف</span>
                </div>
              </Button>
            </div>
          )}
          {contacts.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {contacts.map((c:any, i:number) => (
                <div key={i} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(c.chatTitle || 'User').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{c.chatTitle || 'User'}</div>
                    <div className="text-gray-400 text-xs">{c.chatType} • {c.chatId}</div>
                  </div>
                  </div>
                  <div className="flex gap-3 items-center">
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
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors" 
                      onClick={() => {
                      if (!selectedTargets.includes(c.chatId)) setSelectedTargets((prev: string[]) => [...prev, c.chatId]);
                      }}
                    >
                      إضافة
                    </Button>
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
        {!botInfo && (
          <Card className="gradient-border">
            <CardContent className="text-center py-12">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-white mb-2">البوت غير متصل</h3>
                <p className="text-gray-400 mb-4">تحتاج إلى ربط البوت أولاً لإنشاء الحملات</p>
                <Button 
                  onClick={() => setActiveTab('overview')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  الذهاب إلى صفحة الاتصال
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {botInfo && (
          <>
            <Card className="gradient-border">
          <CardHeader className="border-text-primary/50 text-primary">
            <div className="flex items-center justify-between gap-3">
              
              <div>
                <h3 className="text-lg font-semibold text-white">إنشاء حملة إعلانية</h3>
              </div>
              <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={loadBotChats} 
                    disabled={loadingChats} 
                    className="primary-button"
                  >
                    {loadingChats ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري التحميل...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                       
                        <span>تحميل المجموعات والقنوات والجهات</span>
                      </div>
                    )}
                  </Button>
                  {botChats.length > 0 && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                      const all = botChats.map((c:any)=> c.id);
                      setSelectedTargets(prev => Array.from(new Set([...(prev||[]), ...all])));
                      showSuccess(`✅ تم إضافة ${all.length} مجموعة/قناة إلى الأهداف`);
                      }} 
                      className="primary-button after:bg-red-600"
                    >
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span> تحديد الكل </span>
                      </div>
                    </Button>
                  )}
                </div>
            </div>
        </CardHeader>
          <CardContent className="space-y-6">
          <div>
              <label className="block text-sm font-medium mb-3 text-white">حدد المجموعة أو القناة المستهدفة({selectedTargets.length})</label>
              {selectedTargets.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTargets.map(t => (
                    <span key={t} className="text-xs bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-md">
                      🎯 {t}
                      <button className="text-white hover:text-red-300 font-bold" onClick={() => setSelectedTargets((prev: string[]) => prev.filter((x: string) => x !== t))}>×</button>
                    </span>
                  ))}
                </div>
              ) : (
                // <div className="p-6 bg-[#011910] rounded-lg border border-gray-700 text-center">
                //   <div className="text-gray-400">
                //     <div className="text-4xl mb-3">🎯</div>
                //     <div className="font-semibold text-lg mb-2">لم يتم اختيار أي أهداف بعد</div>
                //     <div className="text-sm">استخدم الأزرار أدناه لتحميل واختيار المجموعات أو جهات الاتصال</div>
                //   </div>
                // </div>
                ""
              )}
            </div>
           

            {/* Groups picker inside Campaigns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm">📢</span>
                </div>
                  <label className="text-lg font-semibold text-white">  المجموعات والقنوات وجهات الاتصال</label>
                </div>
              
              </div>
              {botChats.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-secondry rounded-lg border border-gray-700 custom-scrollbar">
                  {botChats.map((c:any, i:number) => (
                    <div key={i} className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between hover:bg-gray-800/70 transition-colors border border-gray-700">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {c.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm mb-1 flex items-center gap-2">
                          {c.title}
                            {c.type === 'channel' && <span className="text-xs bg-purple-500 px-2 py-0.5 rounded">قناة</span>}
                            {c.type === 'supergroup' && <span className="text-xs bg-green-500 px-2 py-0.5 rounded">مجموعة</span>}
                            {c.type === 'group' && <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">مجموعة</span>}
                            {c.type === 'private' && <span className="text-xs bg-red-500 px-2 py-0.5 rounded">خاص</span>}
                        </div>
                          <div className="text-gray-400 text-xs flex items-center gap-2">
                          <span>🆔 {c.id}</span>
                          
                          {c.memberCount && <span>• 👥 {c.memberCount.toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTargets.includes(c.id)}
                          onChange={(e)=>{
                            if (e.target.checked) {
                              if (!selectedTargets.includes(c.id)) setSelectedTargets(prev => [...prev, c.id]);
                            } else {
                              setSelectedTargets(prev => prev.filter(x => x !== c.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600"
                        />
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors" 
                          onClick={() => {
                          if (!selectedTargets.includes(c.id)) setSelectedTargets(prev => [...prev, c.id]);
                          }}
                        >
                          + إضافة
                  </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-secondry rounded-lg border border-gray-700 text-center">
                  <div className="text-gray-400">
                    <div className="text-4xl mb-3">🤖</div>
                    <div className="font-semibold text-lg mb-2">لا توجد مجموعات محملة</div>
                    <div className="text-sm">اضغط على "تحميل المجموعات" أعلاه</div>
                  </div>
                </div>
              )}
          </div>

          <div>
              <label className="block text-lg font-medium mb-3 text-white">الرسالة التسويقية</label>
            <textarea
                placeholder="اكتب الرسالة التسويقية الإعلانية هنا..."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                className="w-full h-32 p-4 bg-[#01191040] border rounded-lg  text-white border-blue-300 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">وقت الجدولة (اختياري)</label>
                <Input 
                  type="datetime-local" 
                  value={campaignWhen} 
                  onChange={(e)=>setCampaignWhen(e.target.value)}
                  className="bg-[#011910] border-gray-700 text-white"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium mb-2 text-white">فترة التأخير (ملي ثانية)</label>
                <Input 
                  type="number" 
                  value={campaignThrottle} 
                  onChange={(e)=>setCampaignThrottle(Number(e.target.value||1500))}
                  className="bg-[#011910] border-gray-700 text-white"
                />
              </div> */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">رفع الوسائط (اختياري)</label>
                <div className="mt-2">
                  <Input 
                    type="file" 
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={async (e)=> {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        setUploadingMedia(true);
                      const form = new FormData();
                        form.append('file', file);
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/uploads`, { 
                          method: 'POST', 
                          headers: { Authorization: `Bearer ${token}` }, 
                          body: form 
                        });
                      const data = await res.json();
                      if (data?.url) {
                        setCampaignMediaUrl(data.url);
                          showSuccess('تم رفع الوسائط بنجاح');
                      } else {
                          showError('فشل في رفع الوسائط');
                        }
                      } catch (e:any) { 
                        showError(e.message); 
                      } finally { 
                        setUploadingMedia(false); 
                      }
                    }} 
                    className="text-sm text-gray-300 bg-[#011910] border border-gray-700 rounded-lg p-2 w-full" 
                  />
                  <p className="text-xs text-gray-400 mt-1">اختر صورة أو فيديو أو ملف ليتم رفعه تلقائياً</p>
                  
                  {uploadingMedia && (
                    <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-blue-400">جاري رفع الوسائط...</p>
                </div>
              </div>
                  )}
                  
                  {campaignMediaUrl && !uploadingMedia && (
                    <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded-lg">
                      <p className="text-xs text-green-400">✅ تم رفع الوسائط بنجاح</p>
                      <button 
                        onClick={() => setCampaignMediaUrl('')}
                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                      >
                        إزالة الوسائط
                      </button>
                </div>
                  )}
              </div>
      </div>
      </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={createCampaign} 
                disabled={loadingCreate || (!campaignMessage.trim()) || (selectedTargets.length===0 && selectedTagIds.length===0)} 
                className="primary-button after:bg-yellow-500"
              >
                {loadingCreate ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الجدولة...</span>
            </div>
                ) : (
                  <div className="flex items-center gap-2">

                    <span>جدولة الحملة</span>
              </div>
            )}
          </Button>
            <Button 
                onClick={sendCampaignNow} 
                disabled={loadingSend || (!campaignMessage.trim()) || (selectedTargets.length===0 && selectedTagIds.length===0)} 
                className="primary-button "
              >
                {loadingSend ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الإرسال...</span>
                      </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>إرسال الآن</span>
              </div>
            )}
              </Button>
           
            </div>
        </CardContent>
      </Card>

        {/* <Card className="gradient-border">
          <CardHeader className="border-text-primary/50 text-primary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
                </div>
              <div>
                <h3 className="text-lg font-semibold text-white">الحملات الأخيرة</h3>
                <p className="text-sm text-gray-400">عرض الحملات المنشأة مؤخراً</p>
              </div>
                        </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length === 0 && !loading && (
              <div className="p-6 bg-gray-800/30 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="font-semibold text-lg mb-2">لا توجد حملات بعد</div>
                  <div className="text-sm">قم بإنشاء حملة جديدة أعلاه</div>
                </div>
              </div>
            )}
            {loading && (
              <div className="p-6 bg-gray-800/30 rounded-lg border border-gray-700 text-center">
                <div className="text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <div className="font-semibold text-lg mb-2">جاري تحميل الحملات...</div>
                </div>
              </div>
            )}
            {campaigns.map((j:any,i:number)=> (
              <div key={i} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">#{j.id || i+1}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">الحملة #{j.id || i+1}</div>
                    <div className="text-gray-400 text-xs">الحالة: {j.status || 'غير محدد'}</div>
                    <div className="text-gray-500 text-xs">مجدولة: {j.scheduledAt ? new Date(j.scheduledAt).toLocaleString() : 'غير محدد'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    j.status === 'completed' ? 'bg-green-100 text-green-800' :
                    j.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    j.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {j.status || 'غير محدد'}
                  </span>
                  <div className="text-xs text-gray-400">
                    منشأة: {j.createdAt ? new Date(j.createdAt).toLocaleString() : 'غير محدد'}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card> */}
          </>
        )}
      </div>
    );
  }



  function renderAdminToolsTab() {
    return (
      <Card className="gradient-border">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">أدوات الإدارة</h3>
              <p className="text-sm text-gray-400">ترقية الأعضاء وإدارة الصلاحيات</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">معرف المحادثة</label>
              <Input
                placeholder="معرف المحادثة أو @username"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">معرف العضو</label>
              <Input
                placeholder="معرف المستخدم للترقية"
                value={promoteMemberId}
                onChange={(e) => setPromoteMemberId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>🔐</span>
              <span>صلاحيات المدير</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                  <span>⚡</span>
                  <span>الصلاحيات الأساسية</span>
                </h5>
              <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_chat}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_chat: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">إدارة المحادثة (وصول كامل)</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_delete_messages}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_delete_messages: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">حذف الرسائل</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_restrict_members}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_restrict_members: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">تقييد الأعضاء</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_promote_members}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_promote_members: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">ترقية الأعضاء</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_invite_users}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_invite_users: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">دعوة المستخدمين</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                  <span>🚀</span>
                  <span>الصلاحيات المتقدمة</span>
                </h5>
              <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_change_info}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_change_info: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">تغيير معلومات المحادثة</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_pin_messages}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_pin_messages: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">تثبيت الرسائل</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_video_chats}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_video_chats: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">إدارة المحادثات المرئية</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_topics}
                    onChange={(e) => setPermissions((prev: any) => ({ ...prev, can_manage_topics: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm text-white font-medium">إدارة المواضيع (المنتديات)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm flex items-start gap-2">
                  <span>💡</span>
                  <span><strong>نصيحة:</strong> ابدأ بالصلاحيات الأساسية مثل "حذف الرسائل" و "تقييد الأعضاء". "إدارة المحادثة" تعطي وصول كامل لجميع الميزات.</span>
                </p>
              </div>
              
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <span><strong>مهم:</strong> ترقية الأعضاء تعمل فقط في <strong>المجموعات الفائقة</strong> و <strong>القنوات</strong>. المجموعات العادية لا تدعم هذه الميزة. قم بتحويل مجموعتك إلى مجموعة فائقة أولاً.</span>
                </p>
              </div>
              
              {botInfo && (
                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm flex items-start gap-2">
                    <span>🤖</span>
                    <span><strong>معرف البوت:</strong> <code className="bg-red-900/30 px-2 py-1 rounded text-xs">{botInfo.botUserId}</code></span>
                  </p>
                  <p className="text-red-300 text-xs mt-2 flex items-start gap-2">
                    <span>📝</span>
                    <span><strong>ملاحظة:</strong> لا تستخدم معرف البوت لترقيته. البوت يحتاج إلى ترقية من مدير بشري أولاً.</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
          <Button 
            onClick={promoteMember}
            disabled={loading || !chatId || !promoteMemberId}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الترقية...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>⬆️</span>
                  <span>ترقية العضو</span>
                </div>
              )}
          </Button>
          </div>
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
                  showSuccess(`تم إضافة ${all.length} محادثة إلى الأهداف`);
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
                              showSuccess(`تم نسخ معرف المحادثة: ${chat.id}`);
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
                            showSuccess(`تم التبديل إلى إدارة المحادثة: ${chat.title}`);
                          }}
                          className="bg-green-500 text-white text-xs"
                        >
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!selectedTargets.includes(chat.id)) setSelectedTargets((prev: string[]) => ([...prev, chat.id] as string[]));
                            showSuccess(`تم إضافة ${chat.id} إلى الأهداف`);
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
                                const res = await telegramBotExportMembers(token, chat.id);
                                if (res.success) {
                                  showSuccess(`تم تحميل ملف Excel: ${res.filename}`);
                                }
                              } catch (e: any) {
                                showError(e.message);
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




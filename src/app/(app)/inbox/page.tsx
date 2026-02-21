"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getUnifiedConversations, 
  getUnifiedMessages,
  sendWhatsAppMessage,
  listEmployees,
  telegramBotGetStatus,
  telegramBotPause,
  telegramBotResume,
  createChatNote,
  apiFetch
} from "@/lib/api";
import { getBotSettings, updateBotSettings, BotSettings as IBotSettings } from "@/lib/botSettingsApi";
import { getBotStatus, pauseBot, resumeBot } from "@/lib/botControlApi";
import { listTags, addContactToTag } from "@/lib/tagsApi";
import { createPortal } from "react-dom";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { 
  Search, 
  MessageSquare, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Filter,
  User,
  Phone,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Video,
  Mic,
  Smile,
  AlertCircle,
  Globe,
  Monitor,
  MapPin,
  AtSign,
  Info,
  X,
  Bot,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import Loader from "@/components/Loader";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

// Native Date Formatter to replace date-fns
const formatTime = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(dateStr));
  } catch { return ''; }
}

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
  } catch { return ''; }
}

// Icons for platforms
const PlatformIcon = ({ platform, className = "" }: { platform: string, className?: string }) => {
  if (platform === 'whatsapp') return <MessageSquare className={`text-[#25D366] ${className}`} size={16} />;
  if (platform === 'telegram') return <Send className={`text-[#0088cc] ${className}`} size={16} />;
  if (platform === 'livechat') return <Globe className={`text-[#f97316] ${className}`} size={16} />;
  return null;
};

// Background colors for avatars
const getAvatarColor = (name: string) => {
  const colors = [
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-rose-500',
    'from-purple-400 to-pink-500',
    'from-cyan-400 to-blue-500',
  ];
  const index = name.length % colors.length;
  return colors[index];
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { showSuccess, showError } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  // Modals state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMentionEmployeeId, setSelectedMentionEmployeeId] = useState<string>("none");

  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tagLoading, setTagLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("none");
  const [assignLoading, setAssignLoading] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);

  // Bot Status states
  const [waBotPaused, setWaBotPaused] = useState(false);
  const [waBotTimeRemaining, setWaBotTimeRemaining] = useState(0);

  const [tgBotPaused, setTgBotPaused] = useState(false);
  const [tgBotTimeRemaining, setTgBotTimeRemaining] = useState(0);

  const [botSettings, setBotSettings] = useState<IBotSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [profilePictureCache, setProfilePictureCache] = useState<{[key: string]: string}>({});

  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [activePlatformFilter, setActivePlatformFilter] = useState<'all' | 'whatsapp' | 'telegram' | 'livechat'>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{url: string, type: string} | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('whatsapp_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setProfilePictureCache(parsed.data || {});
          }
        }
      } catch (e) {
        console.error('Failed to load whatsapp_profile_cache:', e);
      }
    }
  }, []);

  const loadBotStatuses = async () => {
    try {
      if (!token) return;
      const waRes = await getBotStatus();
      if (waRes.success) {
        setWaBotPaused(waRes.data.isPaused);
        setWaBotTimeRemaining(waRes.data.timeRemaining);
      }
      const tgRes = await telegramBotGetStatus(token);
      if (tgRes.success) {
        setTgBotPaused(tgRes.isPaused);
        setTgBotTimeRemaining(tgRes.timeRemaining);
      }
      
      const settingsRes = await getBotSettings();
      if (settingsRes.success) {
        setBotSettings(settingsRes.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      loadBotStatuses();
      // Fetch WhatsApp contacts to populate profile picture cache if possible
      apiFetch<any>('/api/whatsapp/contacts?limit=100', { authToken: token })
        .then(data => {
          if (data.success && data.contacts) {
            const newCache: {[key: string]: string} = {};
            data.contacts.forEach((c: any) => {
              if (c.profilePicture) {
                newCache[c.contactNumber] = c.profilePicture;
              }
            });
            setProfilePictureCache(prev => ({...prev, ...newCache}));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleWaPauseBot = async (mins: number) => {
    try {
      const res = await pauseBot(mins);
      if(res.success) {
        showSuccess(`تم إيقاف بوت واتساب لمدة ${mins} دقيقة`);
        loadBotStatuses();
      }
    }catch(e) {}
  };

  const handleWaResumeBot = async () => {
    try {
      const res = await resumeBot();
      if(res.success) {
        showSuccess("تم استئناف بوت واتساب");
        loadBotStatuses();
      }
    }catch(e) {}
  };

  const handleTgPauseBot = async (mins: number) => {
    try {
      const res = await telegramBotPause(token, mins);
      if(res.success) {
        showSuccess(`تم إيقاف بوت تليجرام لمدة ${mins} دقيقة`);
        loadBotStatuses();
      }
    } catch(e) {}
  };

  const handleTgResumeBot = async () => {
    try {
      const res = await telegramBotResume(token);
      if(res.success) {
        showSuccess("تم استئناف بوت تليجرام");
        loadBotStatuses();
      }
    } catch(e) {}
  };

  const handleResolveEscalation = async () => {
    if(!selectedConversation) return;
    try {
      const { platform, contactId } = selectedConversation;
      const res = await fetch(`/api/escalation/resolve-contact/${contactId}?platform=${platform}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('تم استئناف البوت وحل المحادثة بنجاح');
        fetchConversations();
        setSelectedConversation((prev: any) => ({...prev, isEscalated: false}));
      } else {
        showError(data.message || 'فشل في حل المشكلة');
      }
    } catch (e) {
      showError('فشل في حل المشكلة');
    }
  };

  async function openTagModal() {
    try {
      setTagLoading(true);
      const res = await listTags();
      if (res.success) setTags(res.data || []);
      setShowTagModal(true);
    } catch (e: any) {} finally { setTagLoading(false); }
  }

  async function handleAddToTag() {
    if (!selectedTagId || !selectedConversation) return;
    try {
      setTagLoading(true);
      const res = await addContactToTag(selectedTagId, { contactNumber: selectedConversation.contactId });
      if (res.success) {
        showSuccess("تمت الإضافة إلى التصنيف بنجاح");
        setShowTagModal(false);
      } else {
        showError(res.message || "فشل في الإضافة إلى تصنيف");
      }
    } catch (e: any) { showError(e.message); } finally { setTagLoading(false); }
  }

  async function openNoteModal() {
    setNoteText("");
    setSelectedMentionEmployeeId("none");
    setShowNoteModal(true);
    try {
      const res = await listEmployees(token);
      if (res.success) setEmployees(res.employees || []);
    } catch(e) {}
  }

  async function openAssignModal() {
    setSelectedAssignee("none");
    setShowAssignModal(true);
    try {
      const res = await listEmployees(token);
      if (res.success) setEmployees(res.employees || []);
    } catch(e) {}
  }

  async function handleAssignTicket() {
    if (!selectedConversation || selectedAssignee === "none") return;
    try {
      setAssignLoading(true);
      const { apiFetch } = require("@/lib/api");
      const res = await apiFetch(`/api/dashboard/tickets/${selectedConversation.contactId}/assign`, {
        method: 'PUT',
        authToken: token,
        body: JSON.stringify({ assignedTo: parseInt(selectedAssignee) })
      });
      if (res.success || res.ok) {
        showSuccess("تم تعيين المحادثة بنجاح");
        setShowAssignModal(false);
        fetchConversations();
      } else {
        showError("فشل تعيين المحادثة");
      }
    } catch (e) {
      showError("حدث خطأ أثناء التعيين");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleResolveTicket() {
    if (!selectedConversation) return;
    try {
      const { apiFetch } = require("@/lib/api");
      const res = await apiFetch(`/api/dashboard/tickets/${selectedConversation.contactId}/status`, {
        method: 'PUT',
        authToken: token,
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.success || res.ok) {
        showSuccess("تم إغلاق المحادثة بنجاح");
        fetchConversations();
      } else {
        showError("فشل إغلاق المحادثة");
      }
    } catch (e) {
      showError("حدث خطأ أثناء الإغلاق");
    }
  }

  // Fetch conversations
  const fetchConversations = async (isLoadMore = false) => {
    if (isLoadMore) {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
    } else {
        setLoading(true);
        setPage(1);
        setHasMore(true);
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const { apiFetch } = require("@/lib/api");
      const data = await apiFetch<any>(`/api/unified-inbox/conversations?page=${currentPage}&limit=20`, { authToken: token });
      
      if (data.success) {
        if (isLoadMore) {
          setConversations(prev => [...prev, ...data.conversations]);
          setPage(currentPage);
        } else {
          setConversations(data.conversations);
        }
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (err: any) {
      console.error('Fetch conversations error:', err);
      showError("فشل في جلب المحادثات");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation && token) {
      const fetchMessages = async () => {
        setMessagesLoading(true);
        try {
          const data = await getUnifiedMessages(token, selectedConversation.platform, selectedConversation.contactId);
          if (data.success) {
            setMessages(data.messages);
          }
        } catch (err: any) {
          console.error('Fetch messages error:', err);
          showError("فشل في جلب الرسائل");
        } finally {
          setMessagesLoading(false);
          scrollToBottom();
        }
      };
      fetchMessages();
    }
  }, [selectedConversation, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    setSending(true);
    try {
      let result: any;
      const formData = new FormData();

      if (selectedConversation.platform === 'whatsapp') {
        if (selectedFile) {
          formData.append('to', selectedConversation.contactId);
          formData.append('file', selectedFile);
          if (newMessage.trim()) formData.append('caption', newMessage.trim());
          result = await apiFetch('/api/whatsapp/media', {
            method: 'POST',
            authToken: token,
            body: formData
          });
        } else {
          result = await sendWhatsAppMessage(token, selectedConversation.contactId, newMessage);
        }
      } else if (selectedConversation.platform === 'telegram') {
        if (selectedFile) {
          formData.append('chatId', selectedConversation.contactId);
          formData.append('media', selectedFile);
          if (newMessage.trim()) formData.append('text', newMessage.trim());
          result = await apiFetch('/api/telegram-bot/send', {
            method: 'POST',
            authToken: token,
            body: formData
          });
        } else {
          result = await apiFetch<any>(`/api/telegram-bot/send`, {
            method: 'POST',
            authToken: token,
            body: JSON.stringify({ chatId: selectedConversation.contactId, text: newMessage })
          });
        }
      } else if (selectedConversation.platform === 'livechat') {
        let attachments: string[] = [];
        if (selectedFile) {
          const uploadFormData = new FormData();
          uploadFormData.append('image', selectedFile);
          const uploadRes: any = await apiFetch('/api/dashboard/tickets/upload-image', {
            method: 'POST',
            authToken: token,
            body: uploadFormData
          });
          if (uploadRes.success || uploadRes.url) {
            attachments = [uploadRes.url];
          }
        }
        
        result = await apiFetch<any>(`/api/dashboard/tickets/${selectedConversation.contactId}/messages`, {
          method: 'POST',
          authToken: token,
          body: JSON.stringify({ 
            content: newMessage.trim() || (selectedFile ? 'مرفق' : ''), 
            senderType: 'agent',
            attachments
          })
        });
      }

      if (result?.success || result?.ok || result) {
        const newMsg = {
          id: result?.id || result?.messageId || Date.now().toString(),
          content: newMessage || (selectedFile ? (selectedFile.type.startsWith('image/') ? 'صورة' : selectedFile.name) : ''),
          type: 'outgoing',
          timestamp: new Date().toISOString(),
          contentType: selectedFile ? selectedFile.type.split('/')[0] : 'text',
          mediaUrl: result?.url || result?.mediaUrl || (result?.messages?.[0]?.mediaUrl) || filePreview
        };
        setMessages((prev: any) => [...prev, newMsg]);
        setNewMessage("");
        setSelectedFile(null);
        setFilePreview(null);
        scrollToBottom();
      } else {
        showError(result?.message || "فشل إرسال الرسالة");
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      showError("حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.contactId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.ticketNumber && String(c.ticketNumber).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPlatform = activePlatformFilter === 'all' || c.platform === activePlatformFilter;
    
    return matchesSearch && matchesPlatform;
  });

  const renderConversationDetails = () => {
    if (!selectedConversation) return null;
    const { platform, contactId, name } = selectedConversation;

    if (platform === 'whatsapp') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
              <Phone size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">رقم الهاتف النشط</p>
              <p className="text-sm font-bold text-gray-800 dir-ltr text-right">{contactId}</p>
            </div>
          </div>
              <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Info size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">معلومات واتساب</p>
              <p className="text-sm font-bold text-gray-800">حساب متصل بنجاح</p>
            </div>
          </div>

        
        </motion.div>
      );
    }
    
    if (platform === 'telegram') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
              <AtSign size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">اسم المستخدم</p>
              <p className="text-sm font-bold text-gray-800 dir-ltr text-right">{contactId.startsWith('@') ? contactId : `@${contactId}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">الاسم بالكامل</p>
              <p className="text-sm font-bold text-gray-800">{name}</p>
            </div>
          </div>

          {/* Telegram Settings Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bot size={14} />
              إعدادات تليجرام
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-semibold text-gray-700">تفعيل الذكاء الاصطناعي</span>
                <button 
                  onClick={async () => {
                    if(!botSettings) return;
                    const newVal = !botSettings.telegramAiEnabled;
                    setBotSettings({...botSettings, telegramAiEnabled: newVal});
                    await updateBotSettings({ telegramAiEnabled: newVal });
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${botSettings?.telegramAiEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${botSettings?.telegramAiEnabled ? 'left-1' : 'right-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm font-semibold text-gray-700">تنبيهات الرسائل</span>
                <button 
                  onClick={async () => {
                    if(!botSettings) return;
                    const newVal = !botSettings.telegramNotifyEnabled;
                    setBotSettings({...botSettings, telegramNotifyEnabled: newVal});
                    await updateBotSettings({ telegramNotifyEnabled: newVal });
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${botSettings?.telegramNotifyEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${botSettings?.telegramNotifyEnabled ? 'left-1' : 'right-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (platform === 'livechat') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Monitor size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">تفضيلات النظام</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">Chrome / Windows 10</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <MapPin size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">أقرب تواجد ملتقط</p>
              <p className="text-sm font-bold text-gray-800">السعودية، الرياض</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Globe size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">مسار التصفح</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1 dir-ltr text-right">/pricing</p>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-gray-100">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-110px)] gap-0 bg-[#Fdfdfd] rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200/60 p-1.5">
      
      {/* Sidebar List */}
      <div className="w-[300px] flex flex-col bg-white rounded-l-none rounded-r-3xl overflow-hidden border-l border-gray-100 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)] z-10">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600"> جميع المحادثات</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchConversations}
                disabled={loading}
                className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                title="تحديث المحادثات"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
           
          </div>
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            <Input 
              placeholder="البحث..." 
              className="pr-10 py-5 bg-gray-50/80 border-gray-200/60 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'all', label: 'الكل', count: conversations.length },
              { id: 'whatsapp', label: 'واتساب', icon: <MessageSquare size={12} /> },
              { id: 'telegram', label: 'تليجرام', icon: <Send size={12} /> },
              { id: 'livechat', label: 'لايف شات', icon: <Globe size={12} /> },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActivePlatformFilter(f.id as any)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border
                  ${activePlatformFilter === f.id 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'}
                `}
              >
                {'icon' in f && f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {filteredConversations.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-10 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">لا يوجد محادثات</p>
            </motion.div>
          ) : (
            <>
              <AnimatePresence>
                {filteredConversations.map((conv, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 mb-1.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-300 relative border
                      ${selectedConversation?.id === conv.id 
                        ? 'bg-gradient-to-l from-primary/5 to-transparent border-primary/10 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-gray-50/80'}
                    `}
                  >
                    <div className="relative shrink-0">
                      {conv.platform === 'whatsapp' && (profilePictureCache[conv.contactId] || profilePictureCache[conv.contactId + '@s.whatsapp.net']) ? (
                        <div className="w-11 h-11 rounded-lg shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img 
                            src={profilePictureCache[conv.contactId] || profilePictureCache[conv.contactId + '@s.whatsapp.net']} 
                            className="w-full h-full object-cover" 
                            alt="" 
                          />
                        </div>
                      ) : (
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getAvatarColor(conv.name)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                          {conv.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -left-1 bg-white p-1 rounded-full shadow-sm z-10 border border-gray-100">
                        <PlatformIcon platform={conv.platform} className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex flex-col min-w-0">
                          <h3 className={`text-sm font-bold truncate ${selectedConversation?.id === conv.id ? 'text-primary' : 'text-gray-800'}`}>
                            {conv.name}
                          </h3>
                          {conv.platform === 'whatsapp' && conv.name !== conv.contactId && (
                             <p className="text-[10px] text-gray-400 font-medium">{conv.contactId}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded-full">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conv.lastMessage || 'محادثة جديدة...'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {conv.unreadCount > 0 && (
                            <motion.span 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-red-200"
                            >
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </motion.span>
                          )}
                          {conv.platform === 'livechat' && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              conv.status === 'open' ? 'bg-green-100 text-green-600' : 
                              conv.status === 'waiting_customer' ? 'bg-orange-100 text-orange-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {conv.status === 'open' ? 'نشط' : 
                               conv.status === 'waiting_customer' ? 'انتظار' : 
                               conv.status === 'closed' ? 'مغلق' : 'مفتوحة'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More Indicator */}
              {hasMore && (
                <div className="p-4 flex flex-col items-center">
                  <button 
                    onClick={() => fetchConversations(true)} 
                    disabled={loadingMore}
                    className="text-xs text-primary font-bold bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        تحميل المزيد
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#fdfdfd] relative rounded-3xl overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 m-1">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM0 54.627l.83.83L60 1.66V0h-1.66L0 56.287v-1.66z\' fill=\'%23000000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />

        {selectedConversation ? (
          <>
            {/* Extended Chat Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {selectedConversation.platform === 'whatsapp' && (profilePictureCache[selectedConversation.contactId] || profilePictureCache[selectedConversation.contactId + '@s.whatsapp.net']) ? (
                    <div className="w-10 h-10 rounded-lg shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={profilePictureCache[selectedConversation.contactId] || profilePictureCache[selectedConversation.contactId + '@s.whatsapp.net']} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(selectedConversation.name)} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                      {selectedConversation.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-800 flex items-center gap-1.5">
                    {selectedConversation.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      نشط الآن
                    </p>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <PlatformIcon platform={selectedConversation.platform} className="w-2.5 h-2.5 grayscale opacity-60" />
                      <span className="capitalize">{selectedConversation.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar relative">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full"><Loader size="md" /></div>
              ) : messages.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-full mb-4 border border-primary/10">
                    <MessageCircle size={36} className="text-primary/40" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1.5">ابدأ الدردشة</h3>
                  <p className="text-xs">تفاعل الآن مع العميل بشكل مباشر</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const isOut = msg.type === 'outgoing';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || idx}
                        className={`flex w-full ${isOut ? 'justify-end' : 'justify-start'}`}
                      >
                        {(() => {
                          const mediaUrl = typeof msg.mediaUrl === 'string' 
                            ? msg.mediaUrl 
                            : (Array.isArray(msg.mediaUrl) && msg.mediaUrl.length > 0 ? msg.mediaUrl[0] : null);
                          
                          return (
                            <div className={`max-w-[80%] flex flex-col ${isOut ? 'items-end' : 'items-start'}`}>
                              <div className={`
                                px-4 py-3 text-sm leading-relaxed relative group
                                ${isOut 
                                  ? 'bg-gradient-to-br from-primary to-[#2b4c8a] text-white rounded-2xl rounded-tr-sm shadow-sm' 
                                  : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100'}
                              `}>
                                {mediaUrl && (msg.contentType === 'image' || mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
                                  <img 
                                    src={mediaUrl} 
                                    alt="media" 
                                    onClick={() => setPreviewMedia({ url: mediaUrl, type: 'image' })}
                                    className="max-w-full rounded-xl mb-2 max-h-52 object-contain shadow-xs cursor-pointer hover:opacity-95 transition-opacity" 
                                  />
                                )}
                                {mediaUrl && (msg.contentType === 'video' || mediaUrl.match(/\.(mp4|webm|avi)$/i)) && (
                                  <div className="relative group/vid cursor-pointer" onClick={() => setPreviewMedia({ url: mediaUrl, type: 'video' })}>
                                    <video src={mediaUrl} className="max-w-full rounded-xl mb-2 max-h-52 object-contain shadow-xs" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity">
                                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                                        <Send size={24} className="rotate-90" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {mediaUrl && (msg.contentType === 'audio' || mediaUrl.match(/\.(mp3|wav|ogg)$/i)) && (
                                  <audio src={mediaUrl} controls className="max-w-full mb-2 max-h-12" />
                                )}
                                {mediaUrl && msg.contentType !== 'image' && msg.contentType !== 'video' && msg.contentType !== 'audio' && !mediaUrl.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|avi|mp3|wav|ogg)$/i) && (
                                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 hover:bg-black/10 rounded-xl mb-1.5 transition-colors">
                                    <FileText size={16} />
                                    <span className="text-xs font-semibold underline">تحميل المرفق</span>
                                  </a>
                                )}
                                {msg.content && !(['صورة', 'فيديو', 'مقطع صوتي', 'مستند', '[IMAGE]', '[VIDEO]', '[AUDIO]', '[DOCUMENT]'].includes(msg.content.trim())) && (
                                  <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                                <div className={`
                                  mt-1.5 flex items-center justify-end gap-1 text-[9px] font-medium tracking-wide
                                  ${isOut ? 'text-white/70' : 'text-gray-400'}
                                `}>
                                  {formatTime(msg.timestamp)}
                                  {isOut && <CheckCheck size={12} className="text-blue-300" />}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Input Bar */}
            <div className="p-3 z-20 bg-white/80 backdrop-blur-md border-t border-gray-100 relative">
              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme={Theme.LIGHT}
                    width={320}
                    height={380}
                    searchPlaceHolder="ابحث عن رمز..."
                  />
                </div>
              )}

              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 mb-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 relative"
                >
                  <button 
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  
                  {filePreview ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      <img src={filePreview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText size={24} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                
                <div className="flex items-center gap-1 pr-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(v => !v)}
                    className={`text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg h-9 w-9 ${showEmojiPicker ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <Smile size={20} />
                  </Button>
                  
                  <label htmlFor="inbox-file-upload" className="cursor-pointer">
                    <div className="text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg h-9 w-9 flex items-center justify-center transition-colors">
                      <Paperclip size={20} />
                    </div>
                  </label>
                  <input
                    id="inbox-file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedFile(file);
                      if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => setFilePreview(e.target?.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setFilePreview(null);
                      }
                      e.target.value = '';
                    }}
                  />
                  <div className="w-[1px] h-5 bg-gray-200 mx-0.5"></div>
                  {/* <Button variant="ghost" size="icon" className="text-primary/70 hover:text-primary hover:bg-primary/5 rounded-lg h-9 w-9">
                    <Bot size={20} />
                  </Button> */}
                </div>
                
                <Input 
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 !text-black placeholder:text-gray-400 font-medium"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                <Button 
                
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sending}
                  className="rounded-lg px-4 h-10 bg-black text-white shadow-sm flex items-center gap-1.5 font-bold text-sm"
                >
                  {sending ? <Loader size="sm" /> : <Send size={16} />}
                  <span className="hidden sm:inline">إرسال</span>
                </Button>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-transparent z-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="w-72 h-72 relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-blue-500/5 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
              <div className="absolute inset-6 bg-gradient-to-tr from-primary/5 to-blue-500/5 rounded-full animate-[ping_3s_ease-in-out_infinite_animation-delay-500]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl border border-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <MessageSquare size={72} className="text-primary opacity-80 mix-blend-multiply" />
                </div>
              </div>
            </motion.div>
            <p className="text-gray-500 text-center max-w-md leading-relaxed font-medium">
              الرجاء تحديد محادثة من القائمة لعرض الرسائل وتجربة التواصل السلس عبر قنواتك المختلفة في مكان واحد.
            </p>
          </div>
        )}
      </div>
      
      {/* Context Sidebar (Changes based on Platform) */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-gray-100 bg-[#fdfdfd] flex flex-col rounded-r-none rounded-l-3xl overflow-y-auto custom-scrollbar z-10"
          >
            <div className="p-4">
              <div className="flex flex-col items-center mb-6 relative">
                <div className="absolute top-0 right-0 p-1.5 bg-gray-50 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <AlertCircle size={14} className="text-red-500" />
                </div>
                
                <div className="relative mb-4">
                  {selectedConversation?.platform === 'whatsapp' && profilePictureCache[selectedConversation?.contactId] ? (
                    <div className="w-20 h-20 rounded-2xl shadow-lg shadow-gray-200/40 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={profilePictureCache[selectedConversation?.contactId]} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedConversation.name)} flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-gray-200/40`}>
                      {selectedConversation.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1.5 -left-1.5 bg-white p-2 rounded-xl shadow-md border border-gray-50 z-10">
                    <PlatformIcon platform={selectedConversation.platform} className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-800 text-center line-clamp-2 px-2">{selectedConversation.name}</h3>
                <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(selectedConversation.lastMessageTime)}
                </p>
              </div>
              
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>

              {/* Dynamic Platform Context */}
              {selectedConversation.platform !== 'livechat' && (
                <div className="mb-6">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                    معلومات المنصة
                  </h4>
                  <div className="scale-[0.85] origin-top">
                    {renderConversationDetails()}
                  </div>
                </div>
              )}
              
              <div className={`${selectedConversation.platform === 'livechat' ? 'pt-2' : 'pt-4 border-t border-gray-100/60'}`}>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></div>
                  إجراءات سريعة
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedConversation?.platform === 'whatsapp' && (
                    <>
                      {waBotPaused ? (
                        <Button onClick={handleWaResumeBot} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all shadow-sm">
                          <Bot size={20} className="text-green-500" />
                          <span className="text-[12px] font-bold">استئناف البوت</span>
                        </Button>
                      ) : (
                        <Button onClick={() => handleWaPauseBot(30)} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm">
                          <Bot size={20} className="text-orange-500" />
                          <span className="text-[12px] font-bold">إيقاف البوت 30د</span>
                        </Button>
                      )}
                      <Button onClick={openNoteModal} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                        <FileText size={20} className="text-blue-500" />
                        <span className="text-[12px] font-bold">ملاحظة</span>
                      </Button>
                      <Button onClick={openTagModal} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
                        <Filter size={20} className="text-indigo-500" />
                        <span className="text-[12px] font-bold">تصنيف</span>
                      </Button>
                    </>
                  )}

                  {selectedConversation?.platform === 'telegram' && (
                    <>
                      {tgBotPaused ? (
                        <Button onClick={handleTgResumeBot} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all shadow-sm">
                          <Bot size={20} className="text-green-500" />
                          <span className="text-[12px] font-bold">استئناف البوت</span>
                        </Button>
                      ) : (
                        <Button onClick={() => handleTgPauseBot(30)} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm">
                          <Bot size={20} className="text-orange-500" />
                          <span className="text-[12px] font-bold">إيقاف البوت 30د</span>
                        </Button>
                      )}
                    </>
                  )}

                  {selectedConversation?.platform === 'livechat' && (
                    <>
                      <Button onClick={handleResolveTicket} variant="outline" className="h-auto py-3 bg-white flex flex-col gap-2 rounded-xl border-gray-200/60 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all shadow-sm">
                        <CheckCheck size={20} className="text-green-500" />
                        <span className="text-[12px] font-bold">إغلاق المحادثة</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exquisite Scrollbar & Animations */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
      
      {/* Note Modal */}
      {showNoteModal && (typeof window !== 'undefined') && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div className="absolute inset-0" onClick={() => setShowNoteModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 text-lg font-bold">إضافة ملاحظة على المحادثة</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            
            <div className="space-y-4">
              <textarea 
                className="w-full h-32 p-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                placeholder="اكتب ملاحظتك هنا..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-600">منشن لموظف (اختياري)</label>
                <select
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-gray-700 outline-none border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedMentionEmployeeId}
                  onChange={(e) => setSelectedMentionEmployeeId(e.target.value)}
                >
                  <option value="none">بدون منشن</option>
                  {employees.filter(emp => emp.isActive && emp.phone).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.phone})</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500">سيتم إرسال إشعار للموظف عبر رسائل واتساب داخلية</p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={() => setShowNoteModal(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={async () => {
                    if (!selectedConversation || !noteText.trim()) return;
                    try {
                      setSavingNote(true);
                      const res = await createChatNote(token, { contactNumber: selectedConversation.contactId, note: noteText.trim() });
                      if (res.success) {
                        if (selectedMentionEmployeeId !== "none") {
                          const employee = employees.find(emp => emp.id.toString() === selectedMentionEmployeeId);
                          if (employee && employee.phone) {
                            const mentionMsg = `🔔 *إشعار منشن جديد*\n\nالعميل: ${selectedConversation.contactId}\nالملاحظة: ${noteText.trim()}`;
                            await sendWhatsAppMessage(token, employee.phone, mentionMsg);
                          }
                        }
                        showSuccess('تم حفظ الملاحظة بنجاح');
                        setShowNoteModal(false);
                      }
                    } catch (e: any) { showError('فشل في حفظ الملاحظة'); } 
                    finally { setSavingNote(false); }
                  }}
                  disabled={savingNote || !noteText.trim()}
                  className="bg-primary hover:text-white hover:bg-primary/90 rounded-xl px-6"
                >
                  {savingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tag Modal */}
      {showTagModal && (typeof window !== 'undefined') && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div className="absolute inset-0" onClick={() => setShowTagModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-gray-100">
            <h3 className="text-gray-800 text-base font-bold mb-4">إضافة إلى تصنيف</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">اختر تصنيف موجود</label>
                <select
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedTagId ?? ''}
                  onChange={(e) => setSelectedTagId(parseInt(e.target.value))}
                >
                  <option value="">اختر تصنيف</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-gray-400">أو إضافة تصنيف جديد</span></div>
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="اسم التصنيف الجديد..."
                  className="flex-1 bg-gray-50 border-gray-200 text-sm h-10"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white h-10 px-3"
                  disabled={!newTagName.trim() || creatingTag}
                  onClick={async () => {
                    try {
                      setCreatingTag(true);
                      const { createTag } = require('@/lib/tagsApi');
                      const res = await createTag({ name: newTagName.trim() });
                      if (res.success) {
                        showSuccess("تم إضافة التصنيف الجديد");
                        setNewTagName("");
                        const refreshTags = await listTags();
                        if (refreshTags.success) setTags(refreshTags.data || []);
                      } else {
                        showError(res.message || "فشل إضافة التصنيف");
                      }
                    } catch (e: any) { showError(e.message); } finally { setCreatingTag(false); }
                  }}
                >
                  {creatingTag ? <Loader size="sm" color="white" /> : "إضافة"}
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="w-full text-gray-500 hover:text-gray-700 text-xs" onClick={() => setShowTagModal(false)}>إلغاء</Button>
                <Button size="sm" className="w-full bg-primary text-white shadow-md hover:bg-primary/90 rounded-xl text-xs" onClick={handleAddToTag} disabled={!selectedTagId || tagLoading}>
                  {tagLoading ? 'جاري الحفظ...' : 'حفظ الإضافة'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Modal */}
      {showAssignModal && (typeof window !== 'undefined') && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div className="absolute inset-0" onClick={() => setShowAssignModal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100">
            <h3 className="text-gray-800 text-lg font-bold mb-4">تعيين مسؤول للمحادثة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">اختر المسؤول</label>
                <select
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-gray-700 outline-none border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  <option value="none" disabled>اختر موظف</option>
                  {employees.filter(emp => emp.isActive).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} {emp.phone ? `(${emp.phone})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700" onClick={() => setShowAssignModal(false)}>إلغاء</Button>
                <Button className="w-full bg-primary text-white shadow-md hover:bg-primary/90 rounded-xl" onClick={handleAssignTicket} disabled={selectedAssignee === 'none' || assignLoading}>
                  {assignLoading ? 'جاري التعيين...' : 'تعيين المسؤول'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Media Preview Modal */}
      {previewMedia && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10"
          onClick={() => setPreviewMedia(null)}
        >
          <button 
            className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            onClick={() => setPreviewMedia(null)}
          >
            <X size={32} />
          </button>
          
          <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {previewMedia.type === 'image' ? (
              <img 
                src={previewMedia.url} 
                alt="preview" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            ) : (
              <video 
                src={previewMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

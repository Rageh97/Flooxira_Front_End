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
import { listTags, addContactToTag, createTag } from "@/lib/tagsApi";
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
import { GradientButton } from "@/components/ui/gradient-button";
import { BorderBeam } from "@/components/ui/border-beam";

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
        setTgBotTimeRemaining(tgRes.timeRemaining || 0);
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
      const res = await apiFetch<{ success: boolean; ok?: boolean }>(`/api/dashboard/tickets/${selectedConversation.contactId}/assign`, {
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
      const res = await apiFetch<{ success: boolean; ok?: boolean }>(`/api/dashboard/tickets/${selectedConversation.contactId}/status`, {
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
          result = await apiFetch<any>('/api/whatsapp/media', {
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
          result = await apiFetch<any>('/api/telegram-bot/send', {
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
          const uploadRes = await apiFetch<any>('/api/dashboard/tickets/upload-image', {
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Phone size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">رقم الهاتف</p>
              <p className="text-sm font-bold text-white dir-ltr text-right">{contactId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Info size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">الحالة</p>
              <p className="text-sm font-bold text-emerald-400">حساب متصل</p>
            </div>
          </div>
        </motion.div>
      );
    }
    
    if (platform === 'telegram') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
              <AtSign size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">اسم المستخدم</p>
              <p className="text-sm font-bold text-white dir-ltr text-right">{contactId.startsWith('@') ? contactId : `@${contactId}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <User size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">الاسم</p>
              <p className="text-sm font-bold text-white">{name}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bot size={14} className="text-indigo-400" />
              إعدادات تليجرام
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-gray-300">تفعيل الذكاء الاصطناعي</span>
                <button 
                  onClick={async () => {
                    if(!botSettings) return;
                    const newVal = !botSettings.telegramAiEnabled;
                    setBotSettings({...botSettings, telegramAiEnabled: newVal});
                    await updateBotSettings({ telegramAiEnabled: newVal });
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${botSettings?.telegramAiEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${botSettings?.telegramAiEnabled ? 'left-1' : 'right-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-gray-300">تنبيهات الرسائل</span>
                <button 
                  onClick={async () => {
                    if(!botSettings) return;
                    const newVal = !botSettings.telegramNotifyEnabled;
                    setBotSettings({...botSettings, telegramNotifyEnabled: newVal});
                    await updateBotSettings({ telegramNotifyEnabled: newVal });
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${botSettings?.telegramNotifyEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Monitor size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">نظام التشغيل</p>
              <p className="text-sm font-bold text-white line-clamp-1">Chrome / Windows</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <MapPin size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">الموقع</p>
              <p className="text-sm font-bold text-white">السعودية، الرياض</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Globe size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">الصفحة الحالية</p>
              <p className="text-sm font-bold text-white line-clamp-1 dir-ltr text-right">/pricing</p>
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
    <div className="flex h-[calc(100vh-5.5rem)] gap-0 text-white font-sans rounded-[2rem] overflow-hidden relative" dir="rtl">
      {/* Platform Identity Backgrounds */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/10 via-purple-900/5 to-transparent -z-10 blur-[100px] opacity-60" />

      {/* Sidebar List (Refined & Compact) */}
      <div className="w-[260px] flex flex-col bg-[#0a0c10]/60 backdrop-blur-3xl border-l border-white/5 z-10 shrink-0">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">الدردشات</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fetchConversations()}
                disabled={loading}
                className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors" size={14} />
            <Input 
              placeholder="ابحث..." 
              className="pr-9 h-9 bg-white/5 border-white/5 rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500/50 text-white placeholder:text-gray-700 transition-all text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'whatsapp', label: 'واتساب' },
              { id: 'telegram', label: 'تليجرام' },
              { id: 'livechat', label: 'لايف شات' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActivePlatformFilter(f.id as any)}
                className={`
                  flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap transition-all border
                  ${activePlatformFilter === f.id 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                    : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-gray-400'}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
              <MessageSquare size={32} className="text-white/5 mb-3" />
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">تحدث مع العالم</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredConversations.map((conv, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-2.5 mb-1.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 relative border
                    ${selectedConversation?.id === conv.id 
                      ? 'bg-white/[0.08] border-white/10 shadow-lg' 
                      : 'bg-transparent border-transparent hover:bg-white/[0.04]'}
                  `}
                >
                  <div className="relative shrink-0">
                    {conv.platform === 'whatsapp' && (profilePictureCache[conv.contactId] || profilePictureCache[conv.contactId + '@s.whatsapp.net']) ? (
                      <div className="w-10 h-10 rounded-lg shadow-lg overflow-hidden border border-white/5">
                        <img 
                          src={profilePictureCache[conv.contactId] || profilePictureCache[conv.contactId + '@s.whatsapp.net']} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(conv.name)} flex items-center justify-center text-white font-black text-sm shadow-md border border-white/5`}>
                        {conv.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -left-1 bg-[#0a0c10] p-0.5 rounded shadow-lg z-10 border border-white/5">
                      <PlatformIcon platform={conv.platform} className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-[13px] font-bold truncate ${selectedConversation?.id === conv.id ? 'text-white' : 'text-gray-300'}`}>
                        {conv.name}
                      </h3>
                      <span className="text-[9px] font-bold text-gray-600">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-gray-600'}`}>
                        {conv.lastMessage || 'بدء دردشة...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[9px] font-black h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full shadow-lg">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Main Chat Area (WhatsApp Dark Style) */}
      <div className="flex-1 flex flex-col bg-[#0b141a] relative overflow-hidden border-x border-white/5">
        {selectedConversation ? (
          <>
            {/* Simple Chat Header */}
            <div className="h-20 px-6 flex items-center justify-between bg-[#0a0c10]/40 backdrop-blur-xl border-b border-white/5 z-40 sticky top-0">
              <div className="flex items-center gap-4 text-right">
                <div className="relative">
                  {selectedConversation.platform === 'whatsapp' && (profilePictureCache[selectedConversation.contactId] || profilePictureCache[selectedConversation.contactId + '@s.whatsapp.net']) ? (
                    <div className="w-12 h-12 rounded-2xl shadow-2xl overflow-hidden border border-white/10 ring-2 ring-indigo-500/20">
                      <img 
                        src={profilePictureCache[selectedConversation.contactId] || profilePictureCache[selectedConversation.contactId + '@s.whatsapp.net']} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedConversation.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/10`}>
                      {selectedConversation.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0c0e12]"></div>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white tracking-tight leading-none mb-1.5">
                    {selectedConversation.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">متصل الآن</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 tracking-tighter uppercase whitespace-nowrap">
                   ID: {selectedConversation.contactId}
                 </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 z-10 custom-scrollbar relative">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full"><Loader size="md" variant="primary" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <MessageCircle size={48} className="opacity-10 mb-4" />
                  <p className="text-sm">لا توجد رسائل سابقة في هذه المحادثة</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const isOut = msg.type === 'outgoing';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || idx}
                        className={`flex w-full ${isOut ? 'justify-end' : 'justify-start'}`}
                      >
                        {(() => {
                          const mediaUrl = typeof msg.mediaUrl === 'string' 
                            ? msg.mediaUrl 
                            : (Array.isArray(msg.mediaUrl) && msg.mediaUrl.length > 0 ? msg.mediaUrl[0] : null);
                          
                          return (
                            <div className={`max-w-[75%] flex flex-col ${isOut ? 'items-end' : 'items-start'}`}>
                               <div className={`
                                 px-4 py-2.5 rounded-2xl relative group shadow-sm
                                 ${isOut 
                                   ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                                   : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}
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
                                    <video src={mediaUrl} controls className="max-w-full rounded-xl mb-2 max-h-52 object-contain shadow-xs" />
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
                                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/20 rounded-xl mb-1.5 transition-colors">
                                    <FileText size={16} />
                                    <span className="text-xs font-semibold underline">تحميل المرفق</span>
                                  </a>
                                )}
                                {msg.content && !(['صورة', 'فيديو', 'مقطع صوتي', 'مستند', '[IMAGE]', '[VIDEO]', '[AUDIO]', '[DOCUMENT]'].includes(msg.content.trim())) && (
                                  <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                )}
                                
                                <div className={`
                                   mt-2 flex items-center justify-end gap-1.5 text-[10px] font-bold
                                   ${isOut ? 'text-white/60' : 'text-gray-500'}
                                `}>
                                  {formatTime(msg.timestamp)}
                                  {isOut && <CheckCheck size={13} className="text-indigo-300" />}
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
              {/* Space for floating input to prevent overlap */}
              <div className="pb-24 h-24 w-full" />
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Style Fixed Input Bar */}
            <div className="bg-[#101d25] border-t border-white/5 absolute bottom-0 left-0 right-0 z-50 px-3 py-2.5">
               {/* Emoji Picker Popup */}
               {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-[65px] mb-2 right-4 z-[100] shadow-2xl rounded-2xl overflow-hidden border border-white/10 ring-1 ring-black">
                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme={Theme.DARK}
                    width={320}
                    height={380}
                  />
                </div>
              )}

               <div className="w-full flex items-end gap-2 bg-[#202c33] p-1.5 pl-3 rounded-xl transition-all">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="h-9 w-9 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
                    >
                      <Smile size={20} />
                    </Button>
                    <label htmlFor="chat-file" className="cursor-pointer">
                      <div className="h-9 w-9 text-gray-400 hover:text-white rounded-full hover:bg-white/5 flex items-center justify-center transition-all">
                        <Paperclip size={20} />
                      </div>
                    </label>
                    <input id="chat-file" type="file" className="hidden" />
                  </div>

                  <textarea 
                    rows={1}
                    placeholder="اكتب رسالة..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[14.5px] py-1.5 text-[#e9edef] placeholder:text-gray-500 resize-none max-h-32 custom-scrollbar outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <button 
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className={`
                      h-10 w-10 shrink-0 flex items-center justify-center rounded-full transition-all
                      ${(!newMessage.trim() && !selectedFile) || sending 
                        ? 'text-gray-500' 
                        : 'text-indigo-400 hover:scale-110 active:scale-95'}
                    `}
                  >
                    {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={20} className="-mr-0.5" />}
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl absolute inset-0 animate-pulse"></div>
              <MessageSquare size={100} className="text-white/5 relative z-10" />
            </div>
          </div>
        )}
      </div>
      
      {/* Context Sidebar (Matching Identity) */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#0a0c10]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 overflow-hidden font-sans shrink-0"
          >
             <div className="p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="relative group mb-4">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {selectedConversation?.platform === 'whatsapp' && profilePictureCache[selectedConversation?.contactId] ? (
                        <div className="w-20 h-20 rounded-2xl shadow-xl relative z-10 overflow-hidden border border-white/10 ring-2 ring-white/5">
                          <img 
                            src={profilePictureCache[selectedConversation?.contactId]} 
                            className="w-full h-full object-cover" 
                            alt="" 
                          />
                        </div>
                      ) : (
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedConversation.name)} flex items-center justify-center text-white font-black text-2xl shadow-xl relative z-10 border border-white/10`}>
                          {selectedConversation.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -left-1 bg-[#0a0c10] p-1.5 rounded-lg shadow-xl border border-white/10 z-20">
                        <PlatformIcon platform={selectedConversation.platform} className="w-4 h-4" />
                      </div>
                   </div>
                   
                   <h3 className="text-lg font-bold text-white mb-0.5 line-clamp-1">{selectedConversation.name}</h3>
                   <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-black text-indigo-400 tracking-tight">
                        {selectedConversation.contactId}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600 text-[10px] font-medium">
                         <Clock size={11} className="text-gray-600" />
                         نشط: {formatTime(selectedConversation.lastMessageTime)}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   {/* Clean Content Area (Action-Oriented) */}

                   {/* Actions Center */}
                   {selectedConversation.platform === 'livechat' ? (
                     <section className="pt-5 border-t border-white/5 space-y-3">
                        <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">إدارة التذكرة</h4>
                        <div className="grid grid-cols-1 gap-2">
                           <Button 
                             onClick={handleResolveTicket}
                             className="w-full bg-orange-600/90 hover:bg-orange-600 text-white rounded-lg h-10 text-[13px] font-bold gap-2"
                           >
                             <Check size={16} />
                             إغلاق المحادثة
                           </Button>
                        </div>
                     </section>
                   ) : (selectedConversation.platform === 'whatsapp' || selectedConversation.platform === 'telegram') && (
                     <section className="pt-5 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">البوت</h4>
                           <div className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter ${
                             selectedConversation.platform === 'whatsapp' 
                               ? (waBotPaused ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500')
                               : (tgBotPaused ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500')
                           }`}>
                             {selectedConversation.platform === 'whatsapp' 
                               ? (waBotPaused ? 'PAUSED' : 'ACTIVE')
                               : (tgBotPaused ? 'PAUSED' : 'ACTIVE')}
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                           {selectedConversation.platform === 'whatsapp' ? (
                             waBotPaused ? (
                               <Button onClick={handleWaResumeBot} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-lg h-9 text-[12px] font-bold gap-2">
                                 <RefreshCw size={14} /> استئناف
                               </Button>
                             ) : (
                               <Button onClick={() => handleWaPauseBot(60)} variant="outline" className="w-full bg-white/5 border-white/5 hover:bg-red-500/10 text-red-100 rounded-lg h-9 text-[12px] font-bold gap-2">
                                 <AlertCircle size={14} /> إيقاف مؤقت
                               </Button>
                             )
                           ) : (
                             tgBotPaused ? (
                               <Button onClick={handleTgResumeBot} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-lg h-9 text-[12px] font-bold gap-2">
                                 <RefreshCw size={14} /> استئناف
                               </Button>
                             ) : (
                               <Button onClick={() => handleTgPauseBot(60)} variant="outline" className="w-full bg-white/5 border-white/5 hover:bg-red-500/10 text-red-100 rounded-lg h-9 text-[12px] font-bold gap-2">
                                 <AlertCircle size={14} /> إيقاف مؤقت
                               </Button>
                             )
                           )}
                        </div>
                     </section>
                   )}

                   {/* Team Actions */}
                   <section className="pt-5 border-t border-white/5 space-y-3">
                      <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">الإجراءات</h4>
                      <div className="grid grid-cols-1 gap-2">
                         <button onClick={openNoteModal} className="w-full h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-3 px-3 transition-all border border-white/5">
                            <FileText size={16} className="text-indigo-400" />
                            <span className="text-[13px] font-medium">إضافة ملاحظة</span>
                         </button>
                         <button onClick={openTagModal} className="w-full h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-3 px-3 transition-all border border-white/5">
                            <Filter size={16} className="text-purple-400" />
                            <span className="text-[13px] font-medium">تغيير التصنيف</span>
                         </button>
                         <button onClick={() => setShowAssignModal(true)} className="w-full h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-3 px-3 transition-all border border-white/5">
                            <User size={16} className="text-emerald-400" />
                            <span className="text-[13px] font-medium">تحويل لموظف</span>
                         </button>
                      </div>
                   </section>
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
                  {creatingTag ? <Loader size="sm" variant="primary" /> : "إضافة"}
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
            {previewMedia && previewMedia.type === 'image' ? (
              <img 
                src={previewMedia.url} 
                alt="preview" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            ) : previewMedia && (
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

"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
  Edit2,
  Check,
  X,
  Copy,
  CheckCheck,
  ArrowRight,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Image as ImageIcon,
  ArrowUpRight,
  Video,
  Mic,
  Zap,
  Package,
  Eraser,
  LayoutTemplate,
  Palette,
  UserCircle,
  Droplets,
  History,
  Move,
  Users,
  Wand2,
  Maximize,
  FileVideo,
  Film,
} from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import {
  getAIConversations,
  createAIConversation,
  getAIConversation,
  sendAIMessage,
  sendAIMessageStream,
  deleteAIConversation,
  updateAIConversationTitle,
  getAIStats,
  listPlans,
  type AIConversation,
  type AIMessage,
  type AIStats,
} from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import Loader from "@/components/Loader";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

import { useRouter } from "next/navigation";

export default function AskAIPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'all' | 'ask-ai' | 'media'>('all');
  const [mediaSubTab, setMediaSubTab] = useState<'all' | 'images' | 'video' | 'audio'>('all');
  const [token, setToken] = useState("");
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<AIConversation | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current && !inputMessage) {
      inputRef.current.style.height = '56px';
    }
  }, [inputMessage]);
  
  const streamingMsgRef = useRef<AIMessage | null>(null);
  const streamRef = useRef<{ cancel: () => void } | null>(null);
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading, isAIToolAllowed } = usePermissions();
  const isOutOfCredits = !!(stats && !stats.isUnlimited && stats.remainingCredits <= 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // iOS Safari viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (selectedConversation && (isMobileListOpen || isSidebarOpen) && isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [selectedConversation, isMobileListOpen, isMobile]);

  useEffect(() => {
    if (!token) return;
    loadConversations();
    loadStats();
    checkAIPlans();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pending message after switching to Ask AI
  useEffect(() => {
    if (pendingMessage && currentTab === 'ask-ai' && !sending) {
      if (selectedConversation) {
        const msg = pendingMessage;
        setPendingMessage(null);
        handleSendMessage(msg);
      } else if (!loading && conversations.length > 0) {
        // Automatically select the first conversation if none selected
        loadConversation(conversations[0].id);
      } else if (!loading) {
        // Create new conversation
        handleCreateConversation();
      }
    }
  }, [pendingMessage, currentTab, selectedConversation, conversations, loading, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await getAIConversations(token);
      setConversations(response.conversations || []);
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const checkAIPlans = async () => {
    try {
      const response = await listPlans(token, 'ai');
      setHasAIPlans(response.plans && response.plans.length > 0);
    } catch (error: any) {
      console.error("Failed to check AI plans:", error);
      setHasAIPlans(false);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await getAIConversation(token, conversationId);
      setSelectedConversation(response.conversation);
      setMessages(response.messages || []);
      setIsMobileListOpen(false);
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleCreateConversation = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    try {
      const response = await createAIConversation(token);
      await loadConversations();
      setSelectedConversation(response.conversation);
      setMessages([]);
      setIsMobileListOpen(false);
      // If we had a pending message, it will be handled by the useEffect
      if (!pendingMessage) {
        showSuccess("تم إنشاء محادثة جديدة!");
      }
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleSendMessage = async (overrideContent?: string) => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }

    if (isOutOfCredits) {
      showError("تنبيه", "لقد استنفدت كريديت AI الخاص بك. يرجى ترقية باقتك.");
      return;
    }

    // If on home tab, switch and set pending
    if (currentTab === 'all') {
      const msg = overrideContent || inputMessage.trim();
      if (!msg) return;
      setPendingMessage(msg);
      setCurrentTab('ask-ai');
      setInputMessage("");
      return;
    }

    if (!selectedConversation && !pendingMessage) return;
    
    const userMessageContent = overrideContent || inputMessage.trim();
    if (!userMessageContent || sending) return;

    if (!selectedConversation) return; // Should be handled by useEffect if pending

    setInputMessage("");
    setPendingMessage(null);
    setSending(true);

    try {
      streamRef.current = sendAIMessageStream(
        token,
        selectedConversation.id,
        userMessageContent,
        {
          onStart: ({ userMessage }) => {
            setMessages((prev) => [...prev, userMessage]);
            streamingMsgRef.current = null;
          },
          onDelta: (delta) => {
            if (!delta) return;
            if (!streamingMsgRef.current) {
              const tempMsg: AIMessage = {
                id: -Date.now(),
                conversationId: selectedConversation.id,
                role: 'assistant',
                content: delta,
                creditsUsed: 0,
                createdAt: new Date().toISOString(),
              };
              streamingMsgRef.current = tempMsg;
              setMessages((prev) => [...prev, tempMsg]);
            } else {
              const id = streamingMsgRef.current.id;
              streamingMsgRef.current.content += delta;
              setMessages((prev) => prev.map(m => m.id === id ? { ...m, content: streamingMsgRef.current!.content } : m));
            }
          },
          onDone: ({ assistantMessage, remainingCredits }) => {
            const temp = streamingMsgRef.current;
            if (temp) {
              setMessages((prev) => prev.map(m => m.id === temp.id ? assistantMessage : m));
            } else {
              setMessages((prev) => [...prev, assistantMessage]);
            }
            streamingMsgRef.current = null;
            streamRef.current = null;
            if (stats) {
              setStats({
                ...stats,
                usedCredits: stats.totalCredits - remainingCredits,
                remainingCredits,
              });
            }
            loadConversations();
            setSending(false);
          },
          onError: (message) => {
            showError('خطأ', message);
            streamRef.current = null;
            setSending(false);
          }
        }
      );
    } catch (error: any) {
      showError("خطأ", error.message);
      if (!overrideContent) setInputMessage(userMessageContent);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteAIConversation(token, conversationToDelete.id);
      
      if (selectedConversation?.id === conversationToDelete.id) {
        setSelectedConversation(null);
        setMessages([]);
        setIsMobileListOpen(true);
      }
      
      await loadConversations();
      setDeleteModalOpen(false);
      setConversationToDelete(null);
      showSuccess("تم حذف المحادثة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleUpdateTitle = async () => {
    if (!selectedConversation || !editedTitle.trim()) return;

    try {
      await updateAIConversationTitle(token, selectedConversation.id, editedTitle.trim());
      setSelectedConversation({ ...selectedConversation, title: editedTitle.trim() });
      await loadConversations();
      setEditingTitle(false);
      showSuccess("تم تحديث العنوان!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const openDeleteModal = (conversation: AIConversation) => {
    setConversationToDelete(conversation);
    setDeleteModalOpen(true);
  };

  const handleCopyMessage = async (messageId: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      showSuccess("تم نسخ الرسالة!");
    } catch (error) {
      showError("خطأ", "فشل نسخ الرسالة");
    }
  };

  const renderTabs = () => (
    <div className="flex justify-center mb-10 mt-4">
      <div className="bg-fixed-40 backdrop-blur-lg inner-shadow rounded-[30px] nav-shine-effect border border-white/5">
        <div className="flex justify-around items-center h-16 px-4 gap-2">
          {[
            { id: 'all', label: 'الكل', icon: LayoutGrid },
            { id: 'ask-ai', label: 'فلوكسيرا AI', icon: Sparkles },
            { id: 'media', label: 'ميديا', icon: ImageIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id as any);
                  if (tab.id === 'media') setMediaSubTab('all');
                }}
                className={clsx(
                  "relative flex flex-col items-center justify-center gap-1 min-w-[200px] h-full transition-all duration-500",
                  isActive ? "text-primary scale-110" : "text-gray-400 hover:text-white"
                )}
              >
                <div className="relative">
                  <Icon 
                    size={22} 
                    className={clsx(
                      "transition-all duration-500",
                      isActive ? "drop-shadow-[0_0_8px_rgba(116,226,255,0.4)]" : ""
                    )} 
                  />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(116,226,255,0.8)] animate-pulse" />
                  )}
                </div>
                <span className="text-sm font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInputArea = (isHome: boolean = false) => (
    <div className={`transition-all duration-500 ${isHome ? 'mx-auto w-full max-w-2xl px-4 mt-8 pb-12' : 'border-t border-gray-700 p-4'}`}>
      <div className="relative flex items-center flex-row gap-2">
          <div className="w-full relative flex items-center">
            <textarea
              ref={isHome ? null : (el) => {
                inputRef.current = el;
                if (el) {
                  el.style.height = '56px';
                  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                }
              }}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = '56px';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isHome ? "اكتب سؤالك هنا للبدء مباشرة..." : "اكتب رسالتك هنا... "}
              className={`w-full min-h-[56px] max-h-[200px] bg-[#1a1c1e]/40 backdrop-blur-md border border-blue-500/50 text-white pr-4 pl-14 py-4 rounded-3xl outline-none transition-all scrollbar-hide resize-none flex items-center focus:border-text-primary focus:ring-1 focus:ring-blue-500/20 ${
                isHome ? 'shadow-2xl shadow-blue-500/5' : ''
              }`}
              disabled={sending}
              rows={1}
              style={{ lineHeight: '1.5', overflow: 'hidden' }}
            />
            <div className="absolute left-2 flex gap-2 items-center">
              {sending && !isHome ? (
                <Button
                  onClick={() => { streamRef.current?.cancel(); }}
                  disabled={!sending}
                  size="icon"
                  className="h-10 w-10 !rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 flex items-center justify-center p-0"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-sm" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={
                    !inputMessage.trim() ||
                    (sending && !isHome)
                  }
                  size="icon"
                  className={`h-10 w-10 !rounded-full transition-all duration-300 flex items-center justify-center p-0 ${
                    inputMessage.trim()
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-100 hover:scale-105 active:scale-95'
                      : 'bg-white/5 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-5 w-5 rotate-180" />
                </Button>
              )}
            </div>
          </div>
      </div>
      {(isOutOfCredits || !hasActiveSubscription) && (
        <div className="mt-3 flex items-center gap-2 px-2">
          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
          <p className="text-[10px] text-gray-400">
            {isOutOfCredits 
              ? "لقد استنفدت كريديت AI الخاص بك. يرجى ترقية باقتك." 
              : "تحتاج إلى اشتراك نشط لاستخدام ميزات AI."}
          </p>
        </div>
      )}
    </div>
  );

  const renderMediaNav = () => (
    <div className="flex flex-wrap justify-center mb-10 gap-3 px-4">
      {[
        { id: 'all', label: 'الكل', icon: LayoutGrid },
        { id: 'images', label: 'الصور', icon: ImageIcon },
        { id: 'video', label: 'الفيديو', icon: Video },
        { id: 'audio', label: 'الصوت', icon: Mic }
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = mediaSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setMediaSubTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 mt-5 rounded-2xl transition-all duration-500 border backdrop-blur-md",
              isActive 
                ? "bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/20 scale-105" 
                : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={18} className={isActive ? "text-blue-400" : ""} />
            <span className="text-sm font-bold tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderHomeGrid = () => {
    const features = [
      {
        id: 'ask-ai',
        permId: 'chat',
        title: 'فلوكسيرا AI',
        desc: 'مساعدك الشخصي للدردشة والإجابة على الأسئلة',
        image: '/gpt فلوكسيرا.png',
        status: 'active',
        path: 'chat'
      },
      {
        id: 'text-to-image',
        permId: 'image_gen',
        title: 'تحويل النص لصورة',
        desc: 'حول خيالك إلى صور واقعية مذهلة بجودة فائقة',
        image: '/انشاء الصور.png',
        status: 'active',
        path: '/ask-ai/image'
      },
      {
        id: 'video-gen',
        permId: 'video_gen',
        title: 'توليد الفيديو ',
        desc: 'أنشئ فيديوهات سينمائية من خلال النصوص بذكاء Veo 2.0',
        image: '/تاثيرات الفيديو.png',
        status: 'active',
        path: '/ask-ai/video'
      },
      {
        id: 'voice-gen',
        title: 'توليد الصوت',
        desc: 'حول النصوص إلى تعليق صوتي احترافي',
        image: '/انشاء تعليق صوتي.png',
        status: 'soon'
      },
      {
        id: 'image-to-text',
        permId: 'image_describe',
        title: 'تحويل الصورة الى نص',
        desc: 'تحويل الصورة الى بروميتات',
        path: '/ask-ai/image-to-text',
        image: '/الصورة لنص.png',
        status: 'active'
      },
    ];

    const imageTools = [
      { id: 't2i', permId: 'image_gen', title: 'حول النص الى صورة', desc: 'حول خيالك إلى صور واقعية مذهلة', icon: ImageIcon, path: '/ask-ai/image', image: '/انشاء الصور.png', status: 'active' },
      { id: 'upscale', permId: 'image_upscale', title: 'تحسين الصور', desc: 'زيادة جودة ووضوح الصور بذكاء', icon: Sparkles, path: '/ask-ai/upscale', image: '/رفع جودة الصور.png', status: 'active' },
      { id: 'nano', permId: 'image_nano', title: 'Nano banana Pro', desc: 'نموذج توليد صور فائق السرعة', icon: Zap, path: '/ask-ai/nano', image: '/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png', status: 'active' },
      { id: 'logo', permId: 'image_logo', title: 'صانع الشعار', desc: 'صمم شعارات احترافية في ثوانٍ', icon: LayoutTemplate, path: '/ask-ai/logo', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000', status: 'active' },
      { id: 'edit', permId: 'image_edit', title: 'تحرير الصورة', desc: 'تعديل الصور بالذكاء الاصطناعي', icon: Edit2, path: '/ask-ai/edit', image: '/تعديل الصور.png', status: 'active' },
      { id: 'product', permId: 'image_product', title: 'نماذج منتجات', desc: 'عرض منتجاتك في بيئات احترافية', icon: Package, path: '/ask-ai/product', image: '/نماذج لمنتجك.png', status: 'active' },
      { id: 'bg-remove', permId: 'image_bg_remove', title: 'ازالة الخلفية', desc: 'حذف خلفية الصور بدقة عالية', icon: Eraser, path: '/ask-ai/bg-remove', image: '/ازالة الخلفية.png', status: 'active' },
      { id: 'avatar', permId: 'image_avatar', title: 'انشاء افاتار', desc: 'اصنع شخصيتك الافتراضية الخاصة', icon: UserCircle, path: '/ask-ai/avatar', image: '/انشاء افاتار.png', status: 'active' },
      { id: 'restore', permId: 'image_restore', title: 'ترميم الصور', desc: 'إصلاح الصور التالفة والقديمة', icon: History, path: '/ask-ai/restore', image: '/ترميم الصور .jpeg', status: 'active' },
      { id: 'sketch', permId: 'image_sketch', title: 'رسم الى صور', desc: 'حول رسوماتك اليدوية لصور واقعية', icon: Palette, path: '/ask-ai/sketch', image: '/رسم الصور.png', status: 'active' },
      { id: 'colorize', permId: 'image_colorize', title: 'تلوين الصورة', desc: 'تلوين الصور القديمة بالألوان الطبيعية', icon: Droplets, path: '/ask-ai/colorize', image: '/تلوين الصورة.png', status: 'active' },
    ];

    const videoTools = [
      { id: 'vgen', permId: 'video_gen', title: 'انشاء فيديو', desc: 'أنشئ فيديوهات سينمائية من النصوص', icon: Video, path: '/ask-ai/video', image: '/تاثيرات الفيديو.png', status: 'active' },
      { id: 'long-video', permId: 'video_gen', title: 'فيديو طويل', desc: 'دمج مشاهد متعددة في فيديو واحد طويل', icon: Film, path: '/ask-ai/long-video', image: '/تاثيرات الفيديو.png', status: 'active' },
      { id: 'motion', permId: 'video_motion', title: 'محاكاة الحركة', desc: 'إضافة حركة واقعية للعناصر', icon: Move, path: '/ask-ai/motion', image: '/محاكاة الحركة.png', status: 'active' },
      { id: 'ugc', permId: 'video_ugc', title: 'فيديوهات ugc', desc: 'إنشاء محتوى فيديو تفاعلي', icon: Users, path: '/ask-ai/ugc', image: '/فيديوهات UGC.png', status: 'active' },
      { id: 'effects', permId: 'video_effects', title: 'تأثيرات الفيديو', desc: 'إضافة تأثيرات بصرية مذهلة', icon: Wand2, path: '/ask-ai/effects', image: '/تاثيرات الفيديو.png', status: 'active' },
      { id: 'lipsync', permId: 'video_lipsync', title: 'تحريك الشفاة', desc: 'مزامنة حركة الشفاه مع الصوت', icon: MessageSquare, path: '/ask-ai/lipsync', image: '/تحريك الشفاه.png', status: 'active' },
      { id: 'resize', permId: 'video_resize', title: 'تغيير أبعاد الفيديو', desc: 'تغيير مقاسات الفيديو لمنصات التواصل', icon: Maximize, path: '/ask-ai/resize', image: '/تغيير الابعاد.png', status: 'active' },
      { id: 'vupscale', permId: 'video_upscale', title: 'تحسين الفيديو', desc: 'رفع جودة الفيديو بذكاء', icon: FileVideo, path: '/ask-ai/vupscale', image: '/رفع جودة الفيديو .png', status: 'active' },
    ];

    // Filter by allowed tools
    const filterTools = (tools: any[]) => tools;

    let displayFeatures = filterTools(features);
    if (currentTab === 'media') {
      if (mediaSubTab === 'all') {
        displayFeatures = filterTools(features.filter(f => f.id !== 'ask-ai'));
      } else if (mediaSubTab === 'images') {
        displayFeatures = filterTools(imageTools);
      } else if (mediaSubTab === 'video') {
        displayFeatures = filterTools(videoTools);
      } else if (mediaSubTab === 'audio') {
        displayFeatures = [];
      }
    }

    const renderFeatureCard = (feature: any) => (
      <div
        key={feature.id}
        onClick={() => {
          if (currentTab === 'all' || (currentTab === 'media' && mediaSubTab === 'all')) {
            if (feature.id === 'text-to-image') {
              setCurrentTab('media');
              setMediaSubTab('images');
              return;
            }
            if (feature.id === 'video-gen') {
              setCurrentTab('media');
              setMediaSubTab('video');
              return;
            }
            if (feature.id === 'voice-gen') {
              setCurrentTab('media');
              setMediaSubTab('audio');
              return;
            }
          }

          if (feature.status !== 'active') return;
          if (feature.id === 'ask-ai') setCurrentTab('ask-ai');
          else if (feature.path) router.push(feature.path);
        }}
        className={`group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-white/5 bg-[#1a1c1e] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 ${
          feature.status === 'soon' ? 'opacity-80' : ''
        }`}
      >
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={(feature as any).image}
            alt={feature.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {feature.title}
            </h3>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 mb-4 group-hover:text-gray-300">
            {feature.desc}
          </p>
          
          <button
            disabled={feature.status === 'soon'}
            className="relative inline-flex h-7 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none w-25"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
            <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg px-7 text-sm font-medium backdrop-blur-3xl gap-2 ${
              feature.status === 'active'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-950 text-gray-500 cursor-not-allowed'
            }`}>
              {feature.status === 'active' ? 'ابدأ ' : 'قريباً'}
              {feature.status === 'active' && (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </span>
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center w-full min-h-full">
        {currentTab === 'media' && renderMediaNav()}
        
        {mediaSubTab === 'audio' && currentTab === 'media' ? (
          <div className="flex flex-col items-center justify-center py-32 w-full animate-in fade-in duration-700">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <Mic size={80} className="relative text-primary animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">سيتوفر قريباً</h3>
            <p className="text-gray-400 text-lg">نحن نعمل على إضافة ميزات توليد الصوت الاحترافية</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-4 w-full mx-auto">
              {displayFeatures.map((feature) => renderFeatureCard(feature))}
            </div>

            {(currentTab === 'all' || (currentTab === 'media' && mediaSubTab === 'all')) && (
              <div className="flex flex-col gap-8 px-4 mb-20">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-text-primary/50 to-transparent" />
                  <h2 className="text-2xl font-bold text-white whitespace-nowrap px-4">
                    تصفح جميع الأدوات
                  </h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-text-primary/50 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {[...imageTools, ...videoTools].map((tool) => renderFeatureCard(tool))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Chat Input for "All" Tab */}
        {currentTab === 'all' && renderInputArea(true)}
      </div>
    );
  };


  if (permissionsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  return (
    <div className={clsx(
      "flex flex-col",
      currentTab === 'ask-ai' ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-[calc(100vh-4rem)]"
    )}>
      {/* Conditionally show Tab Navigation */}
      {currentTab !== 'ask-ai' && (
        <div className="shrink-0 flex items-center justify-between px-4">
          <div className="flex-1 shrink-0">{renderTabs()}</div>
          {stats ? (
            <div className="hidden md:flex items-center gap-4 bg-purple-600/10 border border-purple-500/30 px-6 py-2 rounded-[20px] backdrop-blur-md">
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">رصيد الكريديت</span>
                <span className="text-sm font-black text-purple-400">
                  {stats.isUnlimited ? 'غير محدود' : `${stats.remainingCredits.toLocaleString()} كريديت`}
                </span>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/20 animate-pulse">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
              </div>
            </div>
          ) : (
            hasAIPlans && (
              <Button 
                variant="none" 
                className="hidden md:flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-4 rounded-full transition-all"
                onClick={() => router.push('/ask-ai/plans')}
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">باقات AI التوفيرية</span>
              </Button>
            )
          )}
        </div>
      )}

      <div className={clsx(
        "flex flex-1",
        currentTab === 'ask-ai' ? "overflow-hidden" : "px-4"
      )}>
        {currentTab === 'ask-ai' ? (
          <div className="flex flex-1 bg-fixed-40 rounded-xl overflow-hidden min-w-0 h-full relative">
            
            {/* Sidebar Toggle Button (When Sidebar is Closed) */}
            {!isSidebarOpen && !isMobile && (
              <div className="absolute top-4 right-4 z-50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="h-9 w-9 bg-[#1a1c1e] border border-white/10 text-gray-400 hover:text-white rounded-lg shadow-xl"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 h-full ${
              isMobileListOpen ? 'hidden lg:flex' : 'flex'
            }`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-gray-700 p-4 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                       {!isSidebarOpen && !isMobile && <div className="w-10" />} {/* Spacer if toggle is floating above */}
                      <Button
                        variant="none"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setSelectedConversation(null);
                          setCurrentTab('all');
                        }}
                      >
                        <ArrowRight className="h-6 w-6 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden shrink-0"
                        onClick={() => setIsMobileListOpen(true)}
                      >
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </Button>
                    </div>
                    {editingTitle ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button onClick={handleUpdateTitle} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => { setEditingTitle(false); setEditedTitle(""); }} size="sm" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2 truncate">
                          {selectedConversation.title}
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              setEditedTitle(selectedConversation.title);
                              setEditingTitle(true);
                            }}
                            size="icon"
                            variant="none"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-5 w-5 text-primary" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 custom-scrollbar overflow-y-auto overflow-x-hidden p-4 space-y-4 min-w-0">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="spinner">
                          <div className="spinner1"></div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">كيف يمكنني مساعدتك اليوم؟</h3>
                        <p className="text-gray-400">اطرح أي سؤال وسأكون سعيداً بالمساعدة</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div key={message.id} className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] min-w-0 rounded-lg p-4 relative group break-words overflow-hidden ${
                            message.role === "user" ? "bg-blue-600/20 text-white" : "bg-gray-800 text-white shadow-lg"
                          }`}>
                            {message.role === "assistant" ? (
                              <>
                                <div className="w-full min-w-0 max-w-full overflow-x-auto">
                                  <MarkdownRenderer content={message.content} />
                                </div>
                                <Button
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                  size="sm"
                                  variant="ghost"
                                  className="absolute bottom-2 left-2 transition-opacity bg-gray-700/50 hover:bg-gray-700 p-1.5 h-auto opacity-0 group-hover:opacity-100"
                                >
                                  {copiedMessageId === message.id ? <CheckCheck className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-300" />}
                                </Button>
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            <p className="text-[10px] opacity-50 mt-2">
                              {new Date(message.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {sending && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg p-4 bg-gray-800 animate-pulse">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Chat Input */}
                <div className="shrink-0">
                  {renderInputArea(false)}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center relative h-full">
                 <Button
                      variant="none"
                      size="sm"
                      className="absolute top-4 right-4"
                      onClick={() => setCurrentTab('all')}
                    >
                      <ArrowRight className="h-6 w-6 text-primary" />
                    </Button>
                <div className="flex flex-col items-center">
                  <div className="spinner">
                    <div className="spinner1"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">اختر محادثة أو ابدأ محادثة جديدة</h3>
                  <p className="text-primary mb-6">استخدم AI لإنشاء محتوى رائع لوسائل التواصل الاجتماعي</p>
                  <Button onClick={handleCreateConversation} className="primary-button" >
                    بدء محادثة جديدة
                  </Button>
                </div>
              </div>
            )}
            </div>

            {/* Sidebar - Conversations List */}
            <div 
              className={`
                transition-all duration-300 ease-in-out border-r border-gray-700 flex flex-col shrink-0 h-full
                ${isMobile ? (isMobileListOpen ? 'fixed inset-0 z-[100] w-full' : 'hidden') : (isSidebarOpen ? 'w-64' : 'w-0 border-none')}
              `}
            >
              <div className="p-3 flex items-center gap-2 shrink-0">
                  <Button onClick={handleCreateConversation} className="flex-1 primary-button text-xs h-10 px-2">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 ml-1" />
                    محادثة جديدة
                    </div>
                  </Button>
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarOpen(false)}
                      className="h-10 w-10 shrink-0 text-gray-400 hover:text-white"
                    >
                      <PanelLeftClose className="h-5 w-5" />
                    </Button>
                  )}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileListOpen(false)}
                      className="h-10 w-10 shrink-0 text-gray-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
              </div>

              {stats && (
                <div className="px-3 pb-3 shrink-0">
                  <Card className="bg-fixed-40 border-primary rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                          <Sparkles className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">كريديت AI</span>
                      </div>
                      <div className="text-lg font-bold text-white tracking-tight">
                        {stats.isUnlimited ? "غير محدود" : `${stats.remainingCredits.toLocaleString()} / ${stats.totalCredits.toLocaleString()}`}
                      </div>
                      {!stats.isUnlimited && (
                        <>
                          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full transition-all duration-1000" 
                              style={{ width: `${(stats.remainingCredits / stats.totalCredits) * 100}%` }}
                            />
                          </div>
                          <Button 
                            variant="none" 
                            size="sm" 
                            className="w-full mt-4 text-[10px] text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-xl"
                            onClick={() => router.push('/ask-ai/plans')}
                          >
                            شحن الرصيد
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex-1 custom-scrollbar overflow-y-auto px-2 pb-4">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4 opacity-50">
                    <MessageSquare className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-xs text-gray-400">لا توجد محادثات باقية</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`group flex items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                          selectedConversation?.id === conversation.id
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                        onClick={() => loadConversation(conversation.id)}
                      >
                        <MessageSquare className={`h-4 w-4 flex-shrink-0 ${selectedConversation?.id === conversation.id ? 'text-blue-400' : 'text-gray-500'}`} />
                        <span className={`text-xs flex-1 truncate ${selectedConversation?.id === conversation.id ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          {conversation.title}
                        </span>
                        <Button
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(conversation); }}
                          size="sm"
                          variant="none"
                          className="text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            {renderHomeGrid()}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className=" border-white/10 rounded-3xl pb-8">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">حذف المحادثة</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              هل أنت متأكد من حذف "{conversationToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-6">
            <Button
              variant="ghost"
              onClick={() => { setDeleteModalOpen(false); setConversationToDelete(null); }}
              className="rounded-xl px-6"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteConversation}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 shadow-lg shadow-red-600/20"
            >
              حذف نهائي
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب للمتابعة"
        description="للاستفادة من جميع أدوات الذكاء الاصطناعي المتقدمة، تحتاج إلى اشتراك نشط. اختر الباقة المناسبة لك وابدأ رحلتك مع الذكاء الاصطناعي!"
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

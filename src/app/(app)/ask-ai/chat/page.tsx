"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import {
  getAIConversations,
  createAIConversation,
  getAIConversation,
  sendAIMessageStream,
  deleteAIConversation,
  updateAIConversationTitle,
  getAIStats,
  listPlans,
  type AIConversation,
  type AIMessage,
  type AIStats,
} from "@/lib/api";
import Loader from "@/components/Loader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
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
  const [searchQuery, setSearchQuery] = useState("");
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
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();
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
      showSuccess("تم إنشاء محادثة جديدة!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }

    if (isOutOfCredits) {
      showError("تنبيه", "لقد استنفدت كريديت AI الخاص بك. يرجى ترقية باقتك.");
      return;
    }

    if (!selectedConversation) return;
    
    const userMessageContent = inputMessage.trim();
    if (!userMessageContent || sending) return;

    setInputMessage("");
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
      setInputMessage(userMessageContent);
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

  if (permissionsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="جاري التحميل..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
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
                   {!isSidebarOpen && !isMobile && <div className="w-10" />}
                  <Button
                    variant="none"
                    size="sm"
                    className="shrink-0"
                    onClick={() => router.push('/ask-ai')}
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
            <div className="shrink-0 border-t border-gray-700 p-4">
              <div className="relative flex items-center flex-row gap-2">
                  <div className="w-full relative flex items-center">
                    <textarea
                      ref={(el) => {
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
                      placeholder="اكتب رسالتك هنا... "
                      className="w-full min-h-[56px] max-h-[200px] bg-[#1a1c1e]/40 backdrop-blur-md border border-blue-500/50 text-white pr-4 pl-14 py-4 rounded-3xl outline-none transition-all scrollbar-hide resize-none flex items-center focus:border-text-primary focus:ring-1 focus:ring-blue-500/20"
                      disabled={sending}
                      rows={1}
                      style={{ lineHeight: '1.5', overflow: 'hidden' }}
                    />
                    <div className="absolute left-2 flex gap-2 items-center">
                      {sending ? (
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
                          disabled={!inputMessage.trim() || sending}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center relative h-full">
             <Button
                  variant="none"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => router.push('/ask-ai')}
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

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المحادثات..."
                className="bg-white/5 border-white/10 text-right pr-9 h-10 rounded-xl text-xs focus-visible:ring-blue-500/50 text-white placeholder:text-gray-500"
              />
            </div>
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
                {conversations
                  .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((conversation) => (
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

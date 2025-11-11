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
} from "lucide-react";
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
  type AIConversation,
  type AIMessage,
  type AIStats,
} from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import Loader from "@/components/Loader";

export default function AskAIPage() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMsgRef = useRef<AIMessage | null>(null);
  const streamRef = useRef<{ cancel: () => void } | null>(null);
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadConversations();
    loadStats();
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

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await getAIConversation(token, conversationId);
      setSelectedConversation(response.conversation);
      setMessages(response.messages || []);
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await createAIConversation(token);
      await loadConversations();
      setSelectedConversation(response.conversation);
      setMessages([]);
      showSuccess("تم إنشاء محادثة جديدة!");
    } catch (error: any) {
      showError("خطأ", error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || sending) return;

    const userMessageContent = inputMessage.trim();
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
            // Refresh conversations list preview
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
      setInputMessage(userMessageContent); // Restore message on error
    } finally {
      // setSending(false) will be handled in onDone/onError; keep as safety in case of early exceptions
      // setSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteAIConversation(token, conversationToDelete.id);
      
      if (selectedConversation?.id === conversationToDelete.id) {
        setSelectedConversation(null);
        setMessages([]);
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
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="border-orange-200 bg-orange-50 max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 text-orange-800 mb-4">
              <AlertCircle className="h-6 w-6" />
              <p className="text-lg font-medium">ليس لديك اشتراك نشط</p>
            </div>
            <p className="text-center text-orange-600">
              للوصول إلى ميزة AI، يرجى الاشتراك في إحدى باقاتنا.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-fixed-40 rounded-xl">
   

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                {editingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={handleUpdateTitle}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingTitle(false);
                        setEditedTitle("");
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      {selectedConversation.title}
                    </h2>
                    {stats && !stats.isUnlimited && stats.remainingCredits <= 0 && (
                <p className="text-xs text-red-400 mt-2">
                  لقد استنفدت كريديت AI الخاص بك. يرجى ترقية باقتك أو انتظار التجديد.
                </p>
              )}
                    <Button
                      onClick={() => {
                        setEditedTitle(selectedConversation.title);
                        setEditingTitle(true);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit2 className="h-4 w-4 text-gray-400" />
                    </Button>
                    
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      كيف يمكنني مساعدتك اليوم؟
                    </h3>
                    <p className="text-gray-400">
                      اطرح أي سؤال وسأكون سعيداً بالمساعدة
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 relative group ${
                          message.role === "user"
                            ? "bg-blue-600/20 text-white"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <>
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                            <Button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              size="sm"
                              variant="ghost"
                              className="absolute bottom-2 left-2 transition-opacity bg-gray-700/50 hover:bg-gray-700 p-1.5 h-auto"
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCheck className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-300" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-4 bg-gray-800">
                        <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending || !!(stats && !stats.isUnlimited && stats.remainingCredits <= 0)}
                  className="min-h-[60px] self-end border"
                >
                  {sending ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : (
                    <img src="/telegram.gif" alt="" className="w-10 h-10" />
                  )}
                </Button>
                <Button
                  onClick={() => { streamRef.current?.cancel(); }}
                  disabled={!sending}
                  variant="destructive"
                  className="min-h-[60px] self-end"
                >
                  إيقاف
                </Button>
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="اكتب رسالتك هنا... (Enter للإرسال)"
                  className="flex-1 min-h-[60px] max-h-[200px]  border-gray-700 text-white resize-none"
                  disabled={sending || !!(stats && !stats.isUnlimited && stats.remainingCredits <= 0)}
                />
               
              </div>
              {stats && !stats.isUnlimited && stats.remainingCredits <= 0 && (
                <p className="text-xs text-red-400 mt-2">
                  لقد استنفدت كريديت AI الخاص بك. يرجى ترقية باقتك أو انتظار التجديد.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <img src="/Bot.gif" alt="" className="w-40 h-40 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                اختر محادثة أو ابدأ محادثة جديدة
              </h3>
              <p className="text-primary mb-6">
                استخدم AI لإنشاء محتوى رائع لوسائل التواصل الاجتماعي
              </p>
              <Button onClick={handleCreateConversation} className="primary-button">
                {/* <Plus className="h-5 w-5 mr-2" /> */}
                بدء محادثة جديدة
              </Button>
            </div>
          </div>
        )}
      </div>
   {/* Sidebar - Conversations List */}
   <div className="w-64 border-r border-gray-700 flex flex-col">
        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleCreateConversation}
            className="w-full primary-button"
          >
            {/* <Plus className="h-4 w-4 mr-2" /> */}
            محادثة جديدة
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-3 pb-3">
            <Card className="bg-gradient-custom border-primary ">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-primary">كريديت AI</span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  {stats.isUnlimited 
                    ? "غير محدود" 
                    : `${stats.remainingCredits} / ${stats.totalCredits}`
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">لا توجد محادثات بعد</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? "bg-green-600/20 border border-green-600/30"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <MessageSquare className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm text-white flex-1 truncate">
                    {conversation.title}
                  </span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(conversation);
                    }}
                    size="sm"
                    variant="ghost"
                    className=" transition-opacity p-1 h-auto"
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-gray-300">
              هل أنت متأكد من حذف المحادثة "{conversationToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setConversationToDelete(null);
              }}
              className="primary-button after:bg-gray-600"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteConversation}
              className="primary-button after:bg-red-600"
            >
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




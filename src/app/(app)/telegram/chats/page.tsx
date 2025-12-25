"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  telegramBotGetContacts,
  telegramBotGetChatHistory,
  telegramBotSendMessage,
  telegramBotSendMedia,
  telegramBotSendSticker,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EmojiPickerModal } from "@/components/AnimatedEmoji";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

type Contact = {
  chatId: string;
  chatType: string;
  chatTitle: string;
  messageCount: number | string;
  lastMessageTime: string;
  isEscalated?: boolean;
};

type ChatItem = {
  id: number;
  userId: number;
  chatId: string;
  chatType: string;
  chatTitle: string;
  messageType: "incoming" | "outgoing";
  messageContent: string;
  timestamp: string;
  mediaType?: string;
  mediaUrl?: string;
  stickerId?: string;
};

export default function TelegramChatsPage() {
  const { user, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : ""), []);

  const loadContacts = () => {
    if (!token) return;
    setLoadingContacts(true);
    telegramBotGetContacts(token)
      .then((res) => {
        const items = (res.contacts || []) as Contact[];
        setContacts(items);
        if (items.length > 0 && !activeChatId) {
          setActiveChatId(items[0].chatId.toString());
        }
      })
      .finally(() => setLoadingContacts(false));
  };

  useEffect(() => {
    loadContacts();
  }, [token]);

  useEffect(() => {
    if (!token || !activeChatId) return;
    
    // Initial load
    setLoadingHistory(true);
    telegramBotGetChatHistory(token, activeChatId, 100, 0)
      .then((res) => {
        if (res.success && res.chats) {
          // Filter out empty messages and sort by timestamp ascending
          const filtered = (res.chats as ChatItem[])
            .filter(m => m.messageContent && m.messageContent.trim() !== '')
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setHistory(filtered);
        }
      })
      .finally(() => setLoadingHistory(false));

    // Polling for updates - simple replacement strategy
    const interval = setInterval(() => {
      telegramBotGetChatHistory(token, activeChatId, 100, 0)
        .then((res) => {
          if (res.success && res.chats) {
            setHistory(prev => {
              const serverChats = (res.chats as ChatItem[])
                .filter(m => m.messageContent && m.messageContent.trim() !== '')
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              // Keep optimistic messages that haven't been confirmed yet
              const optimistic = prev.filter(p => (p as any).isOptimistic);
              
              // Remove optimistic messages that now exist on server (by matching content and approximate time)
              const remainingOptimistic = optimistic.filter(opt => 
                !serverChats.some(sc => 
                  sc.messageContent === opt.messageContent && 
                  sc.messageType === opt.messageType &&
                  Math.abs(new Date(sc.timestamp).getTime() - new Date(opt.timestamp).getTime()) < 60000
                )
              );
              
              // Combine: server chats + remaining optimistic
              const combined = [...serverChats, ...remainingOptimistic];
              
              // Deduplicate by id (for server messages) and sort
              const uniqueById = new Map<number | string, ChatItem>();
              for (const m of combined) {
                const key = (m as any).isOptimistic ? `opt-${m.timestamp}-${m.messageContent}` : m.id;
                if (!uniqueById.has(key)) {
                  uniqueById.set(key, m);
                }
              }
              
              return Array.from(uniqueById.values())
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            });
          }
        });
    }, 5000); // 5 seconds poll

    return () => clearInterval(interval);
  }, [token, activeChatId]);


  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      telegramBotGetContacts(token).then(res => {
        if (res.success && res.contacts) {
          setContacts(res.contacts as Contact[]);
        }
      });
    }, 30000); // Refresh contacts list every 30s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!loadingHistory && listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [history, activeChatId, loadingHistory]);

  async function handleResolve() {
    if (!token || !activeChatId) return;
    try {
      const res = await fetch(`/api/escalation/resolve-contact/${activeChatId}?platform=telegram`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('تم استئناف البوت بنجاح');
        loadContacts(); // Refresh sidebar to remove yellow status
      } else {
        showError(data.message || 'فشل في حل المشكلة');
      }
    } catch (err: any) {
      showError(err.message || 'فشل في حل المشكلة');
    }
  }

  async function handleSend() {
    if (sending || !token || !activeChatId || (!messageText.trim() && !selectedMedia)) return;
    
    try {
      setSending(true);
      
      if (selectedMedia) {
        // Send media
        const formData = new FormData();
        formData.append('media', selectedMedia);
        formData.append('chatId', activeChatId);
        formData.append('caption', messageText.trim());
        
        await telegramBotSendMedia(token, activeChatId, mediaType, selectedMedia, messageText.trim());
        
        // Optimistic append for media
        setHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            userId: user?.id || 0,
            chatId: activeChatId,
            chatType: "private",
            chatTitle: contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || "",
            messageType: "outgoing",
            messageContent: messageText.trim() || `[${mediaType}]`,
            timestamp: new Date().toISOString(),
            mediaType: mediaType,
            mediaUrl: URL.createObjectURL(selectedMedia),
            isOptimistic: true
          } as any,
        ]);
        
        setSelectedMedia(null);
        setMediaType("");
      } else {
        // Send text message
      await telegramBotSendMessage(token, activeChatId, messageText.trim());
        
        // Optimistic append for text
        setHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            userId: user?.id || 0,
            chatId: activeChatId,
            chatType: "private",
            chatTitle: contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || "",
            messageType: "outgoing",
            messageContent: messageText.trim(),
            timestamp: new Date().toISOString(),
            isOptimistic: true // Flag to identify local messages
          } as any,
        ]);
      }
      
      setMessageText("");
    } finally {
      setSending(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedMedia(file);
    
    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('photo');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else if (file.type.startsWith('audio/')) {
      setMediaType('audio');
    } else {
      setMediaType('document');
    }
  }

  function removeSelectedMedia() {
    setSelectedMedia(null);
    setMediaType("");
  }

  function handleEmojiSelect(emoji: string) {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  function getInitials(name: string) {
    const parts = String(name || "?").trim().split(/\s+/);
    const a = parts[0]?.[0] || "?";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }

  function formatDateLabel(dateIso: string) {
    const d = new Date(dateIso);
    const today = new Date();
    const isSameDay = d.toDateString() === today.toDateString();
    if (isSameDay) return "اليوم";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "أمس";
    return d.toLocaleDateString();
  }


  // Strip HTML tags from message content for clean display
  function stripHtml(html: string): string {
    if (!html) return '';
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    return text.trim();
  }

  const groupedByDay = useMemo(() => {
    // Filter out empty messages and ensure proper sorting
    const validHistory = history.filter(m => 
      m.messageContent && m.messageContent.trim() !== '' && m.timestamp
    );
    
    const sortedHistory = [...validHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const groups: Record<string, ChatItem[]> = {};
    for (const m of sortedHistory) {
      const dayKey = new Date(m.timestamp).toDateString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(m);
    }
    const entries = Object.entries(groups).map(([k, v]) => ({ key: k, items: v }));
    entries.sort((a, b) => new Date(a.items[0].timestamp).getTime() - new Date(b.items[0].timestamp).getTime());
    return entries;
  }, [history]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      c.chatTitle?.toLowerCase().includes(q) || c.chatId.toString().includes(q)
    );
  }, [contacts, query]);

  if (loading) return null;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 md:gap-4">
      <aside className={`w-full lg:w-80 gradient-border inner-shadow rounded-md flex flex-col ${isMobileChatOpen ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-2 border-b">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="البحث في المحادثات..."
            className="w-full  bg-semidark-custom rounded px-2 py-1 text-white"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loadingContacts ? (
            <div className="p-3 text-sm text-white">جاري تحميل المحادثات...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-sm text-white">لا توجد محادثات بعد</div>
          ) : (
            <ul>
              {filtered.map((c) => {
                const isActive = c.chatId.toString() === activeChatId;
                const title = c.chatTitle || c.chatId;
                return (
                  <li
                    key={c.chatId}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${isActive ? "bg-fixed-40 inner-shadow" : c.isEscalated ? "bg-yellow-900/40" : "bg-secondry"}`}
                    onClick={() => {
                      setActiveChatId(c.chatId.toString());
                      setIsMobileChatOpen(true);
                    }}
                    title={String(title)}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        {getInitials(String(title))}
                      </div>
                      {c.isEscalated && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-black text-[8px] font-bold">!</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-white flex items-center justify-between gap-2">
                        <span>{title}</span>
                        {c.isEscalated && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1 rounded">تحويل</span>}
                      </div>
                      <div className="text-[11px] text-white flex justify-between gap-2 opacity-70">
                        <span className="capitalize">{c.chatType}</span>
                        <span>{new Date(c.lastMessageTime).toLocaleString()}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className={`w-full custom-scrollbar lg:flex-1 inner-shadow lg:rounded-md flex flex-col gradient-border ${isMobileChatOpen ? 'mobile-fullscreen-chat bg-dark-custom lg:!bg-transparent ' : 'hidden lg:flex'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-text-primary/50 bg-secondry/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="rtl:rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {getInitials(contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || "")}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium text-sm truncate max-w-[150px]">
                  {contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || "محادثة"}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-gray-400">متصل الآن</span>
                </div>
              </div>
            </div>
          </div>
          
          {contacts.find(c => c.chatId.toString() === activeChatId)?.isEscalated && (
            <button 
              onClick={handleResolve}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] px-2 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              علامة كمحلول
            </button>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden  lg:flex px-4 py-2 border-b items-center justify-between gap-2">
          <div className="font-semibold text-white truncate flex-1">{contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || (activeChatId ? `محادثة ${activeChatId}` : "اختر محادثة")}</div>
          
          {contacts.find(c => c.chatId.toString() === activeChatId)?.isEscalated && (
            <button 
              onClick={handleResolve}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              تم حل المشكلة (استئناف البوت)
            </button>
          )}
        </div>
        <div className="flex-1 custom-scrollbar overflow-auto  px-4 py-3 flex flex-col">
          {loadingHistory ? (
            <div className="text-sm text-gray-600">جاري تحميل الرسائل...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-white">لا توجد رسائل بعد.</div>
          ) : (
            <div className="space-y-4">
              {groupedByDay.map((g) => (
                <div key={g.key} className="space-y-2">
                  <div className="flex items-center justify-center">
                    <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                      {formatDateLabel(g.items[0].timestamp)}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {g.items
                      .map((m) => (
                      <li key={m.id} className={`flex ${m.messageType === "outgoing" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm text-white shadow-sm ${m.messageType === "outgoing" ? "bg-card inner-shadow text-white rounded-tr-sm" : "bg-none inner-shadow rounded-tl-sm"}`}>
                          {/* Media display */}
                          {m.mediaUrl && (
                            <div className="mb-2">
                              {m.mediaType === 'photo' && (
                                <img 
                                  src={m.mediaUrl} 
                                  alt="Media" 
                                  className="max-w-full h-auto rounded-lg"
                                />
                              )}
                              {m.mediaType === 'video' && (
                                <video 
                                  src={m.mediaUrl} 
                                  controls 
                                  className="max-w-full h-auto rounded-lg"
                                />
                              )}
                              {m.mediaType === 'audio' && (
                                <audio 
                                  src={m.mediaUrl} 
                                  controls 
                                  className="w-full"
                                />
                              )}
                              {m.mediaType === 'document' && (
                                <div className="p-2 bg-gray-700 rounded-lg flex items-center gap-2">
                                  <span className="text-blue-400">📄</span>
                                  <span className="text-sm">مستند</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Message content */}
                          {m.messageContent && <div>{stripHtml(m.messageContent)}</div>}
                          
                          <div className={`text-[10px] opacity-70 mt-1 ${m.messageType === "outgoing" ? "text-white/80" : "text-white/80"}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div ref={listEndRef} />
            </div>
          )}
        </div>
        <div className="p-3 border-t">
          {/* Selected media preview */}
          {selectedMedia && (
            <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">
                    {mediaType === 'photo' && '🖼️ صورة'}
                    {mediaType === 'video' && '🎥 فيديو'}
                    {mediaType === 'audio' && '🎵 صوت'}
                    {mediaType === 'document' && '📄 مستند'}
                  </span>
                  <span className="text-xs text-gray-400">{selectedMedia.name}</span>
                </div>
                <button
                  onClick={removeSelectedMedia}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  إزالة
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-1">
            {/* Media upload button */}
            <label className="flex items-center justify-center rounded-lg cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
             <img src="/img.gif" alt="" className="w-10 h-10" />
            </label>
            
            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="flex items-center justify-center rounded-lg transition-colors"
            >
              <img src="/imogi.gif" alt="" className="w-10 h-10" />
            </button>
                 
          <button
              disabled={sending || (!messageText.trim() && !selectedMedia) || !activeChatId}
            onClick={handleSend}
              className="px-1 py-2 rounded text-white disabled:opacity-50"
            >
              {sending ? (
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <img src="/telegram.gif" alt="" className="w-10 h-10" />
              )}
          </button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب رسالة..."
              className="flex-1 bg-fixed-40 text-[16px] sm:text-base border-primary rounded-2xl text-white placeholder-white/50 px-1"
          />
       
          </div>
        </div>
        
        {/* Emoji Picker Modal */}
        <EmojiPickerModal
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />
      </section>
    </div>
  );
}


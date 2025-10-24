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

type Contact = {
  chatId: string;
  chatType: string;
  chatTitle: string;
  messageCount: number | string;
  lastMessageTime: string;
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
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : ""), []);

  useEffect(() => {
    if (!token) return;
    setLoadingContacts(true);
    telegramBotGetContacts(token)
      .then((res) => {
        const items = (res.contacts || []) as Contact[];
        setContacts(items);
        if (items.length > 0) {
          setActiveChatId(items[0].chatId.toString());
        }
      })
      .finally(() => setLoadingContacts(false));
  }, [token]);

  useEffect(() => {
    if (!token || !activeChatId) return;
    setLoadingHistory(true);
    telegramBotGetChatHistory(token, activeChatId, 100, 0)
      .then((res) => setHistory((res.chats || []) as ChatItem[]))
      .finally(() => setLoadingHistory(false));
  }, [token, activeChatId]);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, activeChatId]);

  async function handleSend() {
    if (!token || !activeChatId || (!messageText.trim() && !selectedMedia)) return;
    
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
          },
          ...prev,
        ]);
        
        setSelectedMedia(null);
        setMediaType("");
      } else {
        // Send text message
      await telegramBotSendMessage(token, activeChatId, messageText.trim());
        
        // Optimistic append for text
      setHistory((prev) => [
        {
          id: Date.now(),
          userId: user?.id || 0,
          chatId: activeChatId,
          chatType: "private",
          chatTitle: contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || "",
          messageType: "outgoing",
          messageContent: messageText.trim(),
          timestamp: new Date().toISOString(),
        },
        ...prev,
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

  const groupedByDay = useMemo(() => {
    const groups: Record<string, ChatItem[]> = {};
    for (const m of history) {
      const dayKey = new Date(m.timestamp).toDateString();
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(m);
    }
    const entries = Object.entries(groups).map(([k, v]) => ({ key: k, items: v }));
    // history is newest-first; keep that order for groups too
    entries.sort((a, b) => new Date(b.items[0].timestamp).getTime() - new Date(a.items[0].timestamp).getTime());
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
    <div className="flex h-[calc(100vh-140px)] gap-4">
      <aside className="w-80 gradient-border inner-shadow rounded-md flex flex-col ">
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
            <div className="p-3 text-sm">جاري تحميل المحادثات...</div>
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
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${isActive ? "bg-light-custom inner-shadow" : "bg-secondry"}`}
                    onClick={() => setActiveChatId(c.chatId.toString())}
                    title={String(title)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      {getInitials(String(title))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-white">{title}</div>
                      <div className="text-[11px] text-white flex justify-between gap-2">
                        <span className="capitalize text-green-500">{c.chatType}</span>
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

      <section className="flex-1 inner-shadow rounded-md flex flex-col gradient-border">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="font-semibold text-white truncate">{contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || (activeChatId ? `محادثة ${activeChatId}` : "اختر محادثة")}</div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 flex flex-col-reverse">
          <div ref={listEndRef} />
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
                    {g.items.map((m) => (
                      <li key={m.id} className={`flex ${m.messageType === "outgoing" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm text-white shadow-sm ${m.messageType === "outgoing" ? "bg-card inner-shadow text-white rounded-tr-sm" : "bg-light-custom inner-shadow rounded-tl-sm"}`}>
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
                          {m.messageContent && <div>{m.messageContent}</div>}
                          
                          <div className={`text-[10px] opacity-70 mt-1 ${m.messageType === "outgoing" ? "text-white/80" : "text-white/80"}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
            <label className="flex items-center justify-centerrounded-lg cursor-pointer transition-colors">
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
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب رسالة..."
              className="flex-1 bg-[#011910] py-4 border border-gray-300 rounded-2xl text-white placeholder-white/50 px-1"
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


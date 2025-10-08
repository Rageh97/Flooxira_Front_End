"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  telegramBotGetContacts,
  telegramBotGetChatHistory,
  telegramBotSendMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
    if (!token || !activeChatId || !messageText.trim()) return;
    try {
      setSending(true);
      await telegramBotSendMessage(token, activeChatId, messageText.trim());
      setMessageText("");
      // Optimistic append
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
    } finally {
      setSending(false);
    }
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
      <aside className="w-80 border rounded-md flex flex-col bg-white">
        <div className="p-2 border-b">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="البحث في المحادثات..."
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loadingContacts ? (
            <div className="p-3 text-sm">جاري تحميل المحادثات...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-sm">لا توجد محادثات بعد</div>
          ) : (
            <ul>
              {filtered.map((c) => {
                const isActive = c.chatId.toString() === activeChatId;
                const title = c.chatTitle || c.chatId;
                return (
                  <li
                    key={c.chatId}
                    className={`px-3 py-2 cursor-pointer border-b flex items-center gap-3 ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                    onClick={() => setActiveChatId(c.chatId.toString())}
                    title={String(title)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      {getInitials(String(title))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-[11px] text-gray-500 flex justify-between gap-2">
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

      <section className="flex-1 border rounded-md flex flex-col bg-white">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="font-semibold truncate">{contacts.find((c) => c.chatId.toString() === activeChatId)?.chatTitle || (activeChatId ? `محادثة ${activeChatId}` : "اختر محادثة")}</div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 flex flex-col-reverse">
          <div ref={listEndRef} />
          {loadingHistory ? (
            <div className="text-sm text-gray-600">جاري تحميل الرسائل...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-gray-600">لا توجد رسائل بعد.</div>
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
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.messageType === "outgoing" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-100 rounded-tl-sm"}`}>
                          <div>{m.messageContent}</div>
                          <div className={`text-[10px] opacity-70 mt-1 ${m.messageType === "outgoing" ? "text-white/80" : "text-gray-600"}`}>
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
        <div className="p-3 border-t flex gap-2">
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
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            disabled={sending || !messageText.trim() || !activeChatId}
            onClick={handleSend}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            إرسال
          </button>
        </div>
      </section>
    </div>
  );
}


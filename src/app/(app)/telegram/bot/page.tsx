"use client";
import { useMemo, useState } from "react";
import { useAuth } from "../../../../lib/auth";
import { tgWebSend, tgWebGroups } from "../../../../lib/api";

export default function TelegramBotPage() {
  const { user, loading } = useAuth();
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''), []);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [to, setTo] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  async function loadGroups() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await tgWebGroups(token);
      setGroups(res.groups || []);
    } catch {}
    setBusy(false);
  }

  async function send() {
    if (!token || !to || !message) return;
    setBusy(true);
    try { await tgWebSend(token, to, message); } catch {}
    setBusy(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Telegram Send</h1>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Send to username (@user), phone, or ID.</div>
        <div className="flex gap-2">
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="@username or phone or ID" className="border rounded px-3 py-2 w-80" />
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" className="border rounded px-3 py-2 w-[28rem]" />
          <button onClick={send} disabled={busy || !to || !message} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="font-medium">Groups & Channels</div>
          <button onClick={loadGroups} disabled={busy} className="px-3 py-1.5 bg-gray-100 rounded border">Refresh</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {groups.map(g => (
            <div key={g.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-gray-500">{g.type}</div>
              </div>
              <button onClick={() => setTo(g.id)} className="px-2 py-1 text-sm bg-gray-200 rounded">Use</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


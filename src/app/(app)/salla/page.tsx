"use client";
import { useEffect, useState } from "react";
import { sallaListEvents, sallaUpsertStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SallaEventsPage() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [secret, setSecret] = useState("");

  async function load() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const res = await sallaListEvents(token, 50, 0);
    setEvents(res.events || []);
  }

  async function saveStore() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    await sallaUpsertStore(token, { storeId, storeName, webhookSecret: secret });
    await load();
  }

  useEffect(() => { if (!loading && user) load(); }, [loading, user]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = user ? `${baseUrl}/api/salla/webhook/${user.id}` : `${baseUrl}/api/salla/webhook/{user_id}`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Salla Webhooks</h1>
      <div className="p-4 border rounded-md space-y-2">
        <div className="text-sm">Your webhook URL:</div>
        <code className="block break-all bg-black/20 p-2 rounded">{webhookUrl}</code>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <Input placeholder="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)} />
          <Input placeholder="Store Name (optional)" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Input placeholder="Webhook Secret (from Salla)" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
        <Button className="mt-2" onClick={saveStore}>Save Store Mapping</Button>
      </div>

      <div className="p-4 border rounded-md">
        <h2 className="font-medium mb-2">Recent Events</h2>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="p-2 border rounded text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-green-600/30 rounded">{e.eventType}</span>
                {e.storeId && <span className="px-2 py-0.5 bg-blue-600/30 rounded">store: {e.storeId}</span>}
                <span className="px-2 py-0.5 bg-gray-600/30 rounded">sig: {e.signatureValid ? 'valid' : 'invalid'}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-all text-xs bg-black/20 p-2 rounded">{JSON.stringify(e.payload, null, 2)}</pre>
              <div className="text-xs opacity-70 mt-1">{new Date(e.createdAt || e.receivedAt).toLocaleString()}</div>
            </div>
          ))}
          {events.length === 0 && <div className="text-sm opacity-70">No events yet.</div>}
        </div>
      </div>
    </div>
  );
}



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
  const webhookUrl = user ? `https://api.flooxira.com/api/salla/webhook/${user.id}` : `${baseUrl}/api/salla/webhook/{user_id}`;

  return (
    <div className="space-y-4 text-white">
      <h1 className="text-xl font-semibold">Salla Webhooks</h1>
      <div className="p-4 border rounded-md space-y-2">
        <div className="text-sm">Your webhook URL:</div>
        <code className="block break-all bg-black/20 p-2 rounded text-white">{webhookUrl}</code>
      </div>

      <div className="p-4 border rounded-md">
        <h2 className="font-medium mb-2">Recent Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {events.map((e) => {
            const p = e.payload || {};
            const product = p.data || {};
            const price = product.price?.amount;
            const currency = product.price?.currency;
            const url = product.urls?.customer || product.url;
            const image = (Array.isArray(product.images) && product.images[0]) || product.main_image || product.thumbnail || null;
            const eventTitle = e.eventType || p.event || 'event';
            const status = product.status || p.status;
            return (
              <div key={e.id} className="p-3 rounded text-sm bg-card border-none text-white">
                <div className="flex items-start gap-3">
                  {image && (
                    <img src={image} alt={product.name || 'image'} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2 py-0.5 bg-green-600/30 rounded">{eventTitle}</span>
                      {e.storeId && <span className="px-2 py-0.5 bg-blue-600/30 rounded">Store: {e.storeId}</span>}
                      {status && <span className="px-2 py-0.5 bg-gray-600/30 rounded">{status}</span>}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {product.name && <div><div className="opacity-70 text-xs">Name</div><div className="font-medium">{product.name}</div></div>}
                      {typeof product.id !== 'undefined' && <div><div className="opacity-70 text-xs">ID</div><div className="font-medium">{product.id}</div></div>}
                      {typeof price !== 'undefined' && <div><div className="opacity-70 text-xs">Price</div><div className="font-medium">{price} {currency}</div></div>}
                      {product.quantity !== undefined && <div><div className="opacity-70 text-xs">Quantity</div><div className="font-medium">{product.quantity}</div></div>}
                    </div>
                    {url && (
                      <div className="mt-2">
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 underline">View product</a>
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-2">{new Date(e.createdAt || e.receivedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {events.length === 0 && <div className="text-sm opacity-70">No events yet.</div>}
      </div>
    </div>
  );
}



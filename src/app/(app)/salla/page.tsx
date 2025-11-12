"use client";
import { useEffect, useMemo, useState } from "react";
import { sallaListEvents, sallaUpsertStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/Loader";

export default function SallaEventsPage() {
  const { user, loading } = useAuth();
  const { canSallaIntegration, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
  const [events, setEvents] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [secret, setSecret] = useState("");

  const [selectedType, setSelectedType] = useState<string>("");

  const groupedByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) {
      const p = (e as any)?.payload || {};
      const t = (e as any)?.eventType || p.event || "unknown";
      map[t] = (map[t] || 0) + 1;
    }
    return map;
  }, [events]);

  const sortedTypes = useMemo(() => Object.keys(groupedByType).sort(), [groupedByType]);

  useEffect(() => {
    if (!selectedType && sortedTypes.length > 0) {
      setSelectedType(sortedTypes[0]);
    }
  }, [sortedTypes, selectedType]);

  function getColumnsFor(eventType: string): Array<{ key: string; label: string; path: string }>{
    const family = eventType.includes(".") ? eventType.split(".")[0] : eventType;
    switch (family) {
      case "product":
        return [
          { key: "name", label: "Name", path: "data.name" },
          { key: "id", label: "Product ID", path: "data.id" },
          { key: "sku", label: "SKU", path: "data.sku" },
          { key: "price", label: "Price", path: "data.price.amount" },
          { key: "currency", label: "Currency", path: "data.price.currency" },
          { key: "quantity", label: "Quantity", path: "data.quantity" },
          { key: "status", label: "Status", path: "data.status" },
          { key: "available", label: "Available", path: "data.is_available" }
        ];
      case "order":
        return [
          { key: "id", label: "Order ID", path: "data.id" },
          { key: "number", label: "Number", path: "data.number" },
          { key: "status", label: "Status", path: "data.status" },
          { key: "total", label: "Total", path: "data.total.amount" },
          { key: "currency", label: "Currency", path: "data.total.currency" },
          { key: "customer", label: "Customer", path: "data.customer.name" }
        ];
      case "shipment":
        return [
          { key: "id", label: "Shipment ID", path: "data.id" },
          { key: "order_id", label: "Order ID", path: "data.order_id" },
          { key: "status", label: "Status", path: "data.status" },
          { key: "courier", label: "Courier", path: "data.courier" },
          { key: "tracking", label: "Tracking", path: "data.tracking_number" }
        ];
      case "coupon":
        return [
          { key: "code", label: "Code", path: "data.code" },
          { key: "discount", label: "Discount", path: "data.discount" },
          { key: "type", label: "Type", path: "data.type" },
          { key: "status", label: "Status", path: "data.status" }
        ];
      case "customer":
        return [
          { key: "id", label: "Customer ID", path: "data.id" },
          { key: "name", label: "Name", path: "data.name" },
          { key: "email", label: "Email", path: "data.email" },
          { key: "phone", label: "Phone", path: "data.phone" }
        ];
      default:
        return [
          { key: "event", label: "Event", path: "event" },
          { key: "merchant", label: "Merchant", path: "merchant" },
          { key: "created_at", label: "Created At", path: "created_at" }
        ];
    }
  }

  function getByPath(obj: any, path: string) {
    try {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    } catch {
      return undefined;
    }
  }

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

  // Check permissions
  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <Loader text="جاري التحقق من الصلاحيات..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">تكامل سلة</h1>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد اشتراك نشط</h3>
          <p className="text-gray-600 mb-4">تحتاج إلى اشتراك نشط للوصول إلى تكامل سلة</p>
          <Button 
            onClick={() => window.location.href = '/plans'}
            className="bg-green-600 hover:bg-green-700"
          >
            تصفح الباقات
          </Button>
        </div>
      </div>
    );
  }

  if (!canSallaIntegration()) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">تكامل سلة</h1>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">ليس لديك صلاحية تكامل سلة</h3>
          <p className="text-gray-600 mb-4">باقتك الحالية لا تشمل تكامل سلة</p>
          <Button 
            onClick={() => window.location.href = '/plans'}
            className="bg-green-600 hover:bg-green-700"
          >
            ترقية الباقة
          </Button>
        </div>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = user ? `https://api.flooxira.com/api/salla/webhook/${user.id}` : `${baseUrl}/api/salla/webhook/{user_id}`;

  return (
    <div className="space-y-4 text-white">
      <h1 className="text-xl font-semibold">Salla Webhooks</h1>
      <div className="p-4 gradient-border rounded-md space-y-2">
        <div className="text-sm">Your webhook URL:</div>
        <code className="block break-all bg-[#011910] p-2 rounded text-white">{webhookUrl}</code>
      </div>

      {sortedTypes.length > 0 && (
        <div className="p-4 gradient-border rounded-md space-y-4">
          <h2 className="font-medium">Event Types</h2>
          <div className="flex flex-wrap gap-2">
            {sortedTypes.map((t) => (
              <Button key={t} variant={t === selectedType ? "default" : "secondary"} onClick={() => setSelectedType(t)}>
                {t} <span className="ml-2 opacity-70">({groupedByType[t]})</span>
              </Button>
            ))}
          </div>

          {selectedType && (
            <div className="overflow-x-auto">
              <h3 className="font-medium mt-2 mb-2">{selectedType}</h3>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-2 py-1">#</th>
                    {getColumnsFor(selectedType).map((c) => (
                      <th key={c.key} className="px-2 py-1">{c.label}</th>
                    ))}
                    <th className="px-2 py-1">Store</th>
                    <th className="px-2 py-1">Signature</th>
                    <th className="px-2 py-1">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter((e) => {
                      const p = (e as any)?.payload || {};
                      const t = (e as any)?.eventType || p.event || "unknown";
                      return t === selectedType;
                    })
                    .map((e, idx) => {
                      const p: any = (e as any)?.payload || {};
                      const columns = getColumnsFor(selectedType);
                      return (
                        <tr key={(e as any).id} className="border-b border-gray-800 hover:bg-gray-900/40">
                          <td className="px-2 py-1">{idx + 1}</td>
                          {columns.map((c) => {
                            const v = getByPath(p, c.path);
                            const display = v === undefined || v === null || v === "" ? "-" : String(v);
                            return (
                              <td key={c.key} className="px-2 py-1 whitespace-nowrap">{display}</td>
                            );
                          })}
                          <td className="px-2 py-1">{(e as any).storeId || "-"}</td>
                          <td className="px-2 py-1">{(e as any).signatureValid ? "valid" : "invalid"}</td>
                          <td className="px-2 py-1">{new Date((e as any).createdAt || (e as any).receivedAt).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="p-4 gradient-border rounded-md">
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
                    {/* Event-specific pretty view */}
                    {eventTitle?.startsWith('product.') ? (
                      <ProductDetails product={product} url={url} currency={currency} />
                    ) : (
                      <FallbackDetails payload={p} />
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

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="opacity-70 text-xs">{label}</div>
      <div className="font-medium break-all">{String(value)}</div>
    </div>
  );
}

function ProductDetails({ product, url, currency }: { product: any; url?: string; currency?: string }) {
  const price = product?.price?.amount;
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {product?.name && <Field label="Name" value={product.name} />}
        {product?.id !== undefined && <Field label="Product ID" value={product.id} />}
        {product?.sku !== undefined && <Field label="SKU" value={product.sku || '-'} />}
        {price !== undefined && <Field label="Price" value={`${price} ${currency || ''}`} />}
        {product?.quantity !== undefined && <Field label="Quantity" value={product.quantity} />}
        {product?.status && <Field label="Status" value={product.status} />}
        {product?.is_available !== undefined && <Field label="Available" value={product.is_available ? 'Yes' : 'No'} />}
        {product?.weight !== undefined && <Field label="Weight" value={`${product.weight} ${product.weight_type || ''}`} />}
      </div>
      {(product?.urls?.customer || product?.urls?.admin || url) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {product?.urls?.customer && <a href={product.urls.customer} target="_blank" rel="noreferrer" className="text-blue-400 underline">Customer page</a>}
          {product?.urls?.admin && <a href={product.urls.admin} target="_blank" rel="noreferrer" className="text-blue-400 underline">Admin page</a>}
          {!product?.urls?.customer && url && <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 underline">View product</a>}
        </div>
      )}
      {Array.isArray(product?.categories) && product.categories.length > 0 && (
        <div className="text-sm">
          <div className="opacity-70 text-xs mb-1">Categories</div>
          <div className="flex flex-wrap gap-2">
            {product.categories.slice(0, 8).map((c: any) => (
              <span key={c.id} className="px-2 py-0.5 bg-gray-700/40 rounded">{c.name}</span>
            ))}
            {product.categories.length > 8 && <span className="opacity-60">+{product.categories.length - 8} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function FallbackDetails({ payload }: { payload: any }) {
  const top = {
    event: payload?.event,
    merchant: payload?.merchant,
    created_at: payload?.created_at
  };
  const data = payload?.data || {};
  const primitives: Array<{ label: string; value: any }> = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) {
      primitives.push({ label: k, value: v as any });
    }
  }
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(top).map(([k, v]) => v && <Field key={k} label={k} value={v as any} />)}
        {primitives.map((p, i) => <Field key={i} label={p.label} value={p.value} />)}
      </div>
    </div>
  );
}



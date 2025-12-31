"use client";
import { useEffect, useMemo, useState } from "react";
import { sallaListEvents, sallaUpsertStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/Loader";
import NoActiveSubscription from "@/components/NoActiveSubscription";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Check } from "lucide-react";
import { useTutorials } from "@/hooks/useTutorials";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { Tutorial } from "@/types/tutorial";
import { BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import AnimatedTutorialButton from "@/components/YoutubeButton";
export default function SallaEventsPage() {
  const { user, loading } = useAuth();
  const { canSallaIntegration, hasActiveSubscription, loading: permissionsLoading } = usePermissions();
  
  const [events, setEvents] = useState<any[]>([]);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [secret, setSecret] = useState("");
const { showSuccess, showError } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");
  const [showAllFields, setShowAllFields] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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

  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const { tutorials, getTutorialByCategory, incrementViews } = useTutorials();
  const handleShowTutorial = () => {
    const sallaTutorial = 
      getTutorialByCategory('Salla') || 
      getTutorialByCategory('سلة') || 
      getTutorialByCategory('Salla') || 
      getTutorialByCategory('سلة') ||
      tutorials.find(t => 
        t.title.toLowerCase().includes('سلة') ||
        t.title.toLowerCase().includes('Salla') ||
        t.category.toLowerCase().includes('سلة') ||
        t.category.toLowerCase().includes('Salla')
      ) || null;
    
    if (sallaTutorial) {
      setSelectedTutorial(sallaTutorial);
      incrementViews(sallaTutorial.id);
    } else {
      showError("لم يتم العثور على شرح خاص بسلة");
    }
  };
  useEffect(() => {
    if (!selectedType && sortedTypes.length > 0) {
      setSelectedType(sortedTypes[0]);
    }
  }, [sortedTypes, selectedType]);

  function getByPath(obj: any, path: string) {
    try {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    } catch {
      return undefined;
    }
  }

  function flatten(obj: any, prefix = "", out: Record<string, any> = {}, depth = 0, maxDepth = 6) {
    if (obj === null || obj === undefined) return out;
    if (depth > maxDepth) return out;
    if (typeof obj !== "object") {
      out[prefix] = obj;
      return out;
    }
    if (Array.isArray(obj)) {
      // Represent arrays as JSON strings to keep a single cell value
      out[prefix] = obj;
      return out;
    }
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        flatten(v as any, key, out, depth + 1, maxDepth);
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  const selectedTypeColumns = useMemo(() => {
    if (!selectedType) return [] as string[];
    const keys = new Set<string>();
    for (const e of events) {
      const p = (e as any)?.payload || {};
      const t = (e as any)?.eventType || p.event || "unknown";
      if (t !== selectedType) continue;
      const flat = flatten(p?.data || {});
      Object.keys(flat).forEach((k) => keys.add(k));
    }
    return Array.from(keys).sort();
  }, [events, selectedType]);

  function importantKeysFor(eventType: string): string[] {
    const family = eventType.includes('.') ? eventType.split('.')[0] : eventType;
    switch (family) {
      case 'product':
        return [
          'id',
          'name',
          'sku',
          'status',
          'is_available',
          'quantity',
          'price.amount',
          'price.currency',
          'regular_price.amount',
          'sale_price.amount',
          'urls.customer',
          'urls.admin',
          'updated_at'
        ];
      case 'order':
        return [
          'id',
          'number',
          'status',
          'total.amount',
          'total.currency',
          'customer.name',
          'created_at'
        ];
      case 'shipment':
        return [
          'id',
          'order_id',
          'status',
          'courier',
          'tracking_number',
          'updated_at'
        ];
      case 'coupon':
        return [
          'code',
          'type',
          'status',
          'discount',
          'start_at',
          'end_at'
        ];
      case 'customer':
        return [
          'id',
          'name',
          'email',
          'phone',
          'created_at'
        ];
      default:
        return [
          'id',
          'name',
          'status',
          'created_at',
          'updated_at'
        ];
    }
  }

  // Translate event type to Arabic
  function getEventTypeArabic(eventType: string): string {
    const translations: Record<string, string> = {
      'product.created': 'منتج جديد',
      'product.updated': 'تحديث منتج',
      'product.deleted': 'حذف منتج',
      'product.available': 'منتج متاح',
      'product.quantity.low': 'كمية منخفضة',
      'order.created': 'طلب جديد',
      'order.updated': 'تحديث طلب',
      'order.cancelled': 'إلغاء طلب',
      'order.refunded': 'استرجاع طلب',
      'order.payment.updated': 'تحديث دفع',
      'order.shipped': 'شحن طلب',
      'order.delivered': 'تسليم طلب',
      'shipment.created': 'شحنة جديدة',
      'shipment.updated': 'تحديث شحنة',
      'shipment.cancelled': 'إلغاء شحنة',
      'customer.created': 'عميل جديد',
      'customer.updated': 'تحديث عميل',
      'customer.login': 'تسجيل دخول عميل',
      'coupon.created': 'كوبون جديد',
      'coupon.updated': 'تحديث كوبون',
      'category.created': 'تصنيف جديد',
      'category.updated': 'تحديث تصنيف',
      'review.created': 'تقييم جديد',
      'review.updated': 'تحديث تقييم',
    };
    return translations[eventType] || eventType;
  }

  const columnsToRender = useMemo(() => {
    const all = selectedTypeColumns;
    if (!selectedType) return all;
    const important = importantKeysFor(selectedType).filter((k) => all.includes(k));
    if (!showAllFields && important.length > 0) return important;
    return all;
  }, [selectedTypeColumns, selectedType, showAllFields]);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      toast.success("تم نسخ الرابط بنجاح!");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast.error("فشل نسخ الرابط");
    }
  };

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
      <NoActiveSubscription 
        heading="تكامل سلة"
        featureName="تكامل سلة"
        className="space-y-8"
      />
    );
  }

  if (!canSallaIntegration()) {
    return (
      <div className="space-y-8 bg-fixed-40 border-none">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">ليس لديك صلاحية تكامل سلة</h3>
          <p className="text-gray-300 mb-4">باقتك الحالية لا تشمل تكامل سلة</p>
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
  const webhookUrl = user?.storeId 
    ? `https://api.flooxira.com/api/salla/webhook/${user.storeId}` 
    : `${baseUrl}/api/salla/webhook/{store_id}`;


  return (
    <div className="space-y-4 text-white">
<div className="flex items-center justify-between">
  <h1 className="text-xl font-semibold">سلة ويب هوك</h1>
  <AnimatedTutorialButton onClick={handleShowTutorial} text1="شرح الميزة" text2="شاهد" />
</div>
      <div className="p-4 gradient-border rounded-md space-y-2">
        <div className="text-sm">الرابط:</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 block break-all bg-secondry p-2 rounded text-white">{webhookUrl}</code>
          <Button
            onClick={copyWebhookUrl}
            className="primary-button shrink-0"
            size="sm"
          >
            {copiedUrl ? (
              <>
                {/* <Check className="w-4 h-4 mr-1" /> */}
                تم النسخ
              </>
            ) : (
              <>
                {/* <Copy className="w-4 h-4 mr-1" /> */}
                نسخ
              </>
            )}
          </Button>
        </div>
      </div>

      {sortedTypes.length > 0 && (
        <div className="p-4 gradient-border rounded-md space-y-4">
          <h2 className="font-medium">نوع الحدث</h2>
          <div className="flex flex-wrap gap-2">
            {sortedTypes.map((t) => (
              <Button className="primary-button" key={t} variant={t === selectedType ? "default" : "secondary"} onClick={() => setSelectedType(t)}>
               {getEventTypeArabic(t)} <span className="text-xs opacity-70 mr-1">({groupedByType[t]})</span>
              </Button>
            ))}
          </div>

          {selectedType && (
            <div className="overflow-x-auto">
              <h3 className="font-medium mt-2 mb-2">{getEventTypeArabic(selectedType)}</h3>
              <div className="mb-2">
                <Button className="primary-button after:bg-[#03132c]" variant={showAllFields ? 'secondary' : 'default'} onClick={() => setShowAllFields((v) => !v)}>
                  {showAllFields ? 'عرض الحقول المهمة فقط' : 'عرض جميع الحقول'}
                </Button>
              </div>
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="px-2 py-1">#</TableHead> */}
                    {columnsToRender.map((key) => (
                      <TableHead key={key} className="px-2 py-1 whitespace-nowrap">{key}</TableHead>
                    ))}
                    <TableHead className="px-2 py-1">Store</TableHead>
                    <TableHead className="px-2 py-1">Signature</TableHead>
                    <TableHead className="px-2 py-1">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events
                    .filter((e) => {
                      const p = (e as any)?.payload || {};
                      const t = (e as any)?.eventType || p.event || "unknown";
                      return t === selectedType;
                    })
                    .map((e, idx) => {
                      const p: any = (e as any)?.payload || {};
                      return (
                        <TableRow key={(e as any).id} className="border-b border-gray-800 hover:bg-gray-900/40">
                          {/* <TableCell className="px-2 py-1">{idx + 1}</TableCell> */}
                          {columnsToRender.map((key) => {
                            const v = getByPath(p?.data || {}, key);
                            let display: any = v;
                            if (v === undefined || v === null || v === "") display = "-";
                            else if (typeof v === "object") display = JSON.stringify(v);
                            return (
                              <TableCell key={key} className="px-2 py-1 whitespace-nowrap">{display}</TableCell>
                            );
                          })}
                          <TableCell className="px-2 py-1">{(e as any).storeId || "-"}</TableCell>
                          <TableCell className="px-2 py-1">{(e as any).signatureValid ? "valid" : "invalid"}</TableCell>
                          <TableCell className="px-2 py-1">{new Date((e as any).createdAt || (e as any).receivedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* <div className="p-4 gradient-border rounded-md">
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
      </div> */}
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



"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  listEventsPluginConfigs,
  createEventsPluginConfig,
  updateEventsPluginConfig,
  deleteEventsPluginConfig,
  regenerateEventsPluginKeys,
  getEventsPluginLogs,
  getEventsPluginStats,
  testEventsPluginConnection,
  EventsPluginConfig,
  EventLog,
} from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Code,
  AlertTriangle,
  Zap,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";
import AuthGuard from "@/components/AuthGuard";
import NoActiveSubscription from "@/components/NoActiveSubscription";

const PLATFORMS = [
  // { key: "woocommerce", label: "WooCommerce", icon: "🛒" },
  { key: "salla", label: "سلة", icon: <img className="w-10 h-10 flex items-center justify-center" src="/salla.png"/> },
  // { key: "zid", label: "زد", icon: "📦" },
  // { key: "shopify", label: "Shopify", icon: "🏪" },
  { key: "custom", label: "مخصص", icon: "⚙️" },
  // { key: "other", label: "أخرى", icon: "📱" },
];

const EVENT_TYPES = [
  { key: "order_created", label: "طلب جديد", icon: Zap, color: "text-yellow-400" },
  { key: "order_status_updated", label: "تحديث الطلب", icon: RefreshCw, color: "text-blue-400" },
  { key: "customer_created", label: "عميل جديد", icon: Activity, color: "text-green-400" },
  { key: "abandoned_cart", label: "سلة منسية", icon: AlertTriangle, color: "text-orange-400" },
  { key: "payment_status_updated", label: "حالة الدفع", icon: Key, color: "text-purple-400" },
];

export default function EventsPluginPage() {
  const auth = useAuth();
  const { showSuccess, showError } = useToast();
  const token = auth.getToken() || "";

  const [configs, setConfigs] = useState<EventsPluginConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<EventsPluginConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [setupOpen, setSetupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Detail Stats & Logs for active platform
  const [activeLogs, setActiveLogs] = useState<EventLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });
  const [activeStats, setActiveStats] = useState<any>(null);

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<EventLog | null>(null);
  const [newPlatformData, setNewPlatformData] = useState<Partial<EventsPluginConfig>>({
    platform: 'custom',
    enabledEvents: {
      'order.created': true,
      'order.paid': true,
    }
  });

  useEffect(() => {
    if (token) loadConfigs();
  }, [token]);

  useEffect(() => {
    if (activeConfig) {
      loadDetailedData(activeConfig.id);
    }
  }, [activeConfig]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const res = await listEventsPluginConfigs(token!);
      setConfigs(res.configs);
      if (res.configs.length > 0 && !activeConfig) {
        // Optionally auto-select first one, or keep list view
      }
    } catch (e: any) {
      // التحقق من أخطاء الاشتراك والصلاحيات
      const errorMsg = e.message?.toLowerCase() || '';
      const isSubscriptionError = 
        errorMsg.includes("subscription") || 
        errorMsg.includes("الميزة") || 
        errorMsg.includes("اشتراك") ||
        errorMsg.includes("باقت") ||
        errorMsg.includes("غير متاح") ||
        errorMsg.includes("not available") ||
        errorMsg.includes("not active");
      
      if (isSubscriptionError) {
        setError("feature_not_available");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedData = async (configId: number, page: number = 1) => {
    try {
      const logsRes = await getEventsPluginLogs(token!, { configId, limit: 10, page });
      setActiveLogs(logsRes.events);
      setPagination(logsRes.pagination);

      const statsRes = await getEventsPluginStats(token!, '7d', configId);
      setActiveStats(statsRes);
    } catch (e: any) {
      showError("خطأ", "فشل تحميل تفاصيل المنصة");
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await createEventsPluginConfig(token!, newPlatformData);
      setConfigs([res.config, ...configs]);
      setSetupOpen(false);
      setActiveConfig(res.config);
      showSuccess("نجاح", "تم إضافة منصة جديدة بنجاح");
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا التكامل؟ سيتم حذف جميع السجلات المتعلقة به.")) return;
    try {
      await deleteEventsPluginConfig(token!, id);
      setConfigs(configs.filter(c => c.id !== id));
      if (activeConfig?.id === id) setActiveConfig(null);
      showSuccess("تم", "تم حذف التكامل بنجاح");
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleUpdateActive = async (updates: Partial<EventsPluginConfig>) => {
    if (!activeConfig) return;
    try {
      const res = await updateEventsPluginConfig(token!, activeConfig.id, updates);
      setConfigs(configs.map(c => c.id === activeConfig.id ? res.config : c));
      setActiveConfig(res.config);
      showSuccess("تم الحفظ", "تم تحديث الإعدادات");
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showSuccess("تم النسخ", "تم نسخ الرابط للحافظة");
  };

  const toggleEvent = (eventKey: string) => {
    if (!activeConfig) return;
    const newEvents = {
      ...activeConfig.enabledEvents,
      [eventKey]: !activeConfig.enabledEvents[eventKey],
    };
    handleUpdateActive({ enabledEvents: newEvents });
  };

  if (loading) return <AuthGuard><div className="flex h-screen items-center justify-center"><RefreshCw className="animate-spin h-10 w-10 text-primary" /></div></AuthGuard>;
  if (error === "feature_not_available") return <AuthGuard><NoActiveSubscription heading="تكامل الأحداث" featureName="ربط المنصات الخارجية" description="يرجى الاشتراك لتفعيل ميزة ربط المنصات الخارجية" /></AuthGuard>;

  return (
    <AuthGuard>
      <div className="space-y-3 mx-auto p-4 md:p-8">
        {/* Breadcrumbs / Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white" onClick={() => setActiveConfig(null)} style={{ cursor: 'pointer' }}>
              تكامل الأحداث
            </h1>
            {activeConfig && (
              <>
                <ChevronRight className="h-6 w-6 text-gray-500" />
                <span className="text-2xl font-medium text-primary">
                  {PLATFORMS.find(p => p.key === activeConfig.platform)?.label || activeConfig.platformName}
                </span>
              </>
            )}
          </div>
          <Button onClick={() => setSetupOpen(true)} className="primary-button group ">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            إضافة منصة جديدة
            </div>
          </Button>
        </div>

        {!activeConfig ? (
          /* Grid View of Configs */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => {
              const platform = PLATFORMS.find(p => p.key === config.platform);
              const eventCount = Object.values(config.stats || {}).reduce((a, b) => a + b, 0);
              return (
                <div 
                  key={config.id} 
                  className="gradient-border hover:scale-[1.02] transition-all cursor-pointer group rounded-xl overflow-hidden"
                  onClick={() => setActiveConfig(config)}
                >
                  <Card className="gradient-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{platform?.icon || '🌐'}</div>
                        <div>
                          <CardTitle className="text-white">{platform?.label || config.platformName}</CardTitle>
                          <p className={`text-xs text-gray-400 ${config.isActive ? 'text-green-500' : 'text-red-500'}`}>{config.isActive ? 'متصل ونشط' : 'متوقف حالياً'}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-bold text-white">{eventCount}</p>
                          <p className="text-xs text-primary">إجمالي الأحداث المستلمة</p>
                        </div>
                        <Button variant="ghost" size="sm" className="primary-button after:bg-blue-500">
                       <div className="flex items-center gap-2">
                        عرض التفاصيل <ArrowRight className="h-4 w-4 mr-1" />
                       </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {configs.length === 0 && (
              <div className="col-span-full py-20 text-center bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-800">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">ابدأ بربط أول منصة لك</h3>
                  <p className="text-gray-400 text-sm">يمكنك استقبال الأحداث من سلة، زد، ووردبريس أو أي نظام مخصص مباشرة إلى هنا وتحويلها لرسائل واتساب تلقائية.</p>
                  <Button onClick={() => setSetupOpen(true)} className="primary-button pr-8 pl-8">إضافة تكامل الآن</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Detailed View */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Stats & Actions */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Stats Summary */}
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className=" gradient-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400">إجمالي الأحداث</p>
                      <p className="text-2xl font-bold text-white">{activeStats?.totalEvents || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className=" gradient-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400">قيمة العمليات</p>
                      <p className="text-2xl font-bold text-green-400">{activeStats?.totalAmount?.toFixed(2) || 0} ر.س</p>
                    </CardContent>
                  </Card>
                  <Card className=" gradient-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400">حالة الربط</p>
                      <p className={`text-lg font-bold ${activeConfig.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        {activeConfig.isActive ? 'نشط' : 'متوقف'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className=" gradient-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-400">آخر ظهور</p>
                      <p className="text-sm text-white font-medium">
                        {activeConfig.lastEventAt ? new Date(activeConfig.lastEventAt).toLocaleTimeString('ar-SA') : 'لا يوجد'}
                      </p>
                    </CardContent>
                  </Card>
                </div> */}

                {/* Specific Event Types Stats Grid (Custom only) */}
                {activeConfig.platform === 'custom' && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {EVENT_TYPES.map(type => {
                      const count = activeConfig.stats?.[type.key] || 0;
                      return (
                        <div key={type.key} className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 text-center">
                          <type.icon className={`h-5 w-5 mx-auto mb-1 ${type.color}`} />
                          <p className="text-lg font-bold text-white">{count}</p>
                          <p className="text-[10px] text-gray-400">{type.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recent Events Cards */}
                <Card className="gradient-border overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-400" />
                      آخر الأحداث المستلمة
                      {pagination.total > 0 && (
                        <span className="text-xs text-gray-200 font-normal">({pagination.total})</span>
                      )}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => loadDetailedData(activeConfig.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      تحديث
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    {activeLogs.length === 0 ? (
                      <div className="py-10 text-center text-gray-400">
                        <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>لا توجد أحداث بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeLogs.map((log) => (
                          <div 
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="p-4 bg-fixed-40 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/30"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  log.eventType.includes('order') ? 'bg-green-500/20' :
                                  log.eventType.includes('customer') ? 'bg-blue-500/20' :
                                  log.eventType.includes('product') ? 'bg-orange-500/20' : 'bg-gray-500/20'
                                }`}>
                                  {log.eventType.includes('order') ? <Zap className="h-4 w-4 text-green-400" /> :
                                   log.eventType.includes('customer') ? <Activity className="h-4 w-4 text-blue-400" /> :
                                   <Activity className="h-4 w-4 text-gray-400" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {getEventTitle(log.eventType)}
                                  </p>
                                  <p className="text-xs text-primary mt-0.5">
                                    {new Date(log.createdAt).toLocaleString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-left">
                                {/* {log.orderAmount ? (
                                  <p className="text-lg font-bold text-green-400">{log.orderAmount} ر.س</p>
                                ) : log.customerName || log.customerPhone ? (
                                  <p className="text-sm text-gray-300">{log.customerName || log.customerPhone}</p>
                                ) : null} */}
                              </div>
                            </div>
                            
                            {/* Quick preview of key data */}
                            {/* <div className="mt-3 flex flex-wrap gap-2">
                              {log.payload?.data?.id && (
                                <span className="px-2 py-1 bg-gray-900/50 rounded text-[10px] text-gray-400">
                                  #{log.payload.data.id}
                                </span>
                              )}
                              {log.payload?.data?.status && (
                                <span className={`px-2 py-1 rounded text-[10px] ${getStatusColor(log.payload.data.status)}`}>
                                  {translateStatus(log.payload.data.status)}
                                </span>
                              )}
                              {log.payload?.data?.customer?.mobile && (
                                <span className="px-2 py-1 bg-gray-900/50 rounded text-[10px] text-gray-400 font-mono">
                                  📱 {log.payload.data.customer.mobile}
                                </span>
                              )}
                              {log.payload?.data?.items?.length > 0 && (
                                <span className="px-2 py-1 bg-gray-900/50 rounded text-[10px] text-gray-400">
                                  📦 {log.payload.data.items.length} منتج
                                </span>
                              )}
                            </div> */}
                          </div>
                        ))}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-800">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pagination.page <= 1}
                              onClick={() => loadDetailedData(activeConfig.id, pagination.page - 1)}
                              className="text-xs"
                            >
                              السابق
                            </Button>
                            <span className="text-xs text-gray-400">
                              صفحة {pagination.page} من {pagination.totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pagination.page >= pagination.totalPages}
                              onClick={() => loadDetailedData(activeConfig.id, pagination.page + 1)}
                              className="text-xs"
                            >
                              التالي
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Mini Settings & Config */}
              <div className="space-y-6">
                <Card className="gradient-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">إدارة الربط</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start gap-2 primary-button" variant="none" onClick={() => setSettingsOpen(true)}>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> إعدادات المنصة
                      </div>
                    </Button>
                    {activeConfig?.platform === 'custom' && (
                      <Button className="w-full justify-start gap-2 primary-button" variant="none" onClick={() => setCodeOpen(true)}>
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-purple-400" /> كود الربط
                        </div>
                      </Button>
                    )}
                    <Button className="w-full justify-start gap-2 primary-button after:bg-red-500" variant="none" onClick={() => handleDeleteConfig(activeConfig.id)}>
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> حذف التكامل
                      </div>  
                    </Button>
                    <div className="pt-4 border-t border-gray-800 mt-4">
                      <Label className="text-xs text-primary">حالة التشغيل</Label>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-sm text-gray-300 ${activeConfig.isActive ? 'text-green-500' : 'text-orange-500'}`}>{activeConfig.isActive ? 'نشط' : 'متوقف'}</span>
                        <Button 
                          size="sm" 
                          variant={activeConfig.isActive ? "destructive" : "default"} 
                          onClick={() => handleUpdateActive({ isActive: !activeConfig.isActive })}
                          className={`h-7 text-xs ${activeConfig.isActive ? 'bg-red-500' : 'bg-green-500'}`}
                        >
                          {activeConfig.isActive ? 'إيقاف' : 'تفعيل'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                
              </div>
            </div>
          </div>
        )}

        {/* Modal: Setup New Integration */}
        <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>إضافة منصة جديدة</DialogTitle>
              <DialogDescription className="text-primary">اختر المنصة التي تريد ربطها لاستقبال الأحداث منها.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 py-4">
              {PLATFORMS.map(p => (
                <button 
                  key={p.key}
                  onClick={() => setNewPlatformData({...newPlatformData, platform: p.key as any})}
                  className={`p-4 rounded-3xl flex flex-col items-center justify-center border-2 transition-all text-center space-y-2 ${newPlatformData.platform === p.key ? 'border-primary bg-primary/10' : 'border-gray-800 hover:border-gray-700'}`}
                >
                  <div className="text-3xl">{p.icon}</div>
                  <span className="text-xs font-semibold text-white">{p.label}</span>
                </button>
              ))}
            </div>
            {newPlatformData.platform === 'other' && (
              <div className="space-y-2 mb-4">
                <Label>اسم المنصة</Label>
                <Input 
                  placeholder="مثلاً: Shopify, MyFatoorah..." 
                  onChange={(e) => setNewPlatformData({...newPlatformData, platformName: e.target.value})}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSetupOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateNew} className="primary-button pr-8 pl-8">إنشاء التكامل</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reuse existing Settings Modal with configId support */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 mx-10">
                <Settings className="h-5 w-5 text-primary" />
                إعدادات تكامل {activeConfig && (PLATFORMS.find(p => p.key === activeConfig.platform)?.label || activeConfig.platformName)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
               {/* Webhook View (Fast setup) */}
               {activeConfig?.platform !== 'custom' && (
                <div className="p-5 bg-fixed-40 border border-primary/20 rounded-3xl space-y-4">
                  <div>
                    <Label className="text-primary font-bold">رابط التكامل </Label>
                    <div className="flex gap-2 mt-2">
                       <Input
                        value={`${process.env.NEXT_PUBLIC_API_URL}/api/events-plugin/webhook?apiKey=${activeConfig?.apiKey}`}
                        readOnly
                        className="font-mono text-xs bg-black/40 border-primary/30"
                      />
                      <Button size="sm" variant="ghost" className="bg-primary/20" onClick={() => handleCopy(`${process.env.NEXT_PUBLIC_API_URL}/api/events-plugin/webhook?apiKey=${activeConfig?.apiKey}`, "link")}>
                        {copiedField === "link" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
               )}

              {/* Event Toggles (Custom only) */}
              {activeConfig?.platform === 'custom' && (
                <div className="space-y-3">
                  <Label className="text-white font-medium">الأحداث المسموح باستقبالها</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_TYPES.map(event => (
                      <button
                        key={event.key}
                        onClick={() => toggleEvent(event.key)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                          activeConfig.enabledEvents[event.key] ? 'border-green-500 bg-green-500/10' : 'border-primary'
                        }`}
                      >
                        <event.icon className={`h-4 w-4 ${event.color}`} />
                        <span className="text-xs text-white">{event.label}</span>
                        {activeConfig.enabledEvents[event.key] && <CheckCircle className="h-4 w-4 text-green-500 mr-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ملاحظات خاصة</Label>
                  <Input 
                    placeholder="مثلاً: متجر الرياض الرئيسي" 
                    value={activeConfig?.notes || ''}
                    onChange={(e) => handleUpdateActive({ notes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم العرض</Label>
                  <Input 
                    value={activeConfig?.platformName || ''}
                    onChange={(e) => handleUpdateActive({ platformName: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Button onClick={() => setSettingsOpen(false)} className="primary-button w-full">حفظ التغييرات</Button>
          </DialogContent>
        </Dialog>

         {/* Modal: Advanced Dev Code Integration */}
         <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 mx-10">
                <Code className="h-5 w-5 text-purple-400" />
                بيانات الربط  للمطورين
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-primary uppercase tracking-wider">API Key</Label>
                    <div className="flex gap-2">
                      <Input value={activeConfig?.apiKey || ""} readOnly className="bg-gray-800/50 font-mono text-xs" />
                      <Button size="sm" variant="default" onClick={() => handleCopy(activeConfig?.apiKey || "", "api")}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-primary uppercase tracking-wider">Secret Key (للتوقيع)</Label>
                    <div className="flex gap-2">
                      <Input type={showSecretKey ? "text" : "password"} value={activeConfig?.secretKey || ""} readOnly className="bg-gray-800/50 font-mono text-xs" />
                      <Button size="sm" variant="default" onClick={() => setShowSecretKey(!showSecretKey)}>{showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                  </div>
               </div>
               
               {/* <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                 <p className="text-xs text-gray-300">
                    <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
                    في حالة التكامل المخصص، يجب إرسال `X-Signature` في الـ Headers لضمان أمان البيانات. راجع دليل المطورين للمزيد من التفاصيل.
                 </p>
               </div> */}

               {/* <div>
                 <Label className="font-bold text-white block mb-2">أمثلة برمجية</Label>
                 <div className="bg-gray-900 rounded-3xl p-5 font-mono text-xs text-gray-400 overflow-x-auto">
                    <pre>{`// Example: Webhook Signature Verification (Node.js)
const crypto = require('crypto');
const signature = crypto.createHmac('sha256', SECRET_KEY).update(JSON.stringify(payload)).digest('hex');
// Send as X-Signature header`}</pre>
                 </div>
               </div> */}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Event Details */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 mx-10">
                <div className={`p-2 rounded-lg ${
                  selectedLog?.status === 'processed' ? 'bg-green-500/20' :
                  selectedLog?.status === 'failed' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  <Activity className={`h-5 w-5 ${
                    selectedLog?.status === 'processed' ? 'text-green-400' :
                    selectedLog?.status === 'failed' ? 'text-red-400' : 'text-blue-400'
                  }`} />
                </div>
                <div className="">
                  <span className="text-white">{getEventTitle(selectedLog?.eventType || '')}</span>
                  <p className="text-xs text-primary font-normal mt-1">
                    {new Date(selectedLog?.createdAt || '').toLocaleString('ar-SA')}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4 py-4">
                <EventPayloadDisplay payload={selectedLog.payload} eventType={selectedLog.eventType} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}

// Helper function to get event title in Arabic
function getEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    'order.created': ' طلب جديد',
    'order.updated': ' تحديث طلب',
    'order.paid': ' تم الدفع',
    'order.shipped': ' تم الشحن',
    'order.delivered': ' تم التسليم',
    'order.cancelled': ' طلب ملغي',
    'order.refunded': ' استرجاع',
    'customer.created': ' عميل جديد',
    'customer.updated': ' تحديث عميل',
    'customer.login': ' تسجيل دخول',
    'product.created': ' منتج جديد',
    'product.updated': ' تحديث منتج',
    'product.available': ' منتج متاح',
    'product.quantity.low': ' كمية منخفضة',
    'abandoned_cart': ' سلة متروكة',
    'review.created': ' تقييم جديد',
  };
  return titles[eventType] || eventType;
}

// Component to display payload based on event type
function EventPayloadDisplay({ payload, eventType }: { payload: any; eventType: string }) {
  const data = payload?.data || payload || {};
  
  // Detect event category
  const isOrderEvent = eventType.includes('order');
  const isCustomerEvent = eventType.includes('customer');
  const isProductEvent = eventType.includes('product');
  const isCartEvent = eventType.includes('cart');

  return (
    <div className="space-y-4">
      {/* Order Events */}
      {isOrderEvent && (
        <>
          {/* Order Summary */}
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">رقم الطلب</p>
                <p className="text-xl font-bold text-white">#{data.id || data.reference_id || data.order_id || '---'}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">الإجمالي</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.total?.amount || data.amounts?.total?.amount || data.total || '0'} 
                  <span className="text-sm mr-1">{data.total?.currency || data.currency || 'ر.س'}</span>
                </p>
              </div>
            </div>
            
            {/* Order Status */}
            {(data.status || data.payment_status) && (
              <div className="flex gap-2 flex-wrap">
                {data.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                    {translateStatus(data.status)}
                  </span>
                )}
                {data.payment_status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.payment_status)}`}>
                    💳 {translateStatus(data.payment_status)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Customer Info */}
          {data.customer && (
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
              <h4 className="text-sm font-medium text-white mb-3"> بيانات العميل</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ">
                <InfoField label="الاسم" value={`${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() || data.customer.name} />
                <InfoField label="الهاتف" value={data.customer.mobile || data.customer.phone} isPhone />
                <InfoField label="البريد" value={data.customer.email} />
              </div>
            </div>
          )}

          {/* Order Items */}
          {data.items && data.items.length > 0 && (
            <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-2xl">
              <h4 className="text-sm font-medium text-gray-300 mb-3">📦 المنتجات ({data.items.length})</h4>
              <div className="space-y-2">
                {data.items.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-gray-900/50 rounded-xl">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name || item.product?.name}</p>
                      <p className="text-xs text-gray-400">الكمية: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-green-400">
                      {item.total?.amount || item.price?.amount || item.price} {data.currency || 'ر.س'}
                    </p>
                  </div>
                ))}
                {data.items.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">+{data.items.length - 5} منتجات أخرى</p>
                )}
              </div>
            </div>
          )}

          {/* Shipping Info */}
          {data.shipping && (
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
              <h4 className="text-sm font-medium text-purple-400 mb-3">🚚 الشحن</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="شركة الشحن" value={data.shipping.company?.name || data.shipment?.courier_name} />
                <InfoField label="رقم التتبع" value={data.shipping.tracking_number || data.shipment?.tracking_number} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Events */}
      {isCustomerEvent && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <h4 className="text-sm font-medium text-white mb-4"> بيانات العميل</h4>
          <div className="grid grid-cols-2 gap-4 ">
            <InfoField  label="الاسم" value={`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.name} />
            <InfoField label="البريد الإلكتروني" value={data.email} />
            <InfoField label="رقم الهاتف" value={data.mobile || data.phone} isPhone />
            <InfoField label="المدينة" value={data.city} />
            {data.gender && <InfoField label="الجنس" value={data.gender === 'male' ? 'ذكر' : 'أنثى'} />}
            {data.created_at && <InfoField label="تاريخ التسجيل" value={new Date(data.created_at).toLocaleDateString('ar-SA')} />}
          </div>
        </div>
      )}

      {/* Product Events */}
      {isProductEvent && (
        <div className="p-4 bg-fixed-40  rounded-2xl">
          <div className="flex gap-4">
            {(data.thumbnail || data.main_image || data.images?.[0]) && (
              <img 
                src={data.thumbnail || data.main_image || data.images?.[0]} 
                alt="" 
                className="w-24 h-24 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="text-lg font-medium text-white mb-2">{data.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                <InfoField label="السعر" value={`${data.price?.amount || data.price || '---'} ${data.price?.currency || 'ر.س'}`} />
                <InfoField label="الكمية" value={data.quantity} />
                <InfoField label="SKU" value={data.sku} />
                <InfoField label="الحالة" value={data.status === 'sale' ? 'متاح' : data.status} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Events */}
      {isCartEvent && data.items && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
          <h4 className="text-sm font-medium text-yellow-400 mb-3">🛒 محتويات السلة</h4>
          <div className="space-y-2">
            {data.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-xl">
                <span className="text-sm text-white">{item.name || item.product_name}</span>
                <span className="text-sm text-gray-400">x{item.quantity}</span>
              </div>
            ))}
          </div>
          {data.total && (
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-gray-400">الإجمالي</span>
              <span className="text-lg font-bold text-yellow-400">{data.total} ر.س</span>
            </div>
          )}
        </div>
      )}

      {/* Generic/Unknown Events - Show key fields */}
      {!isOrderEvent && !isCustomerEvent && !isProductEvent && !isCartEvent && (
        <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-2xl">
          <h4 className="text-sm font-medium text-gray-400 mb-3">📋 تفاصيل الحدث</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data).slice(0, 10).map(([key, value]) => {
              if (typeof value === 'object') return null;
              return <InfoField key={key} label={key} value={String(value)} />;
            })}
          </div>
        </div>
      )}

      {/* Raw Data Toggle */}
      <details className="group">
        <summary className="cursor-pointer primary-button text-xs text-gray-500 hover:text-gray-400 flex items-center gap-2">
         <div className="flex items-center gap-2">
           <Code className="h-3 w-3" />
          عرض كامل البيانات 
         </div>
        </summary>
        <div className="mt-2 bg-gray-900 rounded-xl p-3 max-h-[200px] overflow-auto">
          <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap text-left" dir="ltr">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

// Helper component for info fields
function InfoField({ label, value, isPhone }: { label: string; value?: string | number; isPhone?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-primary uppercase">{label}</p>
      <p className={`text-sm text-white ${isPhone ? 'font-mono direction-ltr' : ''}`}>{value}</p>
    </div>
  );
}

// Helper to get status color
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'completed': 'bg-green-500/20 text-green-400',
    'paid': 'bg-green-500/20 text-green-400',
    'delivered': 'bg-green-500/20 text-green-400',
    'pending': 'bg-yellow-500/20 text-yellow-400',
    'processing': 'bg-blue-500/20 text-blue-400',
    'shipped': 'bg-purple-500/20 text-purple-400',
    'cancelled': 'bg-red-500/20 text-red-400',
    'refunded': 'bg-orange-500/20 text-orange-400',
    'failed': 'bg-red-500/20 text-red-400',
  };
  return colors[status.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
}

// Helper to translate status
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'completed': 'مكتمل',
    'paid': 'مدفوع',
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي',
    'refunded': 'مسترجع',
    'failed': 'فشل',
    'created': 'جديد',
    'in_progress': 'قيد التنفيذ',
    'under_review': 'قيد المراجعة',
  };
  return translations[status.toLowerCase()] || status;
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getEventsPluginConfig,
  updateEventsPluginConfig,
  regenerateEventsPluginKeys,
  getEventsPluginLogs,
  getEventsPluginStats,
  testEventsPluginConnection,
  type EventsPluginConfig,
  type EventLog,
} from "@/lib/api";
import {
  Key,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Users,
  ShoppingCart,
  CreditCard,
  Calendar,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Code,
  Zap,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import AuthGuard from "@/components/AuthGuard";
import NoActiveSubscription from "@/components/NoActiveSubscription";

const EVENT_TYPES = [
  { key: "user.logged_in", label: "تسجيل دخول العميل", icon: Users, color: "text-blue-500" },
  { key: "order.created", label: "إنشاء طلب", icon: ShoppingCart, color: "text-green-500" },
  { key: "order.paid", label: "دفع طلب", icon: CreditCard, color: "text-emerald-500" },
  { key: "subscription.started", label: "بدء اشتراك", icon: Calendar, color: "text-purple-500" },
  { key: "subscription.renewed", label: "تجديد اشتراك", icon: RefreshCw, color: "text-indigo-500" },
  { key: "subscription.canceled", label: "إلغاء اشتراك", icon: XCircle, color: "text-red-500" },
];

const PLATFORMS = [
  { key: "woocommerce", label: "WooCommerce", icon: "🛒" },
  { key: "salla", label: "سلة", icon: "🛍️" },
  { key: "zid", label: "زد", icon: "📦" },
  { key: "shopify", label: "Shopify", icon: "🏪" },
  { key: "custom", label: "مخصص", icon: "⚙️" },
  { key: "other", label: "أخرى", icon: "📱" },
];

export default function EventsPluginPage() {
  const [config, setConfig] = useState<EventsPluginConfig | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<EventLog[]>([]);
  const [allEvents, setAllEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statsData, setStatsData] = useState<any>(null);
  const [statsPeriod, setStatsPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (token) loadConfig();
  }, [token]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await getEventsPluginConfig(token);
      setConfig(res.config);
      setStats(res.stats);
      setRecentEvents(res.recentEvents);
      setError(null);
    } catch (e: any) {
      if (e.message?.includes("403") || e.message?.includes("غير متاحة")) {
        setError("feature_not_available");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      const res = await getEventsPluginLogs(token, { page, limit: 20 });
      setAllEvents(res.events);
      setPagination(res.pagination);
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getEventsPluginStats(token, statsPeriod);
      setStatsData(res);
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showSuccess("تم النسخ", "تم نسخ النص للحافظة");
  };

  const handleRegenerateKeys = async () => {
    if (!confirm("هل أنت متأكد؟ سيتم إلغاء المفاتيح القديمة ولن تعمل بعد الآن.")) return;
    try {
      const res = await regenerateEventsPluginKeys(token);
      setConfig((prev) => prev ? { ...prev, apiKey: res.apiKey, secretKey: res.secretKey } : null);
      showSuccess("تم التجديد", "تم توليد مفاتيح جديدة بنجاح");
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleUpdateConfig = async (updates: Partial<EventsPluginConfig>) => {
    try {
      const res = await updateEventsPluginConfig(token, updates);
      setConfig(res.config);
      showSuccess("تم الحفظ", "تم تحديث الإعدادات بنجاح");
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const handleTestConnection = async () => {
    try {
      const res = await testEventsPluginConnection(token);
      if (res.success) {
        showSuccess("نجاح", res.message);
      }
    } catch (e: any) {
      showError("خطأ", e.message);
    }
  };

  const toggleEvent = (eventKey: string) => {
    if (!config) return;
    const newEnabledEvents = {
      ...config.enabledEvents,
      [eventKey]: !config.enabledEvents[eventKey],
    };
    handleUpdateConfig({ enabledEvents: newEnabledEvents });
  };


  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <h1 className="text-2xl font-semibold text-white">تكامل الأحداث (Events Plugin)</h1>
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error === "feature_not_available") {
    return (
      <AuthGuard>
        <NoActiveSubscription
          title="تكامل الأحداث (Events Plugin)"
          description="الرجاء الإشتراك بالباقة لاستخدام هذه الخدمة."
        ></NoActiveSubscription>
       
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <h1 className="text-2xl font-semibold text-white">تكامل الأحداث (Events Plugin)</h1>
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
              <Button onClick={loadConfig} className="mt-4">إعادة المحاولة</Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">تكامل الأحداث (Events Plugin)</h1>
            <p className="text-gray-400 text-sm mt-1">
              استقبل الأحداث من المنصات الخارجية (متاجر، اشتراكات) بشكل آمن
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setCodeOpen(true); }}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              <Code className="h-4 w-4 mr-2" />
              كود التكامل
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSettingsOpen(true); }}
              className="primary-button"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 mr-2" />
              الإعدادات
              </div>
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className={`${config?.isActive ? 'gradient-border' : 'gradient-border '}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${config?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-white font-medium">
                  {config?.isActive ? 'التكامل نشط' : 'التكامل متوقف'}
                </span>
              </div>
              <Button
                className="primary-button after:bg-red-500"
                size="sm"
                variant={config?.isActive ? "destructive" : "default"}
                onClick={() => handleUpdateConfig({ isActive: !config?.isActive })}
              >
                {config?.isActive ? 'إيقاف' : 'تفعيل'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center text-white gap-2 text-lg">
              <Key className="h-5 w-5 text-yellow-500" />
              مفاتيح API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div>
              <Label className="text-primary text-sm">API Key (للمصادقة)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={config?.apiKey || ""}
                  readOnly
                  className="font-mono text-sm bg-gray-800/50"
                />
                <Button
                  size="icon"
                  variant=""
                  onClick={() => handleCopy(config?.apiKey || "", "apiKey")}
                >
                  {copiedField === "apiKey" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-white" />}
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <Label className="text-primary text-sm">Secret Key (للتوقيع - احفظه بأمان)</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    type={showSecretKey ? "text" : "password"}
                    value={config?.secretKey || ""}
                    readOnly
                    className="font-mono text-sm bg-gray-800/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  size="icon"
                  variant=""
                  onClick={() => handleCopy(config?.secretKey || "", "secretKey")}
                >
                  {copiedField === "secretKey" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-white" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleRegenerateKeys}
                className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                توليد مفاتيح جديدة
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              >
                <Zap className="h-4 w-4 mr-2" />
                اختبار الاتصال
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {EVENT_TYPES.map((event) => {
            const Icon = event.icon;
            const count = stats[event.key] || 0;
            const isEnabled = config?.enabledEvents[event.key];
            return (
              <Card
                key={event.key}
                className={`gradient-border cursor-pointer transition-all ${isEnabled ? 'hover:border-green-500/50' : 'opacity-50'}`}
                onClick={() => toggleEvent(event.key)}
              >
                <CardContent className="py-4 text-center">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${event.color}`} />
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-gray-200 mt-1">{event.label}</p>
                  <div className={`mt-2 text-xs ${isEnabled ? 'text-green-500' : 'text-gray-500'}`}>
                    {isEnabled ? '✓ مفعل' : '✗ معطل'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Events */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Activity className="h-5 w-5 text-blue-500" />
              آخر الأحداث
            </CardTitle>
            <Button
            className="primary-button"
              variant="outline"
              size="sm"
              onClick={() => { loadLogs(); setLogsOpen(true); }}
            >
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لم يتم استقبال أي أحداث بعد</p>
                <p className="text-sm mt-1">ابدأ بربط منصتك باستخدام مفاتيح API</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => {
                  const eventInfo = EVENT_TYPES.find((e) => e.key === event.eventType);
                  const Icon = eventInfo?.icon || Activity;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${eventInfo?.color || 'text-gray-400'}`} />
                        <div>
                          <p className="text-white text-sm font-medium">{eventInfo?.label || event.eventType}</p>
                          <p className="text-gray-400 text-xs">
                            {event.customerName || event.customerEmail || 'عميل غير معروف'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={`text-xs px-2 py-1 rounded ${
                          event.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {event.status === 'processed' ? 'تمت المعالجة' :
                           event.status === 'failed' ? 'فشل' : 'مستلم'}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(event.createdAt).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Modal */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات التكامل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Platform Selection */}
              <div>
                <Label>المنصة المتصلة</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      onClick={() => handleUpdateConfig({ platform: platform.key as any })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        config?.platform === platform.key
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <p className="text-sm mt-1 text-white">{platform.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Name */}
              {config?.platform === 'custom' || config?.platform === 'other' ? (
                <div>
                  <Label>اسم المنصة</Label>
                  <Input
                    value={config?.platformName || ''}
                    onChange={(e) => handleUpdateConfig({ platformName: e.target.value })}
                    placeholder="أدخل اسم المنصة"
                    className="mt-1"
                  />
                </div>
              ) : null}

              {/* Webhook URL */}
              <div>
                <Label>Webhook URL (للاختبار)</Label>
                <Input
                  value={config?.webhookUrl || ''}
                  onChange={(e) => handleUpdateConfig({ webhookUrl: e.target.value })}
                  placeholder="https://your-webhook-url.com/endpoint"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">اختياري - لإعادة توجيه الأحداث لنظام آخر</p>
              </div>

              {/* Notes */}
              <div>
                <Label>ملاحظات</Label>
                <textarea
                  value={config?.notes || ''}
                  onChange={(e) => handleUpdateConfig({ notes: e.target.value })}
                  placeholder="ملاحظات خاصة بالتكامل..."
                  className="w-full mt-1 p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Enabled Events */}
              <div>
                <Label>الأحداث المفعلة</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EVENT_TYPES.map((event) => {
                    const Icon = event.icon;
                    const isEnabled = config?.enabledEvents[event.key];
                    return (
                      <button
                        key={event.key}
                        onClick={() => toggleEvent(event.key)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          isEnabled
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${event.color}`} />
                        <span className="text-sm text-white">{event.label}</span>
                        {isEnabled && <CheckCircle className="h-4 w-4 text-green-500 mr-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Logs Modal */}
        <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                سجل الأحداث
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {allEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>لا توجد أحداث</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {allEvents.map((event) => {
                      const eventInfo = EVENT_TYPES.find((e) => e.key === event.eventType);
                      const Icon = eventInfo?.icon || Activity;
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${eventInfo?.color || 'text-gray-400'}`} />
                            <div>
                              <p className="text-white text-sm font-medium">{eventInfo?.label || event.eventType}</p>
                              <p className="text-gray-400 text-xs">
                                {event.customerName || event.customerEmail || 'عميل غير معروف'}
                                {event.orderAmount && ` - ${event.orderAmount} ر.س`}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className={`text-xs px-2 py-1 rounded ${
                              event.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                              event.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {event.status === 'processed' ? 'تمت المعالجة' :
                               event.status === 'failed' ? 'فشل' : 'مستلم'}
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(event.createdAt).toLocaleString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                      إجمالي: {pagination.total} حدث
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page <= 1}
                        onClick={() => loadLogs(pagination.page - 1)}
                      >
                        السابق
                      </Button>
                      <span className="text-sm text-gray-400 py-2">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => loadLogs(pagination.page + 1)}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Event Details Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الحدث</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">نوع الحدث</Label>
                    <p className="text-white">{EVENT_TYPES.find(e => e.key === selectedEvent.eventType)?.label || selectedEvent.eventType}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">الحالة</Label>
                    <p className={`${
                      selectedEvent.status === 'processed' ? 'text-green-400' :
                      selectedEvent.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {selectedEvent.status === 'processed' ? 'تمت المعالجة' :
                       selectedEvent.status === 'failed' ? 'فشل' : 'مستلم'}
                    </p>
                  </div>
                  {selectedEvent.customerName && (
                    <div>
                      <Label className="text-gray-400">اسم العميل</Label>
                      <p className="text-white">{selectedEvent.customerName}</p>
                    </div>
                  )}
                  {selectedEvent.customerEmail && (
                    <div>
                      <Label className="text-gray-400">البريد الإلكتروني</Label>
                      <p className="text-white">{selectedEvent.customerEmail}</p>
                    </div>
                  )}
                  {selectedEvent.customerPhone && (
                    <div>
                      <Label className="text-gray-400">الهاتف</Label>
                      <p className="text-white">{selectedEvent.customerPhone}</p>
                    </div>
                  )}
                  {selectedEvent.orderId && (
                    <div>
                      <Label className="text-gray-400">رقم الطلب</Label>
                      <p className="text-white">{selectedEvent.orderId}</p>
                    </div>
                  )}
                  {selectedEvent.orderAmount && (
                    <div>
                      <Label className="text-gray-400">المبلغ</Label>
                      <p className="text-white">{selectedEvent.orderAmount} ر.س</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-400">تاريخ الاستلام</Label>
                    <p className="text-white">{new Date(selectedEvent.createdAt).toLocaleString('ar-SA')}</p>
                  </div>
                </div>
                {selectedEvent.errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Label className="text-red-400">رسالة الخطأ</Label>
                    <p className="text-red-300 text-sm mt-1">{selectedEvent.errorMessage}</p>
                  </div>
                )}
                {selectedEvent.payload && (
                  <div>
                    <Label className="text-gray-400">البيانات الكاملة (JSON)</Label>
                    <pre className="mt-2 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 overflow-auto max-h-60">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Code Integration Modal */}
        <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                كود التكامل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Webhook Endpoint */}
              <div>
                <Label className="text-lg font-semibold">Webhook Endpoint</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={`${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : ''}/api/events-plugin/webhook`}
                    readOnly
                    className="font-mono text-sm bg-gray-800/50"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(`${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : ''}/api/events-plugin/webhook`, "endpoint")}
                  >
                    {copiedField === "endpoint" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Node.js Example */}
              <div>
                <Label className="text-lg font-semibold">مثال Node.js</Label>
                <div className="relative mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 left-2 z-10"
                    onClick={() => handleCopy(getNodeJsCode(), "nodejs")}
                  >
                    {copiedField === "nodejs" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="p-4 bg-gray-900 rounded-lg text-sm text-gray-300 overflow-auto max-h-80 font-mono">
{getNodeJsCode()}
                  </pre>
                </div>
              </div>

              {/* cURL Example */}
              <div>
                <Label className="text-lg font-semibold">مثال cURL</Label>
                <div className="relative mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 left-2 z-10"
                    onClick={() => handleCopy(getCurlCode(), "curl")}
                  >
                    {copiedField === "curl" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="p-4 bg-gray-900 rounded-lg text-sm text-gray-300 overflow-auto max-h-60 font-mono">
{getCurlCode()}
                  </pre>
                </div>
              </div>

              {/* PHP Example */}
              <div>
                <Label className="text-lg font-semibold">مثال PHP</Label>
                <div className="relative mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 left-2 z-10"
                    onClick={() => handleCopy(getPhpCode(), "php")}
                  >
                    {copiedField === "php" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="p-4 bg-gray-900 rounded-lg text-sm text-gray-300 overflow-auto max-h-80 font-mono">
{getPhpCode()}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );

  function getNodeJsCode() {
    return `const crypto = require('crypto');
const https = require('https');

const API_KEY = '${config?.apiKey || 'YOUR_API_KEY'}';
const SECRET_KEY = '${config?.secretKey || 'YOUR_SECRET_KEY'}';
const ENDPOINT = '${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : ''}/api/events-plugin/webhook';

async function sendEvent(eventType, payload) {
  const eventData = {
    event: eventType,
    payload: payload,
    sentAt: new Date().toISOString()
  };

  const body = JSON.stringify(eventData);
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(body)
    .digest('hex');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Signature': signature,
      'X-Timestamp': Date.now().toString()
    },
    body: body
  });

  return response.json();
}

// مثال: إرسال حدث إنشاء طلب
sendEvent('order.created', {
  customer: {
    id: 'cust_123',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '+966501234567'
  },
  order: {
    id: 'order_456',
    amount: 299.99,
    currency: 'SAR',
    status: 'pending'
  }
});`;
  }

  function getCurlCode() {
    const endpoint = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : '';
    return `# توليد التوقيع
BODY='{"event":"order.created","payload":{"customer":{"id":"123","name":"أحمد"},"order":{"id":"456","amount":100}},"sentAt":"2024-12-17T10:00:00Z"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "${config?.secretKey || 'YOUR_SECRET_KEY'}" | cut -d' ' -f2)

# إرسال الطلب
curl -X POST "${endpoint}/api/events-plugin/webhook" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${config?.apiKey || 'YOUR_API_KEY'}" \\
  -H "X-Signature: $SIGNATURE" \\
  -H "X-Timestamp: $(date +%s)000" \\
  -d "$BODY"`;
  }

  function getPhpCode() {
    const endpoint = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : '';
    return `<?php
$apiKey = '${config?.apiKey || 'YOUR_API_KEY'}';
$secretKey = '${config?.secretKey || 'YOUR_SECRET_KEY'}';
$endpoint = '${endpoint}/api/events-plugin/webhook';

function sendEvent($eventType, $payload) {
    global $apiKey, $secretKey, $endpoint;
    
    $eventData = [
        'event' => $eventType,
        'payload' => $payload,
        'sentAt' => date('c')
    ];
    
    $body = json_encode($eventData);
    $signature = hash_hmac('sha256', $body, $secretKey);
    
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey,
            'X-Signature: ' . $signature,
            'X-Timestamp: ' . (time() * 1000)
        ]
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// مثال الاستخدام
sendEvent('order.paid', [
    'customer' => ['id' => '123', 'name' => 'أحمد'],
    'order' => ['id' => '456', 'amount' => 299.99],
    'payment' => ['id' => 'pay_789', 'method' => 'credit_card']
]);
?>`;
  }
}

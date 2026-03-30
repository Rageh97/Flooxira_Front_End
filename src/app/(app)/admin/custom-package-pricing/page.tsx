"use client";
import { useEffect, useState, useCallback } from "react";
import { getCustomPackagePricing, updateCustomPackagePricing, type CustomPackagePricing } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import { 
  Save, Loader2, MessageSquare, Send, Bot, Users, 
  Briefcase, UserCheck, Brain, Headphones, ShoppingBag, 
  Webhook, Globe, Settings2 
} from "lucide-react";

type FeatureConfig = {
  key: string;
  label: string;
  icon: React.ReactNode;
  priceField: keyof CustomPackagePricing;
  hasAiMessages?: boolean;
  aiPriceField?: keyof CustomPackagePricing;
  aiBundleField?: keyof CustomPackagePricing;
  aiLabel?: string;
  extraField?: keyof CustomPackagePricing;
  extraLabel?: string;
};

const FEATURES: FeatureConfig[] = [
  {
    key: "socialMediaPosting",
    label: "النشر على السوشيال ميديا",
    icon: <Globe className="h-5 w-5" />,
    priceField: "socialMediaPostingPrice",
    extraField: "socialMediaPostingPosts",
    extraLabel: "عدد المنشورات الشهرية"
  },
  {
    key: "whatsapp",
    label: "إدارة الواتساب",
    icon: <MessageSquare className="h-5 w-5" />,
    priceField: "whatsappPrice",
    hasAiMessages: true,
    aiPriceField: "whatsappAiMessagesPrice",
    aiBundleField: "whatsappAiMessagesPerBundle",
    aiLabel: "رسائل AI الواتساب"
  },
  {
    key: "telegram",
    label: "إدارة التليجرام",
    icon: <Send className="h-5 w-5" />,
    priceField: "telegramPrice",
    hasAiMessages: true,
    aiPriceField: "telegramAiMessagesPrice",
    aiBundleField: "telegramAiMessagesPerBundle",
    aiLabel: "رسائل AI التليجرام"
  },
  {
    key: "contentManagement",
    label: "إدارة المحتوى",
    icon: <Briefcase className="h-5 w-5" />,
    priceField: "contentManagementPrice"
  },
  {
    key: "customerManagement",
    label: "إدارة العملاء",
    icon: <Users className="h-5 w-5" />,
    priceField: "customerManagementPrice"
  },
  {
    key: "serviceMarketing",
    label: "تسويق الخدمات",
    icon: <ShoppingBag className="h-5 w-5" />,
    priceField: "serviceMarketingPrice",
    hasAiMessages: true,
    aiPriceField: "serviceMarketingPricePerUnit",
    aiBundleField: "id",
    aiLabel: "سعر الخدمة الإضافية"
  },
  {
    key: "employeeManagement",
    label: "إدارة الموظفين",
    icon: <UserCheck className="h-5 w-5" />,
    priceField: "employeeManagementPrice",
    hasAiMessages: true,
    aiPriceField: "employeePricePerUnit",
    aiBundleField: "id", // Not really a bundle, just a hack for units
    aiLabel: "سعر الموظف الإضافي"
  },
  {
    key: "aiTools",
    label: "أدوات الذكاء الاصطناعي",
    icon: <Brain className="h-5 w-5" />,
    priceField: "aiToolsPrice",
    hasAiMessages: true,
    aiPriceField: "aiToolsCreditsPrice",
    aiBundleField: "aiToolsCreditsPerBundle",
    aiLabel: "كريديت AI"
  },
  {
    key: "liveChat",
    label: "التذاكر & لايف شات",
    icon: <Headphones className="h-5 w-5" />,
    priceField: "liveChatPrice",
    hasAiMessages: true,
    aiPriceField: "liveChatAiResponsesPrice",
    aiBundleField: "liveChatAiResponsesPerBundle",
    aiLabel: "ردود AI"
  },
  {
    key: "eventsPlugin",
    label: "Webhook + API",
    icon: <Webhook className="h-5 w-5" />,
    priceField: "eventsPluginPrice"
  }
];

export default function AdminCustomPackagePricingPage() {
  const [pricing, setPricing] = useState<CustomPackagePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  const fetchPricing = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getCustomPackagePricing(token);
      setPricing(res.pricing);
    } catch (e: any) {
      showError("خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleChange = (field: keyof CustomPackagePricing, value: string) => {
    if (!pricing) return;
    const numValue = parseFloat(value) || 0;
    setPricing({ ...pricing, [field]: numValue });
  };

  const handleSave = async () => {
    if (!pricing || !token) return;
    try {
      setSaving(true);
      const res = await updateCustomPackagePricing(token, pricing);
      setPricing(res.pricing);
      showSuccess("تم الحفظ", "تم تحديث أسعار الباقة المخصصة بنجاح");
    } catch (e: any) {
      showError("خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="text-center text-red-400 py-8">
        لا يمكن تحميل بيانات التسعير
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-white">تسعير الباقة المخصصة</h2>
            <p className="text-sm text-gray-400">حدد أسعار كل ميزة وأسعار الرسائل والكريديت</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-white/10">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={pricing.isActive}
            onChange={(e) => setPricing({ ...pricing, isActive: e.target.checked })}
            className="w-4 h-4 rounded accent-primary"
          />
          تفعيل نظام الباقة المخصصة
        </label>
      </div>

      {/* Feature Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.key}
            className="p-4 rounded-2xl bg-card border border-white/10 hover:border-primary/30 transition-all space-y-4"
          >
            {/* Feature Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{feature.label}</h3>
            </div>

            {/* Base Price */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">سعر الميزة الأساسي (ريال)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(pricing[feature.priceField] as any) || ""}
                onChange={(e) => handleChange(feature.priceField, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-secondry border border-white/10 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Extra field (like posts count) */}
            {feature.extraField && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">{feature.extraLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={(pricing[feature.extraField] as any) || ""}
                  onChange={(e) => handleChange(feature.extraField!, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondry border border-white/10 text-white text-sm focus:border-primary focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            )}

            {/* AI Messages Section */}
            {feature.hasAiMessages && feature.aiPriceField && feature.aiBundleField && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">
                    {feature.key === 'employeeManagement' ? 'تسعير الموظف' : feature.aiLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">
                      {feature.key === 'employeeManagement' ? 'الوحدة' : 'عدد لكل باقة'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={(pricing[feature.aiBundleField] as any) || ""}
                      onChange={(e) => handleChange(feature.aiBundleField!, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-bg-secondry border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-colors"
                      placeholder={feature.key === 'employeeManagement' ? '1' : '5000'}
                      disabled={feature.key === 'employeeManagement'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">
                      {feature.key === 'employeeManagement' ? 'سعر الموظف' : 'سعر الباقة'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(pricing[feature.aiPriceField] as any) || ""}
                      onChange={(e) => handleChange(feature.aiPriceField!, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-bg-secondry border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-colors"
                      placeholder="10.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
        </button>
      </div>
    </div>
  );
}

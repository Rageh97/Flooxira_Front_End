"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCustomPackagePricing,
  type CustomPackagePricing,
} from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import FeatureCard from "./components/FeatureCard";
import CustomPackageSummary from "./components/CustomPackageSummary";
import { Loader2, Sparkles, Package } from "lucide-react";

export type FeatureSelection = {
  featureKey: string;
  selected: boolean;
  aiMessageBundles: number;
};

export type FeatureDefinition = {
  key: string;
  label: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  priceField: keyof CustomPackagePricing;
  hasAiMessages: boolean;
  aiPriceField?: keyof CustomPackagePricing;
  aiBundleField?: keyof CustomPackagePricing;
  aiLabel?: string;
  aiUnit?: string;
  extraField?: keyof CustomPackagePricing;
  extraLabel?: string;
  maxUnits?: number;
};

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "socialMediaPosting",
    label: "النشر على السوشيال ميديا",
    description: "نشر المحتوى تلقائياً على جميع المنصات الاجتماعية",
    icon: "/انشاء منشور.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "socialMediaPostingPrice",
    hasAiMessages: false,
    extraField: "socialMediaPostingPosts",
    extraLabel: "منشور شهرياً"
  },
  {
    key: "whatsapp",
    label: "إدارة الواتساب",
    description: "بوت ذكي للرد على رسائل الواتساب بالذكاء الاصطناعي",
    icon: "/واتساب.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "whatsappPrice",
    hasAiMessages: true,
    aiPriceField: "whatsappAiMessagesPrice",
    aiBundleField: "whatsappAiMessagesPerBundle",
    aiLabel: "رسائل AI",
    aiUnit: "رسالة"
  },
  {
    key: "telegram",
    label: "إدارة التليجرام",
    description: "إدارة قنوات ومجموعات التليجرام بالذكاء الاصطناعي",
    icon: "/تليغرام.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "telegramPrice",
    hasAiMessages: true,
    aiPriceField: "telegramAiMessagesPrice",
    aiBundleField: "telegramAiMessagesPerBundle",
    aiLabel: "رسائل AI",
    aiUnit: "رسالة"
  },
  {
    key: "contentManagement",
    label: "إدارة المحتوى",
    description: "تنظيم وجدولة المحتوى وإدارته بكفاءة",
    icon: "/ادارة المحتوى.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "contentManagementPrice",
    hasAiMessages: false
  },
  {
    key: "customerManagement",
    label: "إدارة العملاء والمحاسبة",
    description: "قاعدة بيانات متكاملة لإدارة وتتبع العملاء والمحاسبة",
    icon: "/العملاء ولمحاسبة.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "customerManagementPrice",
    hasAiMessages: false
  },
  {
    key: "serviceMarketing",
    label: "تسويق الخدمات",
    description: "عرض وتسويق خدماتك باحترافية عالية",
    icon: "/الباقات.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "serviceMarketingPrice",
    hasAiMessages: true,
    aiPriceField: "serviceMarketingPricePerUnit",
    aiBundleField: "id",
    aiLabel: "عدد الخدمات",
    aiUnit: "خدمة",
    maxUnits: 5
  },
  {
    key: "employeeManagement",
    label: "إدارة الموظفين",
    description: "إدارة فريق العمل والحضور والانصراف والرواتب",
    icon: "/الموظفين.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "employeeManagementPrice",
    hasAiMessages: true,
    aiPriceField: "employeePricePerUnit",
    aiBundleField: "id", // Dummy since it's per 1 unit
    aiLabel: "عدد الموظفين",
    aiUnit: "موظف"
  },
  {
    key: "aiTools",
    label: "أدوات الذكاء الاصطناعي",
    description: "توليد الصور والفيديوهات والنصوص بالذكاء الاصطناعي",
    icon: "/اداوات ai.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "aiToolsPrice",
    hasAiMessages: true,
    aiPriceField: "aiToolsCreditsPrice",
    aiBundleField: "aiToolsCreditsPerBundle",
    aiLabel: "كريديت AI",
    aiUnit: "كريديت"
  },
  {
    key: "liveChat",
    label: "التذاكر & لايف شات",
    description: "نظام تذاكر الدعم الفني ومحادثة فورية مع العملاء",
    icon: "/لايف شات.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "liveChatPrice",
    hasAiMessages: true,
    aiPriceField: "liveChatAiResponsesPrice",
    aiBundleField: "liveChatAiResponsesPerBundle",
    aiLabel: "ردود AI",
    aiUnit: "رد"
  },
  {
    key: "eventsPlugin",
    label: "Webhook + API",
    description: "تكامل مع الأنظمة الخارجية عبر Webhook و API (يشمل تكامل مع سلة)",
    icon: "/الربط api.webp",
    gradientFrom: "from-green-500/10",
    gradientTo: "to-emerald-500/10",
    priceField: "eventsPluginPrice",
    hasAiMessages: false
  }
];

export default function CustomPackagePage() {
  const [pricing, setPricing] = useState<CustomPackagePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const { showError } = useToast();
  const [selections, setSelections] = useState<FeatureSelection[]>(
    FEATURE_DEFINITIONS.map((f) => ({
      featureKey: f.key,
      selected: false,
      aiMessageBundles: 0
    }))
  );

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

  const toggleFeature = useCallback((featureKey: string) => {
    setSelections((prev) =>
      prev.map((s) =>
        s.featureKey === featureKey
          ? { ...s, selected: !s.selected, aiMessageBundles: !s.selected ? s.aiMessageBundles : 0 }
          : s
      )
    );
  }, []);

  const updateBundles = useCallback((featureKey: string, bundles: number) => {
    setSelections((prev) =>
      prev.map((s) =>
        s.featureKey === featureKey ? { ...s, aiMessageBundles: Math.max(0, bundles) } : s
      )
    );
  }, []);

  // Calculate prices locally for instant feedback
  const { totalPrice, breakdownItems } = useMemo(() => {
    if (!pricing) return { totalPrice: 0, breakdownItems: [] };

    let total = 0;
    const items: Array<{
      featureKey: string;
      label: string;
      basePrice: number;
      aiPrice: number;
      totalPrice: number;
      aiCount: number;
      aiUnit: string;
    }> = [];

    for (const sel of selections) {
      if (!sel.selected) continue;

      const def = FEATURE_DEFINITIONS.find((f) => f.key === sel.featureKey);
      if (!def) continue;

      const basePrice = Number(pricing[def.priceField]) || 0;
      let aiPrice = 0;
      let aiCount = 0;
      let aiUnit = def.aiUnit || "";

      if (def.hasAiMessages && def.aiPriceField && def.aiBundleField && sel.aiMessageBundles > 0) {
        const pricePerBundle = Number(pricing[def.aiPriceField]) || 0;
        const perBundle = Number(pricing[def.aiBundleField]) || 1;
        aiPrice = pricePerBundle * sel.aiMessageBundles;
        aiCount = perBundle * sel.aiMessageBundles;
      }

      const featureTotal = basePrice + aiPrice;
      total += featureTotal;

      items.push({
        featureKey: sel.featureKey,
        label: def.label,
        basePrice,
        aiPrice,
        totalPrice: featureTotal,
        aiCount,
        aiUnit
      });
    }

    return { totalPrice: Math.round(total * 100) / 100, breakdownItems: items };
  }, [selections, pricing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-400 text-sm">جاري تحميل خيارات الباقة المخصصة...</p>
        </div>
      </div>
    );
  }

  if (!pricing || !pricing.isActive) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-gray-500 mx-auto" />
          <p className="text-gray-400">نظام الباقة المخصصة غير متاح حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col space-y-8">
      {/* Header and Grid Section */}
      <div className="flex-1 space-y-8 pb-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">صمم باقتك المخصصة</h1>
          </div>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            اختر الميزات التي تحتاجها فقط وحدد الكميات المناسبة لعملك. ادفع فقط مقابل ما تستخدمه.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURE_DEFINITIONS.map((feature) => {
            const sel = selections.find((s) => s.featureKey === feature.key)!;
            return (
              <FeatureCard
                key={feature.key}
                feature={feature}
                pricing={pricing}
                selected={sel.selected}
                aiMessageBundles={sel.aiMessageBundles}
                onToggle={() => toggleFeature(feature.key)}
                onBundlesChange={(bundles) => updateBundles(feature.key, bundles)}
              />
            );
          })}
        </div>
      </div>

      {/* Summary Bar */}
      <CustomPackageSummary
        totalPrice={totalPrice}
        breakdownItems={breakdownItems}
        selectedCount={selections.filter((s) => s.selected).length}
      />
    </div>
  );
}

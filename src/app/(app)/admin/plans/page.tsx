"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  type Plan 
} from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Crown, 
  Settings,
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const EASTERN_DIGIT_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const normalizeLocalizedDigits = (value: string) =>
  value
    .split("")
    .map((char) => EASTERN_DIGIT_MAP[char] ?? char)
    .join("");

const parseLocalizedNumber = (value: string) => {
  if (!value) return 0;
  const normalized = normalizeLocalizedDigits(value);
  const parsed = parseInt(normalized, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const AI_TOOLS_LIST = [
  { id: 'chat', label: 'الدردشة (AI Chat)', category: 'الدردشة' },
  { id: 'image_gen', label: 'توليد الصور (Text to Image)', category: 'الصور' },
  { id: 'image_upscale', label: 'تحسين جودة الصور', category: 'الصور' },
  { id: 'image_nano', label: 'Nano Banana Pro (توليد سريع)', category: 'الصور' },
  { id: 'image_logo', label: 'صانع الشعارات', category: 'الصور' },
  { id: 'image_edit', label: 'تحرير الصور', category: 'الصور' },
  { id: 'image_product', label: 'نماذج المنتجات (Product Mockups)', category: 'الصور' },
  { id: 'image_bg_remove', label: 'إزالة خلفية الصور', category: 'الصور' },
  { id: 'image_avatar', label: 'إنشاء الأفاتار', category: 'الصور' },
  { id: 'image_restore', label: 'ترميم الصور القديمة', category: 'الصور' },
  { id: 'image_sketch', label: 'تحويل الرسم لصورة', category: 'الصور' },
  { id: 'image_colorize', label: 'تلوين الصور', category: 'الصور' },
  { id: 'image_describe', label: 'تحويل الصورة لنص وصف', category: 'الصور' },
  { id: 'video_gen', label: 'توليد الفيديو', category: 'الفيديو' },
  { id: 'video_long', label: 'فيديو طويل (Multi-Scene)', category: 'الفيديو' },
  { id: 'video_motion', label: 'إضافة حركة للفيديو', category: 'الفيديو' },
  { id: 'video_ugc', label: 'فيديوهات UGC', category: 'الفيديو' },
  { id: 'video_effects', label: 'تأثيرات الفيديو', category: 'الفيديو' },
  { id: 'video_lipsync', label: 'حركة الشفاه (LipSync)', category: 'الفيديو' },
  { id: 'video_resize', label: 'تغيير أبعاد الفيديو', category: 'الفيديو' },
  { id: 'video_upscale', label: 'تحسين جودة الفيديو', category: 'الفيديو' },
];

const AI_MODEL_CATEGORIES = {
  image: 'نماذج توليد الصور',
  video: 'نماذج الفيديو',
  motion: 'نماذج التحريك',
  chat: 'نماذج الدردشة'
};

const MODEL_PRICING_OPTIONS: Record<string, { label: string, defaultCost: number, type: string }> = {
  // Image Models
  'imagen-3.0-generate-001': { label: 'Imagen 3.0', defaultCost: 1, type: 'image' },
  'imagen-3.0-fast-generate-001': { label: 'Imagen 3.0 Fast', defaultCost: 1, type: 'image' },
  'imagen-4.0-fast-generate-001': { label: 'Imagen 4.0 Fast', defaultCost: 2, type: 'image' },
  'imagen-4.0-generate-001': { label: 'Imagen 4.0 Pro', defaultCost: 4, type: 'image' },
  'imagen-4.0-ultra-generate-001': { label: 'Imagen 4.0 Ultra', defaultCost: 8, type: 'image' },
  
  // Video Models
  'veo-3.1-generate-preview': { label: 'Veo 3.1 Pro', defaultCost: 80, type: 'video' },
  'veo-3.1-fast-generate-preview': { label: 'Veo 3.1 Fast', defaultCost: 60, type: 'video' },
  'veo-3.0-generate-001': { label: 'Veo 3.0 Pro', defaultCost: 50, type: 'video' },
  'veo-3.0-fast-generate-001': { label: 'Veo 3.0 Fast', defaultCost: 40, type: 'video' },
  'veo-2.0-generate-001': { label: 'Veo 2.0 Legacy', defaultCost: 30, type: 'video' },
  
  // Motion Models
  'veo-3.1-motion': { label: 'Veo 3.1 Pro Motion', defaultCost: 60, type: 'motion' },
  'veo-3.1-fast-motion': { label: 'Veo 3.1 Fast Motion', defaultCost: 45, type: 'motion' },
  'veo-3.0-motion': { label: 'Veo 3.0 Pro Motion', defaultCost: 40, type: 'motion' },
  'veo-2.0-motion': { label: 'Veo 2.0 Legacy Motion', defaultCost: 30, type: 'motion' },

  // Chat Models 
  'gemini-1.5-flash': { label: 'Gemini 1.5 Flash', defaultCost: 1, type: 'chat' },
  'gemini-2.0-flash': { label: 'Gemini 2.0 Flash', defaultCost: 2, type: 'chat' }
};

const VIDEO_DURATIONS = [4, 6, 8];

const DEFAULT_DURATION_PRICING: Record<string, Record<number, number>> = {
  'veo-3.1-generate-preview': { 5: 60, 10: 80, 15: 100, 20: 120, 30: 150 },
  'veo-3.1-fast-generate-preview': { 5: 45, 10: 60, 15: 75, 20: 90, 30: 120 },
  'veo-3.0-generate-001': { 5: 40, 10: 50, 15: 65, 20: 80, 30: 100 },
  'veo-3.0-fast-generate-001': { 5: 30, 10: 40, 15: 50, 20: 60, 30: 80 },
  'veo-2.0-generate-001': { 5: 25, 10: 30, 15: 40, 20: 50, 30: 65 },
};

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Form states
  const [newPlan, setNewPlan] = useState({
    name: '',
    priceCents: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    isActive: true,
    paymentLink: '',
    // الصيغة المبسطة للصلاحيات
    permissions: {
      platforms: [] as string[],
      monthlyPosts: 0,
      canSchedule: false,
      canAnalytics: false,
      canTeamManagement: false,
      maxTeamMembers: 0,
      canCustomBranding: false,
      prioritySupport: false,
      canManageWhatsApp: false,
      whatsappMessagesPerMonth: 0,
      canManageTelegram: false,
      telegramMessagesPerMonth: 0,
      canSallaIntegration: false,
      canManageContent: false,
      canManageCustomers: false,
      canMarketServices: false,
      maxServices: 0,
      canManageEmployees: false,
      maxEmployees: 0,
      canUseAI: false,
      aiCredits: 0,
      canUseLiveChat: false,
      canUseLiveChatAI: false,
      liveChatAiResponses: 0,
      canUseEventsPlugin: false,
      eventsPerMonth: 0,
      canUseTelegramAI: false,
      telegramAiCredits: 0,
      allowedAITools: [] as string[],
      modelPricing: {} as Record<string, number>,
      durationPricing: {} as Record<string, Record<number, number>>,
      creditMarkupPercent: 30,
      markupChat: 30,
      markupImage: 30,
      markupVideo: 30
    },
    type: 'standard' as 'standard' | 'ai'
  });

  const [editPlan, setEditPlan] = useState({
    name: '',
    priceCents: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    isActive: true,
    paymentLink: '',
    permissions: {
      platforms: [] as string[],
      monthlyPosts: 0,
      canSchedule: false,
      canAnalytics: false,
      canTeamManagement: false,
      maxTeamMembers: 0,
      canCustomBranding: false,
      prioritySupport: false,
      canManageWhatsApp: false,
      whatsappMessagesPerMonth: 0,
      canManageTelegram: false,
      telegramMessagesPerMonth: 0,
      canSallaIntegration: false,
      canManageContent: false,
      canManageCustomers: false,
      canMarketServices: false,
      maxServices: 0,
      canManageEmployees: false,
      maxEmployees: 0,
      canUseAI: false,
      aiCredits: 0,
      canUseLiveChat: false,
      canUseLiveChatAI: false,
      liveChatAiResponses: 0,
      canUseEventsPlugin: false,
      eventsPerMonth: 0,
      canUseTelegramAI: false,
      telegramAiCredits: 0,
      allowedAITools: [] as string[],
      modelPricing: {} as Record<string, number>,
      durationPricing: {} as Record<string, Record<number, number>>,
      creditMarkupPercent: 30,
      markupChat: 30,
      markupImage: 30,
      markupVideo: 30
    },
    type: 'standard' as 'standard' | 'ai'
  });

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadPlans();
  }, [token]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await listPlans(token);
      setPlans(res.plans);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await createPlan(token, {
        name: newPlan.name,
        priceCents: parseInt(newPlan.priceCents),
        paymentLink: newPlan.paymentLink,
        permissions: newPlan.permissions,
        interval: newPlan.interval,
        isActive: newPlan.isActive,
        type: newPlan.type as any,
      });

      setCreateModalOpen(false);
      setNewPlan({
        name: '',
        priceCents: '',
        interval: 'monthly',
        isActive: true,
        paymentLink: '',
        permissions: {
          platforms: [],
          monthlyPosts: 0,
          canSchedule: false,
          canAnalytics: false,
          canTeamManagement: false,
          maxTeamMembers: 0,
          canCustomBranding: false,
          prioritySupport: false,
          canManageWhatsApp: false,
          whatsappMessagesPerMonth: 0,
          canManageTelegram: false,
          telegramMessagesPerMonth: 0,
          canSallaIntegration: false,
          canManageContent: false,
          canManageCustomers: false,
          canMarketServices: false,
          maxServices: 0,
          canManageEmployees: false,
          maxEmployees: 0,
          canUseAI: false,
          aiCredits: 0,
          canUseLiveChat: false,
          canUseLiveChatAI: false,
          liveChatAiResponses: 0,
          canUseEventsPlugin: false,
          eventsPerMonth: 0,
          canUseTelegramAI: false,
          telegramAiCredits: 0,
          allowedAITools: [],
          modelPricing: {},
          creditMarkupPercent: 30,
          markupChat: 30,
          markupImage: 30,
          markupVideo: 30
        },
        type: 'standard'
      });
      loadPlans();
      showSuccess('تم إنشاء الباقة بنجاح!', 'تم إنشاء الباقة الجديدة بنجاح');
    } catch (e: any) {
      showError('خطأ في إنشاء الباقة', e.message);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      await updatePlan(token, selectedPlan.id, {
        name: editPlan.name,
        priceCents: parseInt(editPlan.priceCents),
        interval: editPlan.interval,
        isActive: editPlan.isActive,
        paymentLink: editPlan.paymentLink,
        permissions: editPlan.permissions,
        type: editPlan.type as any,
      });

      setEditModalOpen(false);
      setSelectedPlan(null);
      loadPlans();
      showSuccess('تم تحديث الباقة بنجاح!', 'تم تحديث الباقة بنجاح');
    } catch (e: any) {
      showError('خطأ في تحديث الباقة', e.message);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await deletePlan(token, planId);
      loadPlans();
      showSuccess('تم حذف الباقة بنجاح!', 'تم حذف الباقة بنجاح');
    } catch (e: any) {
      showError('خطأ في حذف الباقة', e.message);
    }
  };

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditPlan({
      name: plan.name,
      priceCents: plan.priceCents.toString(),
      interval: plan.interval,
      isActive: plan.isActive,
      paymentLink: plan.paymentLink || '',
      permissions: {
        platforms: plan.permissions?.platforms || [],
        monthlyPosts: plan.permissions?.monthlyPosts || 0,
        canSchedule: plan.permissions?.canSchedule || false,
        canAnalytics: plan.permissions?.canAnalytics || false,
        canTeamManagement: plan.permissions?.canTeamManagement || false,
        maxTeamMembers: plan.permissions?.maxTeamMembers || 0,
        canCustomBranding: plan.permissions?.canCustomBranding || false,
        prioritySupport: plan.permissions?.prioritySupport || false,
        canManageWhatsApp: plan.permissions?.canManageWhatsApp || false,
        whatsappMessagesPerMonth: plan.permissions?.whatsappMessagesPerMonth || 0,
        canManageTelegram: plan.permissions?.canManageTelegram || false,
        telegramMessagesPerMonth: plan.permissions?.telegramMessagesPerMonth || 0,
        canSallaIntegration: plan.permissions?.canSallaIntegration || false,
        canManageContent: plan.permissions?.canManageContent || false,
        canManageCustomers: plan.permissions?.canManageCustomers || false,
        canMarketServices: plan.permissions?.canMarketServices || false,
        maxServices: plan.permissions?.maxServices || 0,
        canManageEmployees: plan.permissions?.canManageEmployees || false,
        maxEmployees: plan.permissions?.maxEmployees || 0,
        canUseAI: (plan.permissions as any)?.canUseAI || false,
        aiCredits: (plan.permissions as any)?.aiCredits || 0,
        canUseLiveChat: (plan.permissions as any)?.canUseLiveChat || false,
        canUseLiveChatAI: (plan.permissions as any)?.canUseLiveChatAI || false,
        liveChatAiResponses: (plan.permissions as any)?.liveChatAiResponses ?? 0,
        canUseEventsPlugin: (plan.permissions as any)?.canUseEventsPlugin || false,
        eventsPerMonth: (plan.permissions as any)?.eventsPerMonth || 0,
        canUseTelegramAI: (plan.permissions as any)?.canUseTelegramAI || false,
        telegramAiCredits: (plan.permissions as any)?.telegramAiCredits || 0,
        allowedAITools: (plan.permissions as any)?.allowedAITools || [],
        modelPricing: (plan.permissions as any)?.modelPricing || {},
        durationPricing: (plan.permissions as any)?.durationPricing || {},
        creditMarkupPercent: (plan.permissions as any)?.creditMarkupPercent ?? 30,
        markupChat: (plan.permissions as any)?.markupChat ?? 30,
        markupImage: (plan.permissions as any)?.markupImage ?? 30,
        markupVideo: (plan.permissions as any)?.markupVideo ?? 30
      },
      type: plan.type || 'standard'
    });
    setEditModalOpen(true);
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = priceCents;
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `${price}`, period };
  };

  const availablePlatforms = [
    { key: 'facebook', name: 'Facebook', icon: '👥' },
    { key: 'instagram', name: 'Instagram', icon: '📷' },
    { key: 'twitter', name: 'Twitter', icon: '𝕏' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { key: 'pinterest', name: 'Pinterest', icon: '📌' },
    { key: 'tiktok', name: 'TikTok', icon: '🎵' },
    { key: 'youtube', name: 'YouTube', icon: '▶️' }
  ];

  const renderModelPricingSection = (
    currentPermissions: any,
    onChange: (permissions: any) => void
  ) => {
    // Group models by type
    const groupedModels: Record<string, string[]> = {};
    Object.keys(MODEL_PRICING_OPTIONS).forEach(modelId => {
      const type = MODEL_PRICING_OPTIONS[modelId].type;
      if (!groupedModels[type]) groupedModels[type] = [];
      groupedModels[type].push(modelId);
    });

    const handlePriceChange = (modelId: string, value: string) => {
      const numValue = parseInt(value);
      const newPricing = { ...currentPermissions.modelPricing };
      
      if (!isNaN(numValue) && numValue >= 0) {
        newPricing[modelId] = numValue;
      } else {
        delete newPricing[modelId];
      }
      
      onChange({
        ...currentPermissions,
        modelPricing: newPricing
      });
    };

    return (
      <div className="space-y-6 border-t pt-6 mt-6">
        <h3 className="font-semibold text-primary flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" />
          تسعير نماذج الذكاء الاصطناعي
        </h3>
        
        {/* Profit Markup Section */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
           <Label className="text-sm font-bold text-primary mb-1 block">نسب الربح الإضافية (%)</Label>
           <p className="text-xs text-gray-400 mb-4">
             تتم إضافة هذه النسب كربح فوق التكلفة الأساسية (أو التكلفة المحددة أدناه) لكل فئة من الخدمات.
           </p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500"> ربح الصور</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={currentPermissions.markupImage !== undefined ? currentPermissions.markupImage : 30}
                    onChange={(e) => onChange({ ...currentPermissions, markupImage: parseInt(e.target.value) || 0 })}
                    className="bg-fixed-40   text-gray-900 border-gray-300 h-9"
                    placeholder="30"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500"> ربح الفيديو والتحريك</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={currentPermissions.markupVideo !== undefined ? currentPermissions.markupVideo : 30}
                    onChange={(e) => onChange({ ...currentPermissions, markupVideo: parseInt(e.target.value) || 0 })}
                    className="bg-fixed-40   text-gray-900 border-gray-300 h-9"
                    placeholder="30"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500"> ربح الدردشة</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={currentPermissions.markupChat !== undefined ? currentPermissions.markupChat : 30}
                    onChange={(e) => onChange({ ...currentPermissions, markupChat: parseInt(e.target.value) || 0 })}
                    className="bg-fixed-40   text-gray-900 border-gray-300 h-9"
                    placeholder="30"
                  />
                  <span className="text-gray-400 font-bold">%</span>
                </div>
              </div>
           </div>
        </div>

        <p className="text-sm text-gray-400">
          حدد التكلفة الأساسية (Base Cost) لكل نموذج بـ "الكريديت". سيتم تطبيق نسبة الربح أعلاه على هذا السعر.
          <br />
          إذا تركت الحقل فارغاً، سيتم استخدام التكلفة الافتراضية للنظام.
        </p>

        <div className="space-y-6">
          {Object.entries(groupedModels).map(([type, models]) => (
            <div key={type} className="bg-[#1a1d24] p-4 rounded-xl border border-white/5">
              <h4 className="font-medium text-gray-200 mb-4 border-b border-white/5 pb-2 flex items-center justify-between">
                <span>{AI_MODEL_CATEGORIES[type as keyof typeof AI_MODEL_CATEGORIES]}</span>
                <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded">
                  {models.length} نموذج
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map(modelId => {
                  const modelInfo = MODEL_PRICING_OPTIONS[modelId];
                  const currentPrice = currentPermissions.modelPricing?.[modelId];
                  
                  // Calculate total cost (Base + Markup)
                  const costBasis = currentPrice !== undefined ? currentPrice : modelInfo.defaultCost;
                  
                  // Determine which markup to use
                  let markup = 30;
                  if (modelInfo.type === 'image') markup = (currentPermissions.markupImage !== undefined) ? currentPermissions.markupImage : 30;
                  else if (modelInfo.type === 'video' || modelInfo.type === 'motion') markup = (currentPermissions.markupVideo !== undefined) ? currentPermissions.markupVideo : 30;
                  else if (modelInfo.type === 'chat') markup = (currentPermissions.markupChat !== undefined) ? currentPermissions.markupChat : 30;
                  
                  const markupAmount = (costBasis * (markup / 100));
                  const totalCost = Math.ceil(costBasis + markupAmount);

                  return (
                    <div key={modelId} className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex flex-col">
                        <Label htmlFor={`price-${modelId}`} className="text-xs font-bold text-gray-300 mb-1 cursor-pointer">
                          {modelInfo.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 font-mono">
                            الافتراضي: {modelInfo.defaultCost}C
                          </span>
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold whitespace-nowrap">
                            الإجمالي للعميل: {totalCost}C
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`price-${modelId}`}
                          type="number"
                          min="0"
                          className="w-20 h-8 text-xs bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50"
                          placeholder={modelInfo.defaultCost.toString()}
                          value={currentPrice !== undefined ? currentPrice : ''}
                          onChange={(e) => handlePriceChange(modelId, e.target.value)}
                        />
                        <span className="text-[10px] text-gray-500 w-4">C</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDurationPricingSection = (
    currentPermissions: any,
    onChange: (permissions: any) => void
  ) => {
    const videoModels = Object.keys(MODEL_PRICING_OPTIONS).filter(
      modelId => MODEL_PRICING_OPTIONS[modelId].type === 'video' || MODEL_PRICING_OPTIONS[modelId].type === 'motion'
    );

    const handleDurationPriceChange = (modelId: string, duration: number, value: string) => {
      const numValue = parseInt(value);
      const newDurationPricing = { ...currentPermissions.durationPricing };
      
      if (!newDurationPricing[modelId]) {
        newDurationPricing[modelId] = {};
      }
      
      if (!isNaN(numValue) && numValue >= 0) {
        newDurationPricing[modelId][duration] = numValue;
      } else {
        delete newDurationPricing[modelId][duration];
      }
      
      onChange({
        ...currentPermissions,
        durationPricing: newDurationPricing
      });
    };

    return (
      <div className="space-y-6 border-t pt-6 mt-6">
        <h3 className="font-semibold text-primary flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" />
          تسعير مدد الفيديو
        </h3>
        
        <p className="text-sm text-gray-400">
          حدد التكلفة الأساسية لكل مدة فيديو (بالثواني). سيتم تطبيق نسبة الربح المحددة أعلاه على هذه الأسعار.
          <br />
          إذا تركت الحقل فارغاً، سيتم استخدام التكلفة الافتراضية للنظام.
        </p>

        <div className="space-y-4">
          {videoModels.map(modelId => {
            const modelInfo = MODEL_PRICING_OPTIONS[modelId];
            const modelDurationPricing = currentPermissions.durationPricing?.[modelId] || {};
            const defaultPricing = DEFAULT_DURATION_PRICING[modelId] || {};

            return (
              <div key={modelId} className="bg-[#1a1d24] p-4 rounded-xl border border-white/5">
                <h4 className="font-medium text-gray-200 mb-3 flex items-center justify-between">
                  <span>{modelInfo.label}</span>
                  <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded">
                    {VIDEO_DURATIONS.length} مدة
                  </span>
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {VIDEO_DURATIONS.map(duration => {
                    const currentPrice = modelDurationPricing[duration];
                    const defaultPrice = defaultPricing[duration] || modelInfo.defaultCost;
                    
                    // Calculate total cost with markup
                    const costBasis = currentPrice !== undefined ? currentPrice : defaultPrice;
                    const markup = (currentPermissions.markupVideo !== undefined) ? currentPermissions.markupVideo : 30;
                    const markupAmount = (costBasis * (markup / 100));
                    const totalCost = Math.ceil(costBasis + markupAmount);

                    return (
                      <div key={duration} className="flex flex-col gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                        <Label className="text-xs font-bold text-gray-300">
                          {duration} ثانية
                        </Label>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-gray-500 font-mono">
                            افتراضي: {defaultPrice}C
                          </span>
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold">
                            للعميل: {totalCost}C
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="w-full h-8 text-xs bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50"
                            placeholder={defaultPrice.toString()}
                            value={currentPrice !== undefined ? currentPrice : ''}
                            onChange={(e) => handleDurationPriceChange(modelId, duration, e.target.value)}
                          />
                          <span className="text-[10px] text-gray-500">C</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الباقات</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">إدارة الباقات</h1>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة باقة جديدة
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد باقات</h3>
            <p className="text-gray-600 mb-4">لم يتم إنشاء أي باقات بعد</p>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              إضافة باقة جديدة
            </Button>
        </CardContent>
      </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const { price, period } = formatPrice(plan.priceCents, plan.interval);
            const permissions = {
              platforms: plan.permissions?.platforms || [],
              monthlyPosts: plan.permissions?.monthlyPosts || 0,
              canSchedule: plan.permissions?.canSchedule || false,
              canAnalytics: plan.permissions?.canAnalytics || false,
              canTeamManagement: plan.permissions?.canTeamManagement || false,
              maxTeamMembers: plan.permissions?.maxTeamMembers || 0,
              canCustomBranding: plan.permissions?.canCustomBranding || false,
              prioritySupport: plan.permissions?.prioritySupport || false,
              canManageWhatsApp: plan.permissions?.canManageWhatsApp || false,
              whatsappMessagesPerMonth: plan.permissions?.whatsappMessagesPerMonth || 0,
              canManageTelegram: plan.permissions?.canManageTelegram || false,
              telegramMessagesPerMonth: plan.permissions?.telegramMessagesPerMonth || 0,
              canSallaIntegration: plan.permissions?.canSallaIntegration || false,
              canManageContent: plan.permissions?.canManageContent || false,
              canManageCustomers: plan.permissions?.canManageCustomers || false,
              canMarketServices: plan.permissions?.canMarketServices || false,
              maxServices: plan.permissions?.maxServices || 0,
              canManageEmployees: plan.permissions?.canManageEmployees || false,
              maxEmployees: plan.permissions?.maxEmployees || 0,
              canUseAI: (plan.permissions as any)?.canUseAI || false,
              aiCredits: (plan.permissions as any)?.aiCredits || 0,
              canUseLiveChat: (plan.permissions as any)?.canUseLiveChat || false,
              canUseTelegramAI: (plan.permissions as any)?.canUseTelegramAI || false,
              telegramAiCredits: (plan.permissions as any)?.telegramAiCredits || 0,
              canUseLiveChatAI: (plan.permissions as any)?.canUseLiveChatAI || false,
              liveChatAiResponses: (plan.permissions as any)?.liveChatAiResponses || 0,
              canUseEventsPlugin: (plan.permissions as any)?.canUseEventsPlugin || false,
              eventsPerMonth: (plan.permissions as any)?.eventsPerMonth || 0
            };
            
            return (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'نشط' : 'غير نشط'}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{price}</span>
                    <span className="text-sm text-gray-600">{period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platforms */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">المنصات الاجتماعية</h4>
                    <div className="space-y-2">
                      {/* Selected Platforms */}
                      <div className="flex flex-wrap gap-1">
                        {permissions.platforms?.map((platform) => {
                          const platformInfo = availablePlatforms.find(p => p.key === platform);
                          return (
                            <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {platformInfo?.icon} {platformInfo?.name}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Unselected Platforms */}
                      {permissions.platforms && permissions.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {availablePlatforms
                            .filter(p => !permissions.platforms?.includes(p.key))
                            .map((platform) => (
                              <span key={platform.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                {platform.icon} {platform.name}
                              </span>
                            ))}
                        </div>
                      )}
                      
                      {/* No Platforms Selected */}
                      {(!permissions.platforms || permissions.platforms.length === 0) && (
                        <div className="flex flex-wrap gap-1">
                          {availablePlatforms.map((platform) => (
                            <span key={platform.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              {platform.icon} {platform.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">الصلاحيات والحدود</h4>
                    
                    {/* Monthly Posts */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">المنشورات الشهرية:</span>
                      <span className="text-xs font-bold text-blue-600">
                        {permissions.monthlyPosts === -1 ? 'غير محدود' : permissions.monthlyPosts || 0}
                      </span>
                    </div>

                    {/* WhatsApp Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة الواتساب:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageWhatsApp ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {permissions.whatsappMessagesPerMonth > 0 && (
                              <span className="text-xs text-gray-500">
                                ({permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : permissions.whatsappMessagesPerMonth}/شهر)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Telegram Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة التليجرام:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageTelegram ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {permissions.telegramMessagesPerMonth > 0 && (
                              <span className="text-xs text-gray-500">
                                ({permissions.telegramMessagesPerMonth === -1 ? 'غير محدود' : permissions.telegramMessagesPerMonth}/شهر)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Telegram AI */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">ذكاء اصطناعي تليجرام:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canUseTelegramAI ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {permissions.telegramAiCredits > 0 && (
                              <span className="text-xs text-purple-600">
                                ({permissions.telegramAiCredits === -1 ? 'غير محدود' : (permissions.telegramAiCredits || 0) + ' كريديت'}/شهر)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Salla Integration */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">تكامل سلة:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canSallaIntegration ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة المحتوى:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageContent ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Customer Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة العملاء:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canManageCustomers ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Employee Management */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">إدارة الموظفين:</span>
                      <div className="flex items-center gap-1">
                        {(permissions as any).canManageEmployees ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {(permissions as any).maxEmployees > 0 && (
                              <span className="text-xs text-gray-500">
                                ({(permissions as any).maxEmployees} موظف)
                              </span>
                            )}
                            {(permissions as any).maxEmployees === 0 && (
                              <span className="text-xs text-gray-500">
                                (غير محدود)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Service Marketing */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">تسويق الخدمات:</span>
                      <div className="flex items-center gap-1">
                        {permissions.canMarketServices ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {permissions.maxServices > 0 && (
                              <span className="text-xs text-gray-500">
                                ({permissions.maxServices} خدمة)
                              </span>
                            )}
                            {permissions.maxServices === 0 && (
                              <span className="text-xs text-gray-500">
                                (غير محدود)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* AI Features */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">الذكاء الاصطناعي (AI):</span>
                      <div className="flex items-center gap-1">
                        {(permissions as any).canUseAI ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {(permissions as any).aiCredits > 0 && (
                              <span className="text-xs text-gray-500">
                                ({(permissions as any).aiCredits} كريديت/شهر)
                              </span>
                            )}
                            {(permissions as any).aiCredits === 0 && (
                              <span className="text-xs text-gray-500">
                                (غير محدود)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Live Chat */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">Live Chat & Tickets:</span>
                      <div className="flex items-center gap-1">
                        {(permissions as any).canUseLiveChat ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                            {(permissions as any).canUseLiveChatAI && (
                              <span className="text-xs text-purple-600 font-bold ml-1"> (AI مفعل)</span>
                            )}
                          {((permissions as any).liveChatAiResponses ?? 0) > 0 ? (
                            <span className="text-xs text-gray-500">
                              ({(permissions as any).liveChatAiResponses} رد/شهر)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              (غير محدود)
                            </span>
                          )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Events Plugin */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-700">Webhook + Api</span>
                      <div className="flex items-center gap-1">
                        {(permissions as any).canUseEventsPlugin ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">مفعل</span>
                          {((permissions as any).eventsPerMonth ?? 0) > 0 ? (
                            <span className="text-xs text-gray-500">
                              ({(permissions as any).eventsPerMonth} حدث/شهر)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              (غير محدود)
                            </span>
                          )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">غير مفعل</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openEditModal(plan)}
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      تعديل
                    </Button>
                    <Button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
        </CardContent>
      </Card>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 mx-10">
              <Crown className="h-5 w-5 text-green-600" />
              إضافة باقة جديدة
            </DialogTitle>
            
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-name">اسم الباقة</Label>
                <Input
                  id="plan-name"
                  placeholder="أدخل اسم الباقة"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan-price">السعر </Label>
                <Input
                  id="plan-price"
                  type="number"
                 
                  value={newPlan.priceCents}
                  onChange={(e) => setNewPlan({ ...newPlan, priceCents: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-interval">فترة الاشتراك</Label>
                <select
                  id="plan-interval"
                  value={newPlan.interval}
                  onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full mt-1 px-3 py-2 bg-fixed-40 border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div>
                <Label htmlFor="plan-type">نوع الباقة</Label>
                <select
                  id="plan-type"
                  value={newPlan.type}
                  onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as 'standard' | 'ai' })}
                  className="w-full mt-1 px-3 py-2 bg-fixed-40 border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="standard">باقة أساسية (Standard)</option>
                  <option value="ai">باقة ذكاء اصطناعي (AI)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="plan-active"
                checked={newPlan.isActive}
                onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="plan-active">الباقة نشطة</Label>
            </div>

            {/* Payment Link */}
            <div>
              <Label htmlFor="plan-payment-link">رابط الشراء (اختياري)</Label>
              <Input
                id="plan-payment-link"
                placeholder="أدخل رابط الشراء الخارجي (مثال: رابط Stripe أو PayPal)"
                value={newPlan.paymentLink}
                onChange={(e) => setNewPlan({ ...newPlan, paymentLink: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا تم إدخال رابط، سيتم تحويل المستخدم إليه مباشرة عند النقر على زر الاشتراك.
              </p>
            </div>

            {/* AI Features */}
            <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10">
              <Label className="text-lg font-bold text-primary mb-2 block">ميزات الذكاء الاصطناعي (AI)</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canUseAI}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canUseAI: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                  />
                  <span className="font-semibold">تفعيل ميزة AI لهذه الباقة</span>
                </label>
                {newPlan.permissions.canUseAI && (
                  <>
                    <div className="mt-4">
                      <Label>كريديت AI الشهرية</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الكريديت (0 = غير محدود)"
                        value={newPlan.permissions.aiCredits || ''}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, aiCredits: parseInt(e.target.value) || 0 }
                        })}
                        className="mt-2 border-primary/20"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        عدد الكريديت المسموح شهرياً لاستخدام AI. اترك 0 لغير محدود.
                      </p>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-900/60 rounded-2xl border border-white/5">
                        <Label className="text-primary mb-3 block font-bold">الأدوات الذكية المتاحة</Label>
                        <div className="space-y-4">
                          {['الدردشة', 'الصور', 'الفيديو'].map(cat => (
                            <div key={cat} className="space-y-2">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="text-xs font-bold text-gray-400">{cat}</span>
                                <Button 
                                  variant="none" 
                                  size="sm" 
                                  type="button"
                                  className="text-[10px] h-6 text-blue-400 hover:text-blue-300"
                                  onClick={() => {
                                    const catTools = AI_TOOLS_LIST.filter(t => t.category === cat).map(t => t.id);
                                    const current = newPlan.permissions.allowedAITools || [];
                                    const allIn = catTools.every(id => current.includes(id));
                                    let next;
                                    if (allIn) {
                                      next = current.filter(id => !catTools.includes(id));
                                    } else {
                                      next = Array.from(new Set([...current, ...catTools]));
                                    }
                                    setNewPlan({
                                      ...newPlan,
                                      permissions: { ...newPlan.permissions, allowedAITools: next }
                                    });
                                  }}
                                >
                                  {AI_TOOLS_LIST.filter(t => t.category === cat).every(t => (newPlan.permissions.allowedAITools || []).includes(t.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {AI_TOOLS_LIST.filter(t => t.category === cat).map(tool => (
                                  <label key={tool.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/10">
                                    <input
                                      type="checkbox"
                                      checked={(newPlan.permissions.allowedAITools || []).includes(tool.id)}
                                      onChange={(e) => {
                                        const current = newPlan.permissions.allowedAITools || [];
                                        const next = e.target.checked 
                                            ? [...current, tool.id]
                                            : current.filter(id => id !== tool.id);
                                        setNewPlan({
                                          ...newPlan,
                                          permissions: { ...newPlan.permissions, allowedAITools: next }
                                        });
                                      }}
                                      className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                                    />
                                    <span className="text-[11px] text-gray-300 leading-tight">{tool.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  </>
                )}
              
              {/* MODEL PRICING - Create */}
              {renderModelPricingSection(newPlan.permissions, (p) => setNewPlan({ ...newPlan, permissions: p }))}
              
              {/* DURATION PRICING - Create */}
              {renderDurationPricingSection(newPlan.permissions, (p) => setNewPlan({ ...newPlan, permissions: p }))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <Label>المنصات المسموحة</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer border-primary">
                    <input
                    className=""
                      type="checkbox"
                      checked={newPlan.permissions.platforms.includes(platform.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPlan({
                            ...newPlan,
                            permissions: {
                              ...newPlan.permissions,
                              platforms: [...newPlan.permissions.platforms, platform.key]
                            }
                          });
                        } else {
                          setNewPlan({
                            ...newPlan,
                            permissions: {
                              ...newPlan.permissions,
                              platforms: newPlan.permissions.platforms.filter(p => p !== platform.key)
                            }
                          });
                        }
                      }}
                    />
                    <span>{platform.icon}</span>
                    <span className="text-sm">{platform.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Posting Limits */}
            <div>
              <Label htmlFor="monthly-posts">المنشورات الشهرية</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="monthly-posts"
                  type="number"
                  min="0"
                  placeholder="عدد المنشورات"
                  value={newPlan.permissions.monthlyPosts === -1 ? '' : newPlan.permissions.monthlyPosts}
                  onChange={(e) => setNewPlan({
                    ...newPlan,
                    permissions: { ...newPlan.permissions, monthlyPosts: parseInt(e.target.value) || 0 }
                  })}
                  disabled={newPlan.permissions.monthlyPosts === -1}
                />
                <Button
                  type="button"
                  variant={newPlan.permissions.monthlyPosts === -1 ? "default" : "secondary"}
                  onClick={() => setNewPlan({
                    ...newPlan,
                    permissions: { ...newPlan.permissions, monthlyPosts: newPlan.permissions.monthlyPosts === -1 ? 0 : -1 }
                  })}
                  className="whitespace-nowrap"
                >
                  {newPlan.permissions.monthlyPosts === -1 ? 'غير محدود' : 'غير محدود'}
                </Button>
              </div>
              {newPlan.permissions.monthlyPosts === -1 && (
                <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن النشر بدون حدود</p>
              )}
            </div>

            {/* Content Management */}
            <div>
              <Label>إدارة المحتوى</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageContent}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageContent: e.target.checked }
                    })}
                  />
                  <span>إدارة المحتوى</span>
                </label>
              </div>
            </div>

            {/* Customer Management */}
            <div>
              <Label>إدارة العملاء</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageCustomers}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageCustomers: e.target.checked }
                    })}
                  />
                  <span>إدارة العملاء</span>
                </label>
                {/* <p className="text-xs text-gray-500 mt-1">السماح بإدارة قاعدة بيانات العملاء واشتراكاتهم</p> */}
              </div>
            </div>

            {/* Employee Management */}
            <div>
              <Label>إدارة الموظفين</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageEmployees}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageEmployees: e.target.checked }
                    })}
                  />
                  <span>تفعيل إدارة الموظفين</span>
                </label>
                {newPlan.permissions.canManageEmployees && (
                  <div>
                    <Label>الحد الأقصى للموظفين</Label>
                    <Input
                      type="number"
                      value={newPlan.permissions.maxEmployees}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        permissions: { ...newPlan.permissions, maxEmployees: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="0 = غير محدود"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = غير محدود</p>
                  </div>
                )}
                {/* <p className="text-xs text-gray-500 mt-1">السماح بإضافة وإدارة الموظفين وصلاحياتهم</p> */}
              </div>
            </div>

            {/* Service Marketing */}
            <div>
              <Label>تسويق الخدمات</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canMarketServices}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canMarketServices: e.target.checked }
                    })}
                  />
                  <span>تفعيل تسويق الخدمات</span>
                </label>
                {newPlan.permissions.canMarketServices && (
                  <div>
                    <Label>عدد الخدمات المسموح بها</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="عدد الخدمات (0 = غير محدود)"
                      value={newPlan.permissions.maxServices || ''}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        permissions: { ...newPlan.permissions, maxServices: parseInt(e.target.value) || 0 }
                      })}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الخدمات التي يمكن للمستخدم تسويقها. اترك 0 لغير محدود.
                    </p>
                  </div>
                )}
              </div>
            </div>



            {/* Live Chat & Tickets */}
            <div>
              <Label>Live Chat & Tickets</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canUseLiveChat}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canUseLiveChat: e.target.checked }
                    })}
                  />
                  <span>تفعيل ميزة Live Chat والتذاكر</span>
                </label>
                {/* <p className="text-xs text-gray-500 mt-1">
                  يسمح للمستخدمين بإضافة ويدجت دردشة مباشرة على مواقعهم وإدارة التذاكر
                </p> */}
                {newPlan.permissions.canUseLiveChat && (
                  <div className="space-y-2 mt-4">
                    <Label>عدد ردود الذكاء الاصطناعي الشهري للـ Live Chat</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 = غير محدود"
                      value={newPlan.permissions.liveChatAiResponses ?? 0}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          permissions: {
                            ...newPlan.permissions,
                            liveChatAiResponses: parseLocalizedNumber(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      يتحكم هذا العدد في مرات ردود الذكاء الاصطناعي على محادثات العملاء شهرياً. اختر 0 لغير محدود.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Events Plugin Integration */}
            <div>
              <Label>تكامل الأحداث (Events Plugin)</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canUseEventsPlugin}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canUseEventsPlugin: e.target.checked }
                    })}
                  />
                  <span>تفعيل تكامل الأحداث مع المنصات الخارجية</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  يسمح للمستخدمين باستقبال الأحداث من المنصات الخارجية (متاجر، اشتراكات)
                </p>
                {newPlan.permissions.canUseEventsPlugin && (
                  <div className="space-y-2 mt-4">
                    <Label>عدد الأحداث الشهرية</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 = غير محدود"
                      value={newPlan.permissions.eventsPerMonth ?? 0}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          permissions: {
                            ...newPlan.permissions,
                            eventsPerMonth: parseLocalizedNumber(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      عدد الأحداث المسموح باستقبالها شهرياً. اختر 0 لغير محدود.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Management */}
            <div>
              <Label>إدارة الواتساب</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={newPlan.permissions.canManageWhatsApp}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        permissions: { ...newPlan.permissions, canManageWhatsApp: e.target.checked }
                      })}
                    />
                    <span>إدارة الواتساب</span>
                  </label>
                  {newPlan.permissions.canManageWhatsApp && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={newPlan.permissions.whatsappMessagesPerMonth === -1 ? '' : newPlan.permissions.whatsappMessagesPerMonth}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, whatsappMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={newPlan.permissions.whatsappMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={newPlan.permissions.whatsappMessagesPerMonth === -1 ? "default" : "secondary"}
                        onClick={() => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, whatsappMessagesPerMonth: newPlan.permissions.whatsappMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {newPlan.permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>
                  )}
                  {newPlan.permissions.canManageWhatsApp && newPlan.permissions.whatsappMessagesPerMonth === -1 && (
                    <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن إرسال رسائل بدون حدود</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram Management */}
            <div>
              <Label>إدارة التليجرام</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canManageTelegram}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canManageTelegram: e.target.checked }
                    })}
                  />
                  <span>إدارة التليجرام</span>
                </label>
                
                {newPlan.permissions.canManageTelegram && (
                  <div className="mr-6 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={newPlan.permissions.telegramMessagesPerMonth === -1 ? '' : newPlan.permissions.telegramMessagesPerMonth}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, telegramMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={newPlan.permissions.telegramMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={newPlan.permissions.telegramMessagesPerMonth === -1 ? "default" : "secondary"}
                        onClick={() => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, telegramMessagesPerMonth: newPlan.permissions.telegramMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {newPlan.permissions.telegramMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>

                    <label className="flex items-center gap-2 text-purple-600 font-medium">
                      <input
                        type="checkbox"
                        checked={newPlan.permissions.canUseTelegramAI}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          permissions: { ...newPlan.permissions, canUseTelegramAI: e.target.checked }
                        })}
                      />
                      <span>تفعيل الذكاء الاصطناعي لتليجرام</span>
                    </label>

                    {newPlan.permissions.canUseTelegramAI && (
                      <div className="space-y-2">
                        <Label>كريديت AI تليجرام شهرياً</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="عدد الكريديت (0 = غير محدود)"
                          value={newPlan.permissions.telegramAiCredits || ''}
                          onChange={(e) => setNewPlan({
                            ...newPlan,
                            permissions: { ...newPlan.permissions, telegramAiCredits: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Salla Integration */}
            <div>
              <Label>تكامل سلة</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canSallaIntegration}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canSallaIntegration: e.target.checked }
                    })}
                  />
                  <span>تكامل سلة</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setCreateModalOpen(false)}
                variant="secondary"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreatePlan}
                disabled={!newPlan.name || !newPlan.priceCents}
                className="bg-green-600 hover:bg-green-700"
              >
                إنشاء الباقة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal - Similar structure but for editing */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              تعديل الباقة
            </DialogTitle>
            <DialogDescription>
              تعديل إعدادات الباقة: {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Similar form structure as create modal but with editPlan state */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-name">اسم الباقة</Label>
                <Input
                  id="edit-plan-name"
                  placeholder="أدخل اسم الباقة"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-price">السعر </Label>
                <Input
                  id="edit-plan-price"
                  type="number"
                  value={editPlan.priceCents}
                  onChange={(e) => setEditPlan({ ...editPlan, priceCents: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-interval">نوع الاشتراك</Label>
                <select
                  id="edit-plan-interval"
                  value={editPlan.interval}
                  onChange={(e) => setEditPlan({ ...editPlan, interval: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-plan-active"
                  checked={editPlan.isActive}
                  onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-plan-active">الباقة نشطة</Label>
              </div>
            </div>

            {/* Payment Link */}
            <div>
              <Label htmlFor="edit-plan-payment-link">رابط الشراء (اختياري)</Label>
              <Input
                id="edit-plan-payment-link"
                placeholder="أدخل رابط الشراء الخارجي (مثال: رابط Stripe أو PayPal)"
                value={editPlan.paymentLink}
                onChange={(e) => setEditPlan({ ...editPlan, paymentLink: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا تم إدخال رابط، سيتم تحويل المستخدم إليه مباشرة عند النقر على زر الاشتراك.
              </p>
            </div>
            {/* AI Features */}
            <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10">
              <Label className="text-lg font-bold text-primary mb-2 block">ميزات الذكاء الاصطناعي (AI)</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canUseAI}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canUseAI: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                  />
                  <span className="font-semibold">تفعيل ميزة AI لهذه الباقة</span>
                </label>
                {editPlan.permissions.canUseAI && (
                  <>
                    <div className="mt-4">
                      <Label>كريديت AI الشهرية</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الكريديت (0 = غير محدود)"
                        value={editPlan.permissions.aiCredits || ''}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, aiCredits: parseInt(e.target.value) || 0 }
                        })}
                        className="mt-2 border-primary/20"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        عدد الكريديت المسموح شهرياً لاستخدام AI. اترك 0 لغير محدود.
                      </p>
                    </div>

                    <div className="mt-4 p-4 bg-gray-900/60 rounded-2xl border border-white/5">
                      <Label className="text-primary mb-3 block font-bold">الأدوات الذكية المتاحة</Label>
                      <div className="space-y-4">
                        {['الدردشة', 'الصور', 'الفيديو'].map(cat => (
                          <div key={cat} className="space-y-2">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-xs font-bold text-gray-400">{cat}</span>
                              <Button 
                                variant="none" 
                                size="sm" 
                                type="button"
                                className="text-[10px] h-6 text-blue-400 hover:text-blue-300"
                                onClick={() => {
                                  const catTools = AI_TOOLS_LIST.filter(t => t.category === cat).map(t => t.id);
                                  const current = editPlan.permissions.allowedAITools || [];
                                  const allIn = catTools.every(id => current.includes(id));
                                  let next;
                                  if (allIn) {
                                    next = current.filter(id => !catTools.includes(id));
                                  } else {
                                    next = Array.from(new Set([...current, ...catTools]));
                                  }
                                  setEditPlan({
                                    ...editPlan,
                                    permissions: { ...editPlan.permissions, allowedAITools: next }
                                  });
                                }}
                              >
                                {AI_TOOLS_LIST.filter(t => t.category === cat).every(t => (editPlan.permissions.allowedAITools || []).includes(t.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {AI_TOOLS_LIST.filter(t => t.category === cat).map(tool => (
                                <label key={tool.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/10">
                                  <input
                                    type="checkbox"
                                    checked={(editPlan.permissions.allowedAITools || []).includes(tool.id)}
                                    onChange={(e) => {
                                      const current = editPlan.permissions.allowedAITools || [];
                                      const next = e.target.checked 
                                          ? [...current, tool.id]
                                          : current.filter(id => id !== tool.id);
                                      setEditPlan({
                                        ...editPlan,
                                        permissions: { ...editPlan.permissions, allowedAITools: next }
                                      });
                                    }}
                                    className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                                  />
                                  <span className="text-[11px] text-gray-300 leading-tight">{tool.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              
              {/* MODEL PRICING - Edit */}
              {renderModelPricingSection(editPlan.permissions, (p) => setEditPlan({ ...editPlan, permissions: p }))}
              
              {/* DURATION PRICING - Edit */}
              {renderDurationPricingSection(editPlan.permissions, (p) => setEditPlan({ ...editPlan, permissions: p }))}
              </div>
            </div>
            <div>
              <Label>المنصات المسموحة</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availablePlatforms.map((platform) => (
                  <label key={platform.key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={editPlan.permissions.platforms.includes(platform.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditPlan({
                            ...editPlan,
                            permissions: {
                              ...editPlan.permissions,
                              platforms: [...editPlan.permissions.platforms, platform.key]
                            }
                          });
                        } else {
                          setEditPlan({
                            ...editPlan,
                            permissions: {
                              ...editPlan.permissions,
                              platforms: editPlan.permissions.platforms.filter(p => p !== platform.key)
                            }
                          });
                        }
                      }}
                    />
                    <span>{platform.icon}</span>
                    <span className="text-sm">{platform.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Posting Limits */}
            <div>
              <Label htmlFor="edit-monthly-posts">المنشورات الشهرية</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="edit-monthly-posts"
                  type="number"
                  min="0"
                  placeholder="عدد المنشورات"
                  value={editPlan.permissions.monthlyPosts === -1 ? '' : editPlan.permissions.monthlyPosts}
                  onChange={(e) => setEditPlan({
                    ...editPlan,
                    permissions: { ...editPlan.permissions, monthlyPosts: parseInt(e.target.value) || 0 }
                  })}
                  disabled={editPlan.permissions.monthlyPosts === -1}
                />
                <Button
                  type="button"
                  variant={editPlan.permissions.monthlyPosts === -1 ? "default" : "secondary"}
                  onClick={() => setEditPlan({
                    ...editPlan,
                    permissions: { ...editPlan.permissions, monthlyPosts: editPlan.permissions.monthlyPosts === -1 ? 0 : -1 }
                  })}
                  className="whitespace-nowrap"
                >
                  {editPlan.permissions.monthlyPosts === -1 ? 'غير محدود' : 'غير محدود'}
                </Button>
              </div>
              {editPlan.permissions.monthlyPosts === -1 && (
                <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن النشر بدون حدود</p>
              )}
            </div>

            {/* Content Management */}
            <div>
              <Label>إدارة المحتوى</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageContent}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageContent: e.target.checked }
                    })}
                  />
                  <span>إدارة المحتوى</span>
                </label>
              </div>
            </div>

            {/* Customer Management */}
            <div>
              <Label>إدارة العملاء</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageCustomers}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageCustomers: e.target.checked }
                    })}
                  />
                  <span>إدارة العملاء</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">السماح بإدارة قاعدة بيانات العملاء واشتراكاتهم</p>
              </div>
            </div>

            {/* Employee Management */}
            <div>
              <Label>إدارة الموظفين</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageEmployees}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageEmployees: e.target.checked }
                    })}
                  />
                  <span>تفعيل إدارة الموظفين</span>
                </label>
                {editPlan.permissions.canManageEmployees && (
                  <div>
                    <Label>الحد الأقصى للموظفين</Label>
                    <Input
                      type="number"
                      value={editPlan.permissions.maxEmployees}
                      onChange={(e) => setEditPlan({
                        ...editPlan,
                        permissions: { ...editPlan.permissions, maxEmployees: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="0 = غير محدود"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = غير محدود</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">السماح بإضافة وإدارة الموظفين وصلاحياتهم</p>
              </div>
            </div>

            {/* Service Marketing */}
            <div>
              <Label>تسويق الخدمات</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canMarketServices}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canMarketServices: e.target.checked }
                    })}
                  />
                  <span>تفعيل تسويق الخدمات</span>
                </label>
                {editPlan.permissions.canMarketServices && (
                  <div>
                    <Label>عدد الخدمات المسموح بها</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="عدد الخدمات (0 = غير محدود)"
                      value={editPlan.permissions.maxServices || ''}
                      onChange={(e) => setEditPlan({
                        ...editPlan,
                        permissions: { ...editPlan.permissions, maxServices: parseInt(e.target.value) || 0 }
                      })}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الخدمات التي يمكن للمستخدم تسويقها. اترك 0 لغير محدود.
                    </p>
                  </div>
                )}
              </div>
            </div>



            {/* Live Chat & Tickets */}
            <div>
              <Label>Live Chat & Tickets</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canUseLiveChat}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canUseLiveChat: e.target.checked }
                    })}
                  />
                  <span>تفعيل ميزة Live Chat والتذاكر</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  يسمح للمستخدمين بإضافة ويدجت دردشة مباشرة على مواقعهم وإدارة التذاكر
                </p>
                {editPlan.permissions.canUseLiveChat && (
                  <div className="space-y-4 mt-4 mr-6">
                    <label className="flex items-center gap-2 mb-2 text-purple-600 font-medium">
                      <input
                        type="checkbox"
                        checked={editPlan.permissions.canUseLiveChatAI}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, canUseLiveChatAI: e.target.checked }
                        })}
                      />
                      <span>تفعيل الذكاء الاصطناعي للرد التلقائي</span>
                    </label>

                    {editPlan.permissions.canUseLiveChatAI && (
                      <div className="space-y-2">
                        <Label>عدد ردود الذكاء الاصطناعي الشهري للـ Live Chat</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0 = غير محدود"
                          value={editPlan.permissions.liveChatAiResponses ?? 0}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              permissions: {
                                ...editPlan.permissions,
                                liveChatAiResponses: parseLocalizedNumber(e.target.value),
                              },
                            })
                          }
                        />
                        <p className="text-xs text-gray-500">
                          يتحكم هذا العدد في مرات ردود الذكاء الاصطناعي على محادثات العملاء شهرياً. اختر 0 لغير محدود.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Events Plugin Integration */}
            <div>
              <Label>تكامل الأحداث (Events Plugin)</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canUseEventsPlugin}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canUseEventsPlugin: e.target.checked }
                    })}
                  />
                  <span>تفعيل تكامل الأحداث مع المنصات الخارجية</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  يسمح للمستخدمين باستقبال الأحداث من المنصات الخارجية (متاجر، اشتراكات)
                </p>
                {editPlan.permissions.canUseEventsPlugin && (
                  <div className="space-y-2 mt-4">
                    <Label>عدد الأحداث الشهرية</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 = غير محدود"
                      value={editPlan.permissions.eventsPerMonth ?? 0}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          permissions: {
                            ...editPlan.permissions,
                            eventsPerMonth: parseLocalizedNumber(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      عدد الأحداث المسموح باستقبالها شهرياً. اختر 0 لغير محدود.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Management */}
            <div>
              <Label>إدارة الواتساب</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={editPlan.permissions.canManageWhatsApp}
                      onChange={(e) => setEditPlan({
                        ...editPlan,
                        permissions: { ...editPlan.permissions, canManageWhatsApp: e.target.checked }
                      })}
                    />
                    <span>إدارة الواتساب</span>
                  </label>
                  {editPlan.permissions.canManageWhatsApp && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={editPlan.permissions.whatsappMessagesPerMonth === -1 ? '' : editPlan.permissions.whatsappMessagesPerMonth}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, whatsappMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={editPlan.permissions.whatsappMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={editPlan.permissions.whatsappMessagesPerMonth === -1 ? "default" : "secondary"}
                        onClick={() => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, whatsappMessagesPerMonth: editPlan.permissions.whatsappMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {editPlan.permissions.whatsappMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>
                  )}
                  {editPlan.permissions.canManageWhatsApp && editPlan.permissions.whatsappMessagesPerMonth === -1 && (
                    <p className="text-xs text-gray-500 mt-1">غير محدود - يمكن إرسال رسائل بدون حدود</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram Management */}
            <div>
              <Label>إدارة التليجرام</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canManageTelegram}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canManageTelegram: e.target.checked }
                    })}
                  />
                  <span>إدارة التليجرام</span>
                </label>

                {editPlan.permissions.canManageTelegram && (
                  <div className="mr-6 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد الرسائل شهرياً"
                        value={editPlan.permissions.telegramMessagesPerMonth === -1 ? '' : editPlan.permissions.telegramMessagesPerMonth}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, telegramMessagesPerMonth: parseInt(e.target.value) || 0 }
                        })}
                        disabled={editPlan.permissions.telegramMessagesPerMonth === -1}
                      />
                      <Button
                        type="button"
                        variant={editPlan.permissions.telegramMessagesPerMonth === -1 ? "default" : "secondary"}
                        onClick={() => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, telegramMessagesPerMonth: editPlan.permissions.telegramMessagesPerMonth === -1 ? 0 : -1 }
                        })}
                        className="whitespace-nowrap"
                      >
                        {editPlan.permissions.telegramMessagesPerMonth === -1 ? 'غير محدود' : 'غير محدود'}
                      </Button>
                    </div>

                    <label className="flex items-center gap-2 text-purple-600 font-medium">
                      <input
                        type="checkbox"
                        checked={editPlan.permissions.canUseTelegramAI}
                        onChange={(e) => setEditPlan({
                          ...editPlan,
                          permissions: { ...editPlan.permissions, canUseTelegramAI: e.target.checked }
                        })}
                      />
                      <span>تفعيل الذكاء الاصطناعي لتليجرام</span>
                    </label>

                    {editPlan.permissions.canUseTelegramAI && (
                      <div className="space-y-2">
                        <Label>كريديت AI تليجرام شهرياً</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="عدد الكريديت (0 = غير محدود)"
                          value={editPlan.permissions.telegramAiCredits || ''}
                          onChange={(e) => setEditPlan({
                            ...editPlan,
                            permissions: { ...editPlan.permissions, telegramAiCredits: parseInt(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Salla Integration */}
            <div>
              <Label>تكامل سلة</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canSallaIntegration}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canSallaIntegration: e.target.checked }
                    })}
                  />
                  <span>تكامل سلة</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setEditModalOpen(false)}
                variant="secondary"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdatePlan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
      liveChatAiResponses: 0,
      canUseEventsPlugin: false,
      eventsPerMonth: 0
    }
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
      liveChatAiResponses: 0,
      canUseEventsPlugin: false,
      eventsPerMonth: 0
    }
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
          liveChatAiResponses: 0
        }
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
        permissions: editPlan.permissions
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
        liveChatAiResponses: (plan.permissions as any)?.liveChatAiResponses ?? 0,
        canUseEventsPlugin: (plan.permissions as any)?.canUseEventsPlugin || false,
        eventsPerMonth: (plan.permissions as any)?.eventsPerMonth || 0
      }
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
              canSallaIntegration: plan.permissions?.canSallaIntegration || false,
              canManageContent: plan.permissions?.canManageContent || false,
              canManageCustomers: plan.permissions?.canManageCustomers || false,
              canMarketServices: plan.permissions?.canMarketServices || false,
              maxServices: plan.permissions?.maxServices || 0,
              canManageEmployees: plan.permissions?.canManageEmployees || false,
              maxEmployees: plan.permissions?.maxEmployees || 0,
              canUseAI: (plan.permissions as any)?.canUseAI || false,
              aiCredits: (plan.permissions as any)?.aiCredits || 0,
              canUseLiveChat: (plan.permissions as any)?.canUseLiveChat || false
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
                      <span className="text-xs font-medium text-gray-700">تكامل الأحداث (Events):</span>
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
                <Label htmlFor="plan-interval">نوع الاشتراك</Label>
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

            {/* AI Features */}
            <div>
              {/* <Label>ميزات الذكاء الاصطناعي (AI)</Label> */}
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={newPlan.permissions.canUseAI}
                    onChange={(e) => setNewPlan({
                      ...newPlan,
                      permissions: { ...newPlan.permissions, canUseAI: e.target.checked }
                    })}
                  />
                  <span>تفعيل ميزة AI</span>
                </label>
                {newPlan.permissions.canUseAI && (
                  <div>
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
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الكريديت المسموح شهرياً لاستخدام AI. اترك 0 لغير محدود.
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
              <div className="mt-2">
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


            {/* Platforms */}
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

            {/* AI Features */}
            <div>
              <Label>ميزات الذكاء الاصطناعي (AI)</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={editPlan.permissions.canUseAI}
                    onChange={(e) => setEditPlan({
                      ...editPlan,
                      permissions: { ...editPlan.permissions, canUseAI: e.target.checked }
                    })}
                  />
                  <span>تفعيل ميزة AI</span>
                </label>
                {editPlan.permissions.canUseAI && (
                  <div>
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
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الكريديت المسموح شهرياً لاستخدام AI. اترك 0 لغير محدود.
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
                  <div className="space-y-2 mt-4">
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
              <div className="mt-2">
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
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPlans, listPublicPlans, type Plan, createSubscriptionRequest } from "@/lib/api";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useToast } from "@/components/ui/toast-provider";
import { Check, CheckCircle, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  const availablePlatforms = [
    { key: 'facebook', name: 'Facebook', icon: <Image width={25} height={25} src="/facebook.gif" alt="Facebook" /> },
    { key: 'instagram', name: 'Instagram', icon: <Image width={25} height={25} src="/insta.gif" alt="Instagram" /> },
    { key: 'twitter', name: 'Twitter', icon: <Image width={25} height={25} src="/x.gif" alt="Twitter" /> },
    { key: 'linkedin', name: 'LinkedIn', icon: <Image width={25} height={25} src="/linkedin.gif" alt="LinkedIn" /> },
    // { key: 'pinterest', name: 'Pinterest', icon: '📌' },
    // { key: 'tiktok', name: 'TikTok', icon: '🎵' },
    { key: 'youtube', name: 'YouTube', icon: <Image width={25} height={25} src="/youtube.gif" alt="YouTube" /> }
  ];

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    // Use listPublicPlans for guests, and listPlans for authenticated users
    const fetchPlans = token ? listPlans(token, 'standard') : listPublicPlans('standard');
    
    fetchPlans
      .then((res) => setPlans(res.plans))
      .catch((e) => {
        console.error("Failed to fetch plans:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubscribe = async (paymentMethod: 'usdt' | 'coupon', data: any) => {
    if (!selectedPlan || !token) return;

    try {
      const payload = {
        planId: selectedPlan.id,
        paymentMethod,
        ...data
      };

      const result = await createSubscriptionRequest(token, payload);
      
      // Show success message or redirect
      showSuccess('تم إرسال طلب الاشتراك بنجاح!', 'يمكنك متابعة حالة الطلب من صفحة طلباتي.');
      
      return result; // Return result for receipt upload
    } catch (error: any) {
      showError('خطأ في إرسال الطلب', error.message);
      throw error;
    }
  };

  const openSubscriptionModal = (plan: Plan) => {
    if (!token) {
      showError("يجب تسجيل الدخول للاشتراك");
      router.push('/sign-in');
      return;
    }
    setSelectedPlan(plan);
    setSubscriptionModalOpen(true);
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = priceCents;
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `${price}`, period };
  };

  const formatFeatures = (features: any) => {
    if (Array.isArray(features)) {
      return features;
    }
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [features];
      } catch {
        return [features];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-white">الباقات</h1>
          {/* <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p> */}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="mt-4 h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-white">الباقات</h1>
              {/* <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p> */}
        </div>
        <div className="text-center py-8">
          <p className="text-red-400">خطأ في تحميل الباقات: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 ">
      <div>
        <h1 className="text-4xl font-semibold text-white">الباقات</h1>
        {/* <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p> */}
      </div>
      
      {/* Custom Package CTA */}
      <div className="w-full">
        <Link href="/plans/custom">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 gradient-border p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-border flex items-center justify-center text-2xl shadow-lg shadow-primary/20">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">صمم باقتك المخصصة</h3>
                  <p className="text-sm text-gray-400">اختر الميزات التي تحتاجها فقط وادفع مقابل ما تستخدمه</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-6 py-2.5 gradient-border text-white rounded-xl font-medium group-hover:scale-105 transition-transform">
                ابدأ التخصيص
                <span className="text-lg">←</span>
                <BorderBeam/>
              </div>
            </div>
          </div>
        </Link>
      </div> 

    
      {plans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">لا توجد باقات متاحة في الوقت الحالي.</p>
        </div>
      ) : (
       <div className="flex items-center justify-center flex-wrap gap-6">
          {plans.map((plan, index) => {
            const { price, period } = formatPrice(plan.priceCents, plan.interval);
            const permissions = plan.permissions || {};
            const isHighlighted = index === 1; // Highlight the middle plan
            
            return (
              <Card key={plan.id} className={isHighlighted ? "w-[500px]  relative rounded-[35px]  bg-gradient-to-br from-text-primary via-bg-secondry to-bg-secondry border-1 border-white/50" : "w-[500px] relative rounded-[35px]  bg-gradient-to-br from-text-primary via-bg-secondry to-bg-secondry border-1 border-white/50"}>
                {/* <div className="absolute  w-50 flex items-center justify-center -top-10 left-1/2 -translate-x-1/2 bg-secondry rounded-t-xl px-1">
<Image src="/Logo.png" alt="plan" width={100} height={70} />
                </div> */}
                <CardHeader className="border-none">
                  <div className="relative ">
<p className="text-7xl font-semibold text-white text-center text-shadow-bottom">
    {price}
    <span className="text-xs font-normal text-white">ريال</span>
</p>                    <div className="text-xl font-semibold text-white text-center">{plan.name}</div>
                    <div className="text-2xl absolute top-0 left-0 font-bold text-primary">
                       <span className="text-sm font-bold text-white">{period === 'month' ? 'شهري' : 'شهري'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4  border-t-1 border-white/50 rounded-[45px] bg-gradient-to-br from-bg-secondry via-bg-purple-700 to-bg-purple-500">
                  
                  {/* Platforms */}
                  <div>
                    <h4 className="text-sm font-medium text-center text-gray-300 mb-2">المنصات الاجتماعية</h4>
                    <div className="space-y-2">
                      {/* Selected Platforms */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(permissions as any).platforms?.map((platform: string) => {
                          const platformInfo = availablePlatforms.find(p => p.key === platform);
                          return (
                            <div key={platform} className="flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-gray-200">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                              {platformInfo?.icon}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Unselected Platforms */}
                      {(permissions as any).platforms && (permissions as any).platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {availablePlatforms
                            .filter(p => !(permissions as any).platforms?.includes(p.key))
                            .map((platform) => (
                              <span key={platform.key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-fixed-40 text-red-800">
                                <XCircle className="h-3 w-3 mr-1 text-red-400" />
                                {platform.icon} 
                              </span>
                            ))}
                        </div>
                      )}
                      
                      {/* No Platforms Selected */}
                      {(!(permissions as any).platforms || (permissions as any).platforms.length === 0) && (
                        <div className="flex flex-wrap gap-1 ">
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

                  {/* Permissions */}
                  <div className="space-y-2 p-3 rounded-[35px] border-1 border-white/50 bg-text-primary/10">
                    {/* <h4 className="text-sm text-center font-medium text-gray-300">الصلاحيات</h4> */}
                    
                    {(() => {
                      const permissionItems = [
                        // Basic Features
                        {
                          enabled: (permissions as any).monthlyPosts !== 0,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                <Check className="h-3 w-3 text-black font-bold" />
                              </div>
                              <span className="text-xs font-medium text-gray-200">المنشورات الشهرية:</span>
                              {(permissions as any).monthlyPosts !== 0 && (
                                <span className="text-xs text-primary">
                                  ({(permissions as any).monthlyPosts === -1 ? 'غير محدود' : (permissions as any).monthlyPosts} منشورات/شهر)
                                </span>
                              )}
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canManageContent,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canManageContent ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">إدارة المحتوى</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">إدارة المحتوى</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canManageWhatsApp,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canManageWhatsApp ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">إدارة الواتساب:</span>
                                    <span className="text-xs text-green-400">
                                      (مدعوم بالذكاء الاصطناعي - 
                                      {(permissions as any).whatsappMessagesPerMonth === -1 ? 'غير محدود' : ` ${(permissions as any).whatsappMessagesPerMonth} رد Ai`})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white line-through font-medium">إدارة الواتساب </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canManageTelegram,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {(permissions as any).canManageTelegram ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">إدارة التليجرام</span>
                                    {(permissions as any).telegramMessagesPerMonth !== 0 && (
                                      <span className="text-xs text-primary">
                                        ({(permissions as any).telegramMessagesPerMonth === -1 ? 'غير محدود' : (permissions as any).telegramMessagesPerMonth} رسالة/شهر)
                                      </span>
                                    )}
                                    {(permissions as any).canUseTelegramAI ? (
                                      <span className="text-xs text-green-400">
                                        (مدعوم بالذكاء الاصطناعي
                                        {(permissions as any).telegramAiCredits !== undefined && (
                                          <>
                                            {" - "}
                                            {(permissions as any).telegramAiCredits === -1 || (permissions as any).telegramAiCredits === 0 ? 'غير محدود' : `${(permissions as any).telegramAiCredits} رد`}
                                          </>
                                        )}
                                        )
                                      </span>
                                    ) : (
                                      <span className="text-xs text-red-400">(غير مدعوم بالذكاء الاصطناعي)</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white line-through font-medium">إدارة التليجرام </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        
                        // Advanced Features
                        {
                          enabled: (permissions as any).canUseAI,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canUseAI ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white font-medium">  جميع أدوات الذكاء الاصطناعي    </span>
                                    {(permissions as any).aiCredits > 0 && (
                                      <span className="text-xs text-primary">
                                        ({(permissions as any).aiCredits} كريديت/شهر)
                                      </span>
                                    )}
                                    {(permissions as any).aiCredits === 0 && (
                                      <span className="text-xs text-primary">
                                        (غير محدود)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-white">الذكاء الاصطناعي (AI)</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },

                        {
                          enabled: (permissions as any).canManageCustomers,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canManageCustomers ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">إدارة العملاء</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">إدارة العملاء</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canMarketServices,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canMarketServices ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">تسويق الخدمات</span>
                                    {(permissions as any).maxServices > 0 && (
                                      <span className="text-xs text-primary">
                                        ({(permissions as any).maxServices} خدمة)
                                      </span>
                                    )}
                                    {(permissions as any).maxServices === 0 && (
                                      <span className="text-xs text-primary">
                                        (غير محدود)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">تسويق الخدمات</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canManageEmployees,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canManageEmployees ? (
                                  <>
                                    {(permissions as any).maxEmployees > 0 && (
                                      <>
                                        <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                          <Check className="h-3 w-3 text-black font-bold" />
                                        </div>
                                        <span className="text-xs text-white">
                                          إدارة الموظفين
                                        </span>
                                        <span className="text-xs text-primary">
                                          ({(permissions as any).maxEmployees} موظف)
                                        </span>
                                      </>
                                    )}
                                    {(permissions as any).maxEmployees === 0 && (
                                      <span className="text-xs text-primary">
                                        (غير محدود)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-white">إدارة الموظفين</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canUseLiveChat,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {(permissions as any).canUseLiveChat ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white font-medium">ادارة التذاكر & لايف شات</span>
                                    {(permissions as any).canUseLiveChatAI ? (
                                      <span className="text-xs text-green-400">
                                        (مدعوم بالذكاء الاصطناعي
                                        {(permissions as any).liveChatAiResponses !== undefined && (
                                          <>
                                            {" - "}
                                            {(permissions as any).liveChatAiResponses === -1 || (permissions as any).liveChatAiResponses === 0 ? 'غير محدود' : `${(permissions as any).liveChatAiResponses} رد`}
                                          </>
                                        )}
                                        )
                                      </span>
                                    ) : (
                                      <span className="text-xs text-red-400">(غير مدعوم بالذكاء الاصطناعي)</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">ادارة التذاكر & لايف شات</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        
                        // Premium Features (Usually disabled in lower plans)
                        {
                          enabled: (permissions as any).canSallaIntegration,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canSallaIntegration ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-200"> سلة ويب هوك</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white line-through font-medium">سلة ويب هوك </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canUseEventsPlugin,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canUseEventsPlugin ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white font-medium"> Webhook + Api</span>
                                    {((permissions as any).eventsPerMonth ?? 0) > 0 ? (
                                      <span className="text-xs text-primary">
                                        ({(permissions as any).eventsPerMonth} حدث/شهر)
                                      </span>
                                    ) : (
                                      <span className="text-xs text-primary">
                                        (غير محدود)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">Webhook + Api</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canUseEventsPlugin,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canUseEventsPlugin ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white font-medium"> ربط ويبهوك مع اياب كلاود</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">ربط ويبهوك مع اياب كلاود</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        },
                        {
                          enabled: (permissions as any).canUseEventsPlugin,
                          render: () => (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {(permissions as any).canUseEventsPlugin ? (
                                  <>
                                    <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs text-white font-medium">ربط ويبهوك مع ووردبريس</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-full bg-red-500 p-1 w-4 h-4 flex items-center justify-center">
                                      <X className="h-3 w-3 text-black font-bold" />
                                    </div>
                                    <span className="text-xs font-medium line-through text-gray-200">ربط ويبهوك مع ووردبريس</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        }
                      ];

                      // Assign a fixed priority/order to each item to ensure relative order stability
                      const permissionItemsWithOrder = permissionItems.map((item, index) => ({ ...item, order: index }));

                      // Sort: 
                      // 1. Enabled items first (Top) vs Disabled (Bottom)
                      // 2. Then by original fixed order (Stable relative order)
                      const sortedPermissions = permissionItemsWithOrder.sort((a, b) => {
                        if (a.enabled === b.enabled) {
                          return a.order - b.order; // Keep same relative order
                        }
                        return a.enabled ? -1 : 1; // Enabled first
                      });

                      // Render sorted permissions
                      return sortedPermissions.map((item, idx) => (
                        <div key={idx}>
                          {item.render()}
                        </div>
                      ));
                    })()}
                  </div>

                 <div className="flex items-center justify-center">
                   <Button 
                    className="w-60 primary-button" 
                    variant={isHighlighted ? "default" : "secondary"}
                    onClick={() => openSubscriptionModal(plan)}
                  >
                    اشترك الآن
                  </Button>
                 </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      )}
    
      
    
      {/* Subscription Modal */}
      {selectedPlan && (
        <SubscriptionModal
          isOpen={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
          plan={selectedPlan}
          onSubscribe={handleSubscribe}
          token={token}
        />
      )}
    </div>
  );
}










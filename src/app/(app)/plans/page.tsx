"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPlans, type Plan, createSubscriptionRequest } from "@/lib/api";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useToast } from "@/components/ui/toast-provider";
import { CheckCircle, XCircle } from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const availablePlatforms = [
    { key: 'facebook', name: 'Facebook', icon: '👥' },
    { key: 'instagram', name: 'Instagram', icon: '📷' },
    { key: 'twitter', name: 'Twitter', icon: '𝕏' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { key: 'pinterest', name: 'Pinterest', icon: '📌' },
    { key: 'tiktok', name: 'TikTok', icon: '🎵' },
    { key: 'youtube', name: 'YouTube', icon: '▶️' }
  ];

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    listPlans(token)
      .then((res) => setPlans(res.plans.filter(plan => plan.isActive)))
      .catch((e) => setError(e.message))
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
    setSelectedPlan(plan);
    setSubscriptionModalOpen(true);
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
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
          <h1 className="text-2xl font-semibold">الباقات</h1>
          <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p>
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
          <h1 className="text-2xl font-semibold">الباقات</h1>
          <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">خطأ في تحميل الباقات: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">الباقات</h1>
        <p className="text-sm text-gray-600">اختر الباقة التي تناسب احتياجاتك. يمكنك الترقية في أي وقت.</p>
      </div>
      
      {plans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">لا توجد باقات متاحة في الوقت الحالي.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const { price, period } = formatPrice(plan.priceCents, plan.interval);
            const permissions = plan.permissions || {};
            const isHighlighted = index === 1; // Highlight the middle plan
            
            return (
              <Card key={plan.id} className={isHighlighted ? "border-gray-900" : undefined}>
                <CardHeader>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-semibold">{plan.name}</div>
                    <div className="text-2xl font-bold">
                      {price} <span className="text-sm font-normal text-gray-500">{period}</span>
                    </div>
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

                  {/* Permissions */}
                  <div className="space-y-2">
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
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    variant={isHighlighted ? "default" : "secondary"}
                    onClick={() => openSubscriptionModal(plan)}
                  >
                    اشترك الآن
                  </Button>
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
      
      <p className="text-xs text-gray-500">الدفع عبر USDT أو القسائم. يمكنك الإلغاء في أي وقت.</p>
    </div>
  );
}










"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPlans, type Plan, createSubscriptionRequest } from "@/lib/api";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useToast } from "@/components/ui/toast-provider";
import { Check, Sparkles, Zap, Shield, Rocket, Image as ImageIcon, Video, MessageSquare, Maximize, Scissors, Palette, User, RefreshCw, PenTool, Search, CheckCircle } from "lucide-react";
import Image from "next/image";

const toolMapping: { [key: string]: { name: string; icon: any } } = {
  'chat': { name: 'دردشة AI ذكية', icon: MessageSquare },
  'image_gen': { name: 'Nano Banana Pro 🍌', icon: ImageIcon },
  'video_gen': { name: 'توليد فيديوهات سينمائية بأحدث نماذج Veo 3', icon: Video },
  'video_motion': { name: 'تحريك الصور بأحدث نماذج Veo 3', icon: Video },
  'image_nano': { name: 'توليد صور سريعة', icon: Zap },
  'image_describe': { name: 'وصف وتحليل الصور', icon: Search },
  'image_bg_remove': { name: 'إزالة خلفية الصور', icon: Scissors },
  'image_restore': { name: 'ترميم الصور القديمة', icon: RefreshCw },
  'image_logo': { name: 'تصميم شعارات', icon: Palette },
  'image_edit': { name: 'تحرير الصور المتقدم', icon: PenTool },
  'image_product': { name: 'تصوير منتجات احترافية', icon: ImageIcon },
  'image_avatar': { name: 'إنشاء أفاتار شخصي', icon: User },
  'image_upscale': { name: 'تكبير وتحسين جودة الصور', icon: Maximize },
  'image_sketch': { name: 'تحويل الرسم اليدوي لصورة', icon: PenTool },
  'image_colorize': { name: 'تلوين الصور القديمة', icon: Palette },
  'video_long': { name: 'فيديو طويل متعدد المشاهد', icon: Video },
  'video_ugc': { name: 'فيديوهات UGC احترافية', icon: Video },
  'video_effects': { name: 'تأثيرات بصرية للفيديو', icon: Video },
  'video_lipsync': { name: 'مزامنة الشفاه (Lip Sync)', icon: MessageSquare },
  'video_resize': { name: 'تغيير أبعاد الفيديو', icon: Maximize },
  'video_upscale': { name: 'تحسين جودة الفيديو', icon: Maximize },
};

export default function AIPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    listPlans(token, 'ai')
      .then((res) => {
        setPlans(res.plans);
      })
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
      showSuccess('تم إرسال طلب تفعيل باقة الذكاء الاصطناعي بنجاح!', 'سيتم إضافة الكريديت إلى حسابك فور مراجعة الطلب.');
      return result;
    } catch (error: any) {
      showError('خطأ في إرسال الطلب', error.message);
      throw error;
    }
  };

  const openSubscriptionModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setSubscriptionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-xl animate-pulse flex flex-col items-center">
            <Sparkles className="w-12 h-12 mb-4 text-purple-400" />
            جاري تحميل عروض الذكاء الاصطناعي...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-semibold text-white">باقات شحن الذكاء الاصطناعي</h1>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
          <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl text-white font-medium mb-2">لا توجد باقات AI متاحة حالياً</h3>
          <p className="text-gray-400">ترقبوا عروضنا المميزة قريباً</p>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-wrap gap-6">
          {plans.map((plan) => {
            const permissions = plan.permissions || {};
            const aiCredits = (permissions as any)?.aiCredits || 0;
            const allowedTools = (permissions as any)?.allowedAITools || [];
            
            return (
              <Card key={plan.id} className="w-[500px] relative rounded-[35px] bg-gradient-to-br from-text-primary via-bg-secondry to-bg-secondry border-1 border-white/50">
                <CardHeader className="border-none">
                  <div className="relative">
                    <p className="text-7xl font-semibold text-white text-center text-shadow-bottom">
                        {plan.priceCents}
                        <span className="text-xs font-normal text-white">ريال</span>
                    </p>
                    <div className="text-xl font-semibold text-white text-center">{plan.name}</div>
                    <div className="text-2xl absolute top-0 left-0 font-bold text-primary">
                       <span className="text-sm font-bold text-white">فوري</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 border-t-1 border-white/50 rounded-[45px] bg-gradient-to-br from-bg-secondry via-bg-purple-700 to-bg-purple-500">
                    
                    <div className="text-center flex items-center justify-center ">
                        <div className="text-3xl font-bold text-white ">
                            {aiCredits === -1 ? 'غير محدود' : aiCredits.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-300 font-medium">كريديت  </div>
                    </div>

                    {/* Permissions Box - Styled exactly like standard plans */}
                    <div className="space-y-2 p-3 rounded-[35px] border-1 border-white/50 bg-text-primary/10">
                        {allowedTools.length > 0 ? (
                            allowedTools.map((toolKey: string) => {
                                const tool = toolMapping[toolKey];
                                if (!tool) return null;
                                return (
                                    <div key={toolKey} className="flex items-center gap-2">
                                        <div className="rounded-full bg-green-500 p-1 w-4 h-4 flex items-center justify-center">
                                            <Check className="h-3 w-3 text-black font-bold" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-200">{tool.name}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">لا توجد أدوات محددة</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center">
                        <Button 
                            className="w-60 primary-button" 
                            variant="default"
                            onClick={() => openSubscriptionModal(plan)}
                        >
                            اشحن الآن
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

"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  hasAIPlans?: boolean;
}

export function SubscriptionRequiredModal({ 
  isOpen, 
  onClose, 
  title = "اشتراك مطلوب",
  description = "تحتاج إلى اشتراك نشط للوصول إلى أدوات الذكاء الاصطناعي المتقدمة",
  hasAIPlans = false
}: SubscriptionRequiredModalProps) {
  const router = useRouter();

  const handleGoToPlans = () => {
    onClose();
    if (hasAIPlans) {
      router.push('/ask-ai/plans');
    } else {
      router.push('/plans');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/30 rounded-3xl p-0 overflow-hidden">
        {/* Close Button */}
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button> */}

        {/* Header with animated background */}
        <div className="relative p-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 animate-pulse" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-4 animate-bounce">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Features List */}
        <div className="px-8 pb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">أدوات AI متقدمة</p>
                <p className="text-gray-400 text-xs">توليد صور وفيديوهات احترافية</p>
              </div>
            </div>
            
            {/* <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">كريديت غير محدود</p>
                <p className="text-gray-400 text-xs">استخدم جميع الأدوات بلا قيود</p>
              </div>
            </div> */}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">دعم أولوية</p>
                <p className="text-gray-400 text-xs">استجابة سريعة ودعم متميز</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-0 space-y-3">
          <Button
            onClick={handleGoToPlans}
            className="primary-button w-full"
          >
            <div className="flex items-center gap-5">
              <span>اشترك الآن</span>
            <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
            </div>
          </Button>
          
        
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-pulse" />
      </DialogContent>
    </Dialog>
  );
}
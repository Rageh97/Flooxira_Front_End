"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Upload,
  Download, 
  Trash2,
  Eraser,
  Zap,
  Loader2,
  ArrowRight,
  History,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIImage, listPlans, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

interface ProcessedImage {
  id: string;
  url: string;
  originalUrl?: string;
  timestamp: string;
  operation: string;
}

export default function BackgroundRemovalPage() {
  const [token, setToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_bg_remove_history");
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem("ai_bg_remove_history", JSON.stringify(history));
  }, [history]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error) { console.error("Failed to load stats:", error); }
  };

  const checkAIPlans = async () => {
    try {
      const response = await listPlans(token, 'ai');
      setHasAIPlans(response.plans && response.plans.length > 0);
    } catch (error: any) {
      console.error("Failed to check AI plans:", error);
      setHasAIPlans(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "يرجى اختيار صورة أولاً!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await processAIImage(token, {
        operation: 'bg-remove',
        imageUrl: previewUrl
      });

      const newImage: ProcessedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        operation: 'bg-remove'
      };

      setHistory([newImage, ...history]);
      setSelectedResult(newImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم إزالة الخلفية بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء المعالجة");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { showError("خطأ", "تعذر التحميل"); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 text-white" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                إزالة خلفية الصور
              </span>
            </h1>
          </div>

          {stats && (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/5">
               <Zap size={14} className="text-amber-400 fill-amber-400" />
               <span className="text-sm font-bold font-mono">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-300">الصورة الأصلية</label>
              <div 
                className={clsx(
                  "relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group",
                  previewUrl ? "border-purple-500/50" : "border-white/10 hover:border-purple-500/30 hover:bg-white/5"
                )}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-purple-400 mb-2" size={32} />
                      <span className="text-xs font-bold">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-4 group-hover:text-purple-400 transition-colors" size={40} />
                    <span className="text-sm text-gray-400 font-medium">اضغط لرفع صورة</span>
                  </>
                )}
                <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري العزل..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Eraser />}
              size="lg"
            >
              إزالة الخلفية الآن
            </GradientButton>
          </div>

          <div className="bg-gradient-to-br from-purple-900/10 to-transparent rounded-3xl p-6 border border-white/5">
             <h3 className="text-sm font-bold mb-2">دقة متناهية</h3>
             <p className="text-xs text-gray-400 leading-relaxed">
               خوارزمياتنا قادرة على تمييز الشعر والتفاصيل الدقيقة بدقة عالية، مما يوفر لك صوراً جاهزة للتصميم بمساحات شفافة مثالية.
             </p>
          </div>
        </aside>

        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              {selectedResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex-1 rounded-[40px] bg-[#0a0c10] border border-white/10 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] opacity-10" />
                  <div className="relative h-full w-full flex items-center justify-center p-8">
                    <img src={selectedResult.url} className="max-h-[600px] rounded-xl shadow-2xl relative z-10" />
                  </div>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl z-20">
                    <Button 
                      onClick={() => downloadImage(selectedResult.url, `no-bg-${selectedResult.id}.png`)}
                      className="rounded-full bg-purple-600 hover:bg-purple-700 h-10 px-6 font-bold"
                    >
                      <Download size={16} className="ml-2" /> تحميل بدون خلفية
                    </Button>
                  </div>
                  <BorderBeam duration={6} colorFrom="#A855F7" colorTo="#EC4899" />
                </motion.div>
              ) : isProcessing ? (
                <AILoader />
              ) : (
                <div className="flex-1 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center">
                  <Eraser size={48} className="text-gray-700 mb-6" />
                  <h3 className="text-xl font-bold mb-2">في انتظار إبداعك</h3>
                  <p className="text-gray-500 max-w-sm">ارفع صورة وسنقوم بعزل العنصر الأساسي عن الخلفية في ثوانٍ معدودة.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {history.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2"><History size={18} className="text-purple-400" /> النتائج السابقة</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedResult(item)}
                    className={clsx(
                      "aspect-square rounded-xl cursor-pointer overflow-hidden border transition-all relative",
                      selectedResult?.id === item.id ? "border-purple-500 ring-2 ring-purple-500/20 shadow-lg" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] opacity-5" />
                    <img src={item.url} className="w-full h-full object-cover relative z-10" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لإزالة الخلفية"
        description="للاستفادة من تقنية إزالة الخلفية بدقة عالية وعزل العناصر بشكل احترافي مع الحفاظ على التفاصيل الدقيقة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

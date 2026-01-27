"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Upload,
  Download, 
  Trash2,
  Maximize2,
  Zap,
  Loader2,
  ArrowRight,
  History,
  Image as ImageIcon,
  X,
  RefreshCw
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

export default function UpscalePage() {
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
      const savedHistory = localStorage.getItem("ai_upscale_history");
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
    if (history.length > 0) localStorage.setItem("ai_upscale_history", JSON.stringify(history));
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
      if (selectedFile) {
        const maxSize = 5 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
          setIsProcessing(false);
          return showError("تنبيه", "حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(selectedFile.type)) {
          setIsProcessing(false);
          return showError("تنبيه", "نوع الصورة غير مدعوم. يرجى استخدام JPG, PNG, أو WebP");
        }
      }

      const response = await processAIImage(token, {
        operation: 'upscale',
        imageUrl: previewUrl,
        prompt: "Highly detailed, sharp, 4k, professional photography"
      });

      const newImage: ProcessedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        operation: 'upscale'
      };

      setHistory([newImage, ...history]);
      setSelectedResult(newImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم تحسين جودة الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء المعالجة");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_upscale_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearHistory = () => {
    if (!confirm("هل تريد مسح السجل بالكامل؟")) return;
    setHistory([]);
    localStorage.removeItem("ai_upscale_history");
    setSelectedResult(null);
    showSuccess("تم مسح السجل بالكامل.");
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
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden font-sans selection:bg-blue-500/30" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 shadow-2xl">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 text-white rotate-180" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                تحسين جودة الصور
              </span>
            </h1>
          </div>
          {stats && (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 font-mono">
               <Zap size={14} className="text-amber-400 fill-amber-400" />
               <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 text-right uppercase tracking-widest">اختر الصورة</label>
              <div 
                className={clsx(
                  "relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group/upload",
                  previewUrl ? "border-blue-500/50" : "border-white/10 hover:border-blue-500/30 bg-white/5"
                )}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-blue-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-4 group-hover/upload:text-blue-400 transition-colors" size={40} />
                    <span className="text-sm">اضغط لرفع صورة</span>
                    <span className="text-[10px] text-gray-600 mt-2">JPG, PNG, WebP (Max 5MB)</span>
                  </>
                )}
                <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التحسين..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Sparkles />}
              size="lg"
            >
              ابدأ التحسين
            </GradientButton>
          </div>

          <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 shadow-inner">
             <h4 className="text-sm font-bold text-blue-400 mb-2 text-right">كيف يعمل؟</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">
               يستخدم أحدث تقنيات الذكاء الاصطناعي لإعادة بناء التفاصيل المفقودة، إزالة التشويش، وزيادة دقة الصورة حتى 4 أضعاف مع الحفاظ على الملامح الطبيعية.
             </p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                    <div className="absolute top-4 left-4 z-30">
                        <button 
                            onClick={() => setSelectedResult(null)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <img src={selectedResult.url} className="max-h-[600px] rounded-2xl shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                    <div className="mt-8 flex items-center gap-3">
                        <Button onClick={() => downloadImage(selectedResult.url, `upscaled-${selectedResult.id}.png`)} className="rounded-full bg-blue-600 hover:bg-blue-700 h-10 px-8 font-bold transition-all hover:scale-105 shadow-lg shadow-blue-600/30"><Download size={16} className="ml-2" /> حفظ النتيجة</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => deleteFromHistory(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam />
                  </motion.div>
                ) : isProcessing ? (
                  <AILoader />
                ) : (
                  <div className="flex flex-col items-center text-center group">
                     <Maximize2 size={80} className="text-blue-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                     <h3 className="text-2xl font-bold text-white mb-2">وضوح فائق الدقة</h3>
                     <p className="text-sm text-gray-500">ارفع الصورة التي تريد تحسينها وسنقوم بمضاعفة جودتها بذكاء.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-blue-500" /> العمليات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
                   {history.map(h => (
                      <div key={h.id} className="relative group shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-square rounded-2xl border-2 transition-all overflow-hidden shadow-lg cursor-pointer", selectedResult?.id === h.id ? "border-blue-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <img src={h.url} className="w-full h-full object-cover" />
                        </div>
                        <button
                           onClick={(e) => { e.stopPropagation(); deleteFromHistory(h.id); }}
                           className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
                        >
                           <X size={10} />
                        </button>
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
        title="اشتراك مطلوب لتحسين الصور"
        description="للاستفادة من تقنية تحسين الصور بالذكاء الاصطناعي، تحتاج إلى اشتراك نشط. احصل على صور عالية الجودة بدقة مذهلة!"
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

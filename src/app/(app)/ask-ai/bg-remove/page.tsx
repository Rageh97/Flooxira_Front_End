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
      setStats(prev => prev ? { ...prev, remainingCredits: response.remainingCredits } : null);
      
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

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_bg_remove_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const handleClearAll = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة؟")) {
      setHistory([]);
      setSelectedResult(null);
      localStorage.removeItem("ai_bg_remove_history");
      showSuccess("تم حذف جميع الأعمال!");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden font-sans selection:bg-purple-500/30" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">إزالة خلفية الصور</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 text-right uppercase tracking-widest">الصورة الأصلية</label>
              <div 
                className={clsx(
                  "relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group/upload",
                  previewUrl ? "border-purple-500/50" : "border-white/10 hover:border-purple-500/30 bg-white/5"
                )}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-purple-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-4 group-hover/upload:text-purple-400 transition-colors" size={40} />
                    <span className="text-sm">اضغط لرفع صورة</span>
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

          <div className="p-6 bg-purple-500/5 rounded-2xl border border-white/10 shadow-inner">
             <h4 className="text-sm font-bold text-purple-400 mb-2 text-right">دقة متناهية</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">
               خوارزمياتنا قادرة على تمييز الشعر والتفاصيل الدقيقة بدقة عالية، مما يوفر لك صوراً جاهزة للتصميم بمساحات شفافة مثالية.
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

                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] opacity-10" />
                    <img src={selectedResult.url} className="max-h-[600px] rounded-2xl shadow-3xl transition-transform duration-500 hover:scale-[1.01] relative z-10" />
                    <div className="mt-8 flex items-center gap-3 relative z-20">
                        <Button onClick={() => downloadImage(selectedResult.url, `no-bg-${selectedResult.id}.png`)} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 px-8 transition-all hover:scale-105 shadow-lg shadow-purple-600/30"><Download size={16} className="ml-2" /> تحميل بدون خلفية</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam colorFrom="#A855F7" colorTo="#EC4899" />
                  </motion.div>
                ) : isProcessing ? (
                  <AILoader />
                ) : (
                  <div className="flex flex-col items-center text-center group">
                     <Eraser size={80} className="text-purple-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                     <h3 className="text-2xl font-bold text-white mb-2">عزل العناصر بذكاء</h3>
                     <p className="text-sm text-gray-500">ارفع صورة وسنقوم بحذف الخلفية بدقة مذهلة خلال ثوانٍ.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-purple-500" /> العمليات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
                   {history.map(h => (
                      <div key={h.id} className="relative group shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-square rounded-2xl border-2 transition-all overflow-hidden shadow-lg cursor-pointer bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-white/5", selectedResult?.id === h.id ? "border-purple-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <img src={h.url} className="w-full h-full object-cover" />
                        </div>
                        <button
                           onClick={(e) => { e.stopPropagation(); handleDeleteItem(h.id); }}
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
        title="اشتراك مطلوب لإزالة الخلفية"
        description="للاستفادة من تقنية إزالة الخلفية بدقة عالية وعزل العناصر بشكل احترافي مع الحفاظ على التفاصيل الدقيقة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

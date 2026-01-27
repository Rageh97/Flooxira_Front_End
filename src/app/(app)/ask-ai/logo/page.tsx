"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  LayoutTemplate,
  Loader2,
  ArrowRight,
  History,
  Palette,
  Layers,
  Zap,
  X,
  Trash2,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, generateAILogo, listPlans, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
}

export default function LogoMakerPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_logo_history");
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
    if (history.length > 0) localStorage.setItem("ai_logo_history", JSON.stringify(history));
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return showError("تنبيه", "ادخل اسم الشركة أو فكرة الشعار!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await generateAILogo(token, {
        prompt: prompt.trim(),
        aspectRatio: "1:1",
      });

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
      };

      setHistory([newImage, ...history]);
      setSelectedImage(newImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم تصميم الشعار بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا التصميم؟")) return;
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_logo_history", JSON.stringify(newHistory));
    if (selectedImage?.id === id) setSelectedImage(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearAllHistory = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع التصميمات؟")) {
      setHistory([]);
      localStorage.removeItem("ai_logo_history");
      setSelectedImage(null);
      showSuccess("تم إخلاء سجل التصميمات كلياً!");
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
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden selection:bg-indigo-500/30 font-sans" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 shadow-2xl">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 rotate-180 text-white" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                صانع الشعارات الاحترافي
              </span>
            </h2>
          </div>
          {stats && (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 font-mono">
               <Zap size={14} className="text-indigo-400 fill-indigo-400" />
               <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-indigo-400 justify-end">
                    <label className="text-sm font-bold">وصف العلامة التجارية</label>
                    <Palette size={18} />
                 </div>
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="مثال: شعار لشركة تقنية متطورة، يرمز للنمو والابتكار، ألوان زرقاء ملكية..."
                   className="w-full min-h-[160px] bg-white/5 rounded-2xl p-5 text-white placeholder:text-gray-600 outline-none border border-transparent focus:border-indigo-500/30 transition-all resize-none leading-relaxed text-right"
                   dir="rtl"
                 />
              </div>
              
              <GradientButton 
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                loading={isGenerating}
                loadingText="جاري التصميم..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<LayoutTemplate />}
                size="lg"
              >
                صمم شعاري الآن
              </GradientButton>
           </div>

           <div className="bg-gradient-to-br from-indigo-900/10 to-transparent rounded-3xl p-6 border border-white/5 shadow-inner">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 justify-end text-indigo-400">
                 <span>نصائح لنتائج أفضل</span>
                 <Sparkles size={16} />
              </h3>
              <ul className="text-xs text-gray-400 space-y-2 leading-relaxed text-right">
                 <li>• حدد نمط الشعار (مينيمال، كلاسيكي، تجريدي)</li>
                 <li>• اذكر الألوان المفضلة بوضوح</li>
                 <li>• صف الرمز الذي تريده (مثلاً: ريشة، جبل، مكوك)</li>
              </ul>
           </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="relative min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                 {selectedImage ? (
                    <motion.div
                       key="result"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="relative flex-1 rounded-[40px] bg-[#0a0c10] border border-white/10 overflow-hidden group flex items-center justify-center p-12"
                    >
                       <div className="absolute top-4 left-4 z-30">
                          <button 
                             onClick={() => setSelectedImage(null)}
                             className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                          >
                             <X size={14} />
                          </button>
                       </div>

                       <img src={selectedImage.url} className="max-h-[500px] w-auto rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-500 hover:scale-[1.02]" />
                       <div className="absolute inset-x-0 bottom-10 flex justify-center items-center gap-3 opacity-0 group-hover/result:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button 
                             onClick={() => downloadImage(selectedImage.url, `logo-${selectedImage.id}.png`)}
                             className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-10 px-8 font-bold text-white transition-all hover:scale-105"
                          >
                             <Download size={16} className="ml-2" /> تحميل الشعار
                          </Button>
                          <Button 
                             variant="ghost" 
                             size="icon"
                             className="rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 h-10 w-10 border border-red-500/20"
                             onClick={(e) => deleteFromHistory(selectedImage.id, e)}
                          >
                             <Trash2 size={18} />
                          </Button>
                       </div>
                       <BorderBeam duration={8} colorFrom="#6366F1" colorTo="#3B82F6" />
                    </motion.div>
                 ) : isGenerating ? (
                    <AILoader />
                 ) : (
                    <div className="flex-1 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center group translate-y-0 hover:-translate-y-2 transition-transform duration-500">
                       <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-all border border-indigo-500/20 shadow-xl shadow-indigo-500/5 animate-pulse">
                          <LayoutTemplate size={40} className="text-indigo-400" />
                       </div>
                       <h3 className="text-2xl font-bold mb-3 text-white">هويتك البصرية تبدأ هنا</h3>
                       <p className="text-gray-500 max-w-sm">صف رؤيتك لعلامتك التجارية وسنقوم بتحويلها إلى شعار احترافي يعكس قيم عملك.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>

           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                      <History size={14} className="text-indigo-500" /> أرشيف التصميمات ({history.length})
                   </h4>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={clearAllHistory}
                     className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors"
                   >
                     مسح الكل
                   </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
                   {history.map(img => (
                      <div 
                         key={img.id}
                         onClick={() => setSelectedImage(img)}
                         className={clsx(
                            "relative aspect-square rounded-2xl cursor-pointer overflow-hidden border transition-all group shadow-lg",
                            selectedImage?.id === img.id ? "border-indigo-500 scale-110 z-10" : "border-white/5 opacity-50 hover:opacity-100"
                         )}
                      >
                         <img src={img.url} className="w-full h-full object-cover" />
                         <button
                           onClick={(e) => deleteFromHistory(img.id, e)}
                           className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
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
        title="اشتراك مطلوب لتصميم الشعارات"
        description="للاستفادة من تقنية تصميم الشعارات الاحترافية وإنشاء هوية بصرية مميزة لعلامتك التجارية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

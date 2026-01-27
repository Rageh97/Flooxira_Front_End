"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, Droplets, 
  Loader2, ArrowRight, Zap, History, RefreshCw, X, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIImage, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { listPlans } from "@/lib/api";

export default function ColorizePage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_colorize_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { 
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);
  useEffect(() => { localStorage.setItem("ai_colorize_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    try {
      const res = await getAIStats(token);
      setStats(res.stats);
    } catch (e) {
      console.error(e);
    }
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

  const handleProcess = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع صورة أبيض وأسود أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIImage(token, {
        operation: 'colorize',
        imageUrl: previewUrl,
        prompt: "Realistic natural colors, historical accuracy, vibrant and high quality"
      });
      const newItem = { id: Date.now().toString(), url: res.imageUrl, original: previewUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      await loadStats();
      showSuccess("تم تلوين الصورة بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_colorize_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const handleClearAll = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة؟")) {
      setHistory([]);
      setSelectedResult(null);
      localStorage.removeItem("ai_colorize_history");
      showSuccess("تم حذف جميع الأعمال!");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">تلوين الصور القديمة</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-blue-400" /> <span className="text-sm font-bold font-mono">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-right">ارفع صورة أبيض وأسود</label>
               <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/30 transition-all bg-white/5 group" onClick={() => document.getElementById('file-c')?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" /> : <Droplets className="text-gray-700 group-hover:text-blue-400" size={48} />}
               </div>
               <input id="file-c" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التلوين..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Droplets />}
              size="lg"
            >
              ابدأ التلوين الآن
            </GradientButton>
          </div>
          
          <div className="p-6 bg-blue-500/5 rounded-[24px] border border-blue-500/10 space-y-3">
             <h4 className="text-sm font-bold text-blue-400 mb-2">أعد الحياة لذكرياتك</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">حوّل الصور التاريخية أو العائلية القديمة الـ (B&W) إلى صور مفعمة بالألوان الطبيعية بدقة مذهلة تحاكي الواقع.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                    {/* Close Button */}
                    <div className="absolute top-0 left-0 z-30">
                        <button 
                            onClick={() => setSelectedResult(null)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="relative w-full overflow-hidden rounded-3xl shadow-3xl">
                       <img src={selectedResult.url} className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 hover:scale-[1.01]" />
                       <div className="absolute top-4 right-4 bg-blue-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">تم التلوين</div>
                    </div>
                    
                    <div className="mt-8 flex gap-4">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-white text-black font-bold h-10 px-8 hover:scale-105 transition-all"><Download className="mr-2 h-4 w-4" /> تحميل الصورة الملونة</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam colorFrom="#34D399" colorTo="#3B82F6" />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : (
                  <div className="text-center group">
                     <Droplets size={80} className="text-blue-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                     <h3 className="text-2xl font-bold mb-2 text-white">في انتظار ذكرياتك</h3>
                     <p className="text-sm text-gray-500">ارفع الصورة وسنقوم بتحليل الألوان وإعادتها بشكل طبيعي.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                     <History size={14} className="text-blue-500" /> أرشيف التلوين ({history.length})
                   </h4>
                   <Button 
                     onClick={handleClearAll}
                     variant="ghost"
                     size="sm"
                     className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 rounded-full text-xs"
                   >
                     <Trash2 className="h-4 w-4 ml-2" />
                     حذف الكل
                   </Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                   {history.map(img => (
                      <div key={img.id} className="relative group flex-shrink-0" onClick={() => setSelectedResult(img)}>
                        <div 
                          className={clsx("w-24 aspect-square rounded-xl cursor-pointer border-2 transition-all overflow-hidden shadow-lg", selectedResult?.id === img.id ? "border-blue-500 scale-110" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                          <img src={img.url} className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(img.id); }}
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
        title="اشتراك مطلوب لتلوين الصور"
        description="للاستفادة من تقنية تلوين الصور القديمة بالألوان الطبيعية وإعادة الحياة لذكرياتك التاريخية بدقة مذهلة, تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Move, Trash2, X, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIVideo, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { listPlans } from "@/lib/api";

export default function MotionPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
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
      const saved = localStorage.getItem("ai_motion_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_motion_history", JSON.stringify(history)); }, [history]);

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

  const handleDeleteHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
    showSuccess("تم الحذف بنجاح!");
  };

  const clearHistory = () => {
    if (!confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة؟")) return;
    setHistory([]);
    setSelectedResult(null);
    localStorage.removeItem("ai_motion_history");
    showSuccess("تم مسح السجل بالكامل.");
  };

  const handleProcess = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع صورة أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'motion',
        inputUrl: previewUrl,
        prompt: prompt.trim() || "Natural cinematic motion, zoom in slowly"
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl, original: previewUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إضافة الحركة بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 rotate-180 text-white" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">محاكاة الحركة (Image to Video)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-right">الصورة الأصلية</label>
               <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload" onClick={() => document.getElementById('file-m')?.click()}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                      <div className="absolute inset-x-0 flex flex-col items-center justify-center">
                        <ImageIcon className="text-blue-400 mb-2" size={32} />
                        <span className="text-xs font-bold text-white">تغيير الصورة</span>
                      </div>
                    </>
                  ) : <ImageIcon className="text-gray-700 group-hover/upload:text-blue-400" size={48} />}
               </div>
               <input id="file-m" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 block text-right">طبيعة الحركة (اختياري)</label>
               <textarea 
                 value={prompt} 
                 onChange={e => setPrompt(e.target.value)} 
                 placeholder="مثال: اجعل الأمواج تتحرك، حرك السحب ببطء، زووم سينمائي على الوجه..." 
                 className="w-full h-24 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-blue-500/30 transition-all text-right"
                 dir="rtl"
               />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التحرير..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Move />}
              size="lg"
            >
              إضافة حركة
            </GradientButton>
          </div>
          
          <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 shadow-inner">
             <h4 className="text-sm font-bold text-blue-400 mb-2 text-right">كيف تعمل تقنية التحريك؟</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">ارفع صورة ثابتة وسيقوم الذكاء الاصطناعي بتحليل العناصر داخلها وإضافة حركة واقعية (Cinematic Motion) لتحويلها إلى فيديو قصير مبهر.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                    {/* Close Button */}
                    <div className="absolute top-4 left-4 z-30">
                        <button 
                            onClick={() => setSelectedResult(null)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] shadow-3xl border border-white/10 transition-transform duration-500 hover:scale-[1.01]" />
                    <div className="mt-8 flex gap-4">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-8 transition-all hover:scale-105 shadow-lg shadow-indigo-600/30"><Download className="ml-2 h-4 w-4" /> تحميل الفيديو</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteHistory(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam duration={6} colorFrom="#3b82f6" colorTo="#6366f1" />
                  </motion.div>
                ) : isProcessing ? (
                  <AILoader />
                ) : (
                  <div className="flex flex-col items-center text-center group">
                     <Move size={80} className="text-blue-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                     <h3 className="text-2xl font-bold text-white mb-2">لبث الروح في صورك</h3>
                     <p className="text-sm text-gray-500">ارفع صورة ثابتة لنحولها إلى فيديو سينمائي مذهل بلمسة ذكاء.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-blue-500" /> الفيديوهات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2">
                   {history.map(h => (
                      <div key={h.id} className="relative group shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-square rounded-2xl border-2 transition-all overflow-hidden shadow-lg cursor-pointer", selectedResult?.id === h.id ? "border-blue-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <video src={h.url} className="w-full h-full object-cover" />
                        </div>
                        <button
                           onClick={(e) => { e.stopPropagation(); handleDeleteHistory(h.id); }}
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

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لمحاكاة الحركة"
        description="للاستفادة من تقنية تحويل الصور الثابتة لفيديوهات متحركة وإضافة الحركة السينمائية الواقعية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

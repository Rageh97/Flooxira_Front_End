"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, Package, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Wand2, Trash2, X, RefreshCw,
  HistoryIcon
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

export default function ProductModelPage() {
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
      const saved = localStorage.getItem("ai_product_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_product_history", JSON.stringify(history)); }, [history]);

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
    
    if (!previewUrl || !prompt.trim()) return showError("تنبيه", "ارفع صورة منتج واكتب وصفاً للبيئة المحيطة!");
    setIsProcessing(true);
    try {
      const res = await processAIImage(token, {
        operation: 'product',
        imageUrl: previewUrl,
        prompt: prompt.trim()
      });
      const newItem = { id: Date.now().toString(), url: res.imageUrl, prompt: prompt.trim() };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إنشاء مشهد المنتج!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_product_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearHistory = () => {
    if (!confirm("هل تريد مسح السجل بالكامل؟")) return;
    setHistory([]);
    localStorage.removeItem("ai_product_history");
    setSelectedResult(null);
    showSuccess("تم مسح السجل بالكامل.");
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">نماذج المنتجات الذكية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-blue-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 block text-right">صورة المنتج</label>
               <div className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload" onClick={() => document.getElementById('file-p')?.click()}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-contain opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                      <div className="absolute inset-x-0 flex flex-col items-center justify-center">
                        <Package className="text-blue-400 mb-2" size={32} />
                        <span className="text-xs font-bold text-white">تغيير الصورة</span>
                      </div>
                    </>
                  ) : <Package className="text-gray-600 group-hover:text-blue-400" size={32} />}
               </div>
               <input id="file-p" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 block text-right">وصف البيئة المحيطة</label>
               <textarea 
                 value={prompt} 
                 onChange={e => setPrompt(e.target.value)} 
                 placeholder="مثال: على طاولة خشبية فخمة، إضاءة سينمائية من الخلف، خلفية ضبابية لمطبخ عصري..." 
                 className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-blue-500/30 transition-all text-right" 
                 dir="rtl"
               />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl || !prompt.trim()}
              loading={isProcessing}
              loadingText="جاري التجهيز..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Wand2 />}
              size="lg"
            >
              توليد المشهد
            </GradientButton>
          </div>

          <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 shadow-inner">
             <h4 className="text-sm font-bold text-blue-400 mb-2 text-right">عرض احترافي</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">حوّل صور منتجاتك العادية إلى صور إعلانية احترافية. صِف المكان الذي تريد وضع المنتج فيه وسيقوم الذكاء الاصطناعي بدمجه بإضاءة وظلال واقعية.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
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

                    <img src={selectedResult.url} className="max-h-[600px] rounded-2xl shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                    <div className="mt-8 flex items-center gap-3">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="mr-2 h-4 w-4" /> تحميل النتيجة</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => deleteFromHistory(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam colorFrom="#3B82F6" colorTo="#2DD4BF" />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : (
                  <div className="text-center group">
                     <Package size={100} className="text-blue-500/5 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                     <h3 className="text-2xl font-bold text-white mb-2">استديو تصوير المنتجات</h3>
                     <p className="text-sm text-gray-500">ارفع صورة المنتج وصف البيئة المحيطة لنصنع لك مشهداً احترافياً.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-blue-500" /> العمليات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                   {history.map(h => (
                      <div key={h.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer shadow-lg" onClick={() => setSelectedResult(h)}>
                        <img src={h.url} className={clsx("w-full h-full object-cover transition-all", selectedResult?.id === h.id ? "scale-110 opacity-100 border-2 border-blue-500" : "opacity-50 hover:opacity-100")} />
                        <button 
                           onClick={(e) => deleteFromHistory(h.id, e)}
                           className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
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
        title="اشتراك مطلوب لنماذج المنتجات"
        description="للاستفادة من تقنية عرض المنتجات في بيئات احترافية وإنشاء صور تسويقية عالية الجودة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

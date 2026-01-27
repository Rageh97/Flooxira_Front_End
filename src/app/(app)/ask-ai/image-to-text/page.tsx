"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Copy, Check, 
  Loader2, ArrowRight, Zap, Image as ImageIcon, Search, History, X, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, describeAIImage, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { listPlans } from "@/lib/api";

export default function ImageToTextPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_describe_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_describe_history", JSON.stringify(history)); }, [history]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع صورة أولاً!");
    setIsAnalyzing(true);
    try {
      const res = await describeAIImage(token, previewUrl);
      setDescription(res.description);
      const newItem = { id: Date.now().toString(), url: previewUrl, text: res.description };
      setHistory([newItem, ...history]);
      showSuccess("تم تحليل الصورة بنجاح!");
      if (res.remainingCredits !== undefined) {
         setStats(prev => prev ? { ...prev, remainingCredits: res.remainingCredits } : null);
      }
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsAnalyzing(false); }
  };

  const copyToClipboard = () => {
    if (!description) return;
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess("تم النسخ!");
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا التحليل؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_describe_history", JSON.stringify(newHistory));
    if (description === history.find(h => h.id === id)?.text) {
      setDescription(null);
      setPreviewUrl(null);
    }
    showSuccess("تم الحذف بنجاح!");
  };

  const handleClearAll = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة؟")) {
      setHistory([]);
      setDescription(null);
      setPreviewUrl(null);
      localStorage.removeItem("ai_describe_history");
      showSuccess("تم حذف جميع الأعمال!");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">تحويل الصورة إلى نص (Prompt Engineering)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-teal-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-right">الصورة المراد تحليلها</label>
               <div 
                  className={clsx(
                    "relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all bg-white/5 group/upload",
                    previewUrl ? "border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.1)]" : "border-white/10 hover:border-teal-500/30"
                  )}
                  onClick={() => document.getElementById('file-desc')?.click()}
               >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-contain opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                      <div className="absolute inset-x-0 flex flex-col items-center justify-center">
                        <ImageIcon className="text-teal-400 mb-2" size={32} />
                        <span className="text-xs font-bold text-white">تغيير الصورة</span>
                      </div>
                    </>
                  ) : (
                    <Upload className="text-gray-700 group-hover/upload:text-teal-400" size={48} />
                  )}
               </div>
               <input id="file-desc" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            </div>

            <GradientButton 
               onClick={handleAnalyze}
               disabled={!previewUrl}
               loading={isAnalyzing}
               loadingText="جاري التحليل..."
               loadingIcon={<Loader2 className="animate-spin" />}
               icon={<Search />}
               size="lg"
            >
              استخراج الوصف (Prompt)
            </GradientButton>
          </div>

          <div className="p-6 bg-teal-500/5 rounded-[24px] border border-white/5 space-y-3">
             <h4 className="text-sm font-bold text-teal-400 mb-1 flex items-center gap-2 italic text-right"><Sparkles size={16} /> هندسة الأوامر الذكية</h4>
             <p className="text-xs text-gray-400 leading-relaxed text-right">ارفع أي صورة تعجبك وسيقوم الذكاء الاصطناعي باستخراج وصف دقيق جداً (Prompt) يمكنك استخدامه لإعادة توليد صور مشابهة أو تعديلها.</p>
          </div>
        </aside>

        <section className="lg:col-span-12 xl:col-span-8 space-y-6">
           <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                 {description ? (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                        {/* Close Button */}
                        <div className="absolute top-0 left-0 z-30">
                          <button 
                            onClick={() => {setDescription(null); setPreviewUrl(null);}}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                          >
                            <X size={14}/>
                          </button>
                        </div>

                       <div className="bg-white/5 rounded-3xl p-8 border border-white/5 relative group w-full shadow-2xl">
                          <h3 className="text-teal-400 font-bold mb-4 flex items-center gap-2 text-right justify-end">الوصف المستخرج: <ImageIcon size={18} /></h3>
                          <div className="relative">
                            <p className="text-gray-300 leading-relaxed text-lg font-medium font-sans ltr text-left dir-ltr selection:bg-teal-500/30 overflow-y-auto max-h-[400px] custom-scrollbar p-4 bg-black/20 rounded-2xl border border-white/5">
                                {description}
                            </p>
                            <Button 
                                onClick={copyToClipboard} 
                                className="absolute top-2 right-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white h-12 w-12 p-0 border border-white/10"
                                title="نسخ الوصف"
                            >
                                {copied ? <Check className="text-white" size={20} /> : <Copy size={20} />}
                            </Button>
                          </div>
                          <div className="mt-8 flex items-center gap-3 justify-center">
                             <Button variant="ghost" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-10 px-6" onClick={() => {setDescription(null); setPreviewUrl(null);}}><RefreshCw size={16} className="ml-2" /> تجربة صورة أخرى</Button>
                          </div>
                          <BorderBeam colorFrom="#14B8A6" colorTo="#10B981" />
                       </div>
                    </motion.div>
                 ) : isAnalyzing ? <AILoader /> : (
                    <div className="text-center group">
                       <Search size={80} className="text-teal-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                       <h3 className="text-2xl font-bold mb-2 text-white">أسرار الصورة بانتظارك</h3>
                       <p className="text-sm text-gray-500 max-w-sm mx-auto">ارفع صورة لنكتشف معاً سحر الكلمات الكامنة خلفها.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-teal-500" /> عمليات التحليل السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                   {history.map(item => (
                      <div 
                         key={item.id} 
                         onClick={() => {
                            setPreviewUrl(item.url);
                            setDescription(item.text);
                         }} 
                         className={clsx(
                           "aspect-square rounded-2xl cursor-pointer border-2 transition-all overflow-hidden relative group",
                           previewUrl === item.url && description === item.text ? "border-teal-500 ring-4 ring-teal-500/10 scale-105" : "border-white/5 opacity-50 hover:opacity-100"
                         )}
                      >
                         <img src={item.url} className="w-full h-full object-cover" />
                         <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[8px] text-white truncate line-clamp-1">{item.text}</p>
                         </div>
                         <button
                           onClick={(e) => handleDeleteItem(item.id, e)}
                           className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
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
        title="اشتراك مطلوب لتحليل الصور"
        description="للاستفادة من تقنية استخراج الأوصاف من الصور وتحويلها إلى نصوص دقيقة يمكن استخدامها في هندسة الأوامر، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Copy, Check, 
  Loader2, ArrowRight, Zap, Image as ImageIcon, Search, History, X, Trash2,
  RefreshCw, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  describeAIImage, 
  listPlans, 
  getAIHistory,
  deleteAIHistoryItem,
  clearAIHistory,
  type AIStats, 
  type AIHistoryItem
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

import AskAIToolHeader from "@/components/AskAIToolHeader";

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
  const [showSettings, setShowSettings] = useState(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const response = await getAIHistory(token, 'IMAGE');
      // Filter for describe operations only
      const mappedHistory: any[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'describe')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          text: item.outputText || "",
        }));
      setHistory(mappedHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  useEffect(() => { 
    if (token) {
      loadStats();
      checkAIPlans();
      loadHistory();
    }
  }, [token]);


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
      const newItem = { 
        id: (res as any).historyId?.toString() || Date.now().toString(), 
        url: previewUrl, 
        text: res.description 
      };
      setHistory([newItem, ...history]);
      showSuccess("تم تحليل الصورة بنجاح!");
      if (res.remainingCredits !== undefined) {
         setStats(prev => prev ? { 
           ...prev, 
           remainingCredits: res.remainingCredits,
           usedCredits: prev.usedCredits + (res as any).creditsUsed
         } : null);
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

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا التحليل؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(h => h.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (description === history.find(h => h.id === id)?.text) {
        setDescription(null);
        setPreviewUrl(null);
      }
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف التحليل من السجل السحابي");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'IMAGE');
      if (description) {
         setDescription(null);
         setPreviewUrl(null);
      }
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل مسح السجل السحابي");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen  rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-[#00050a] to-[#00050a]" />
      
      {/* Header */}
      <AskAIToolHeader 
        title="تحويل الصورة إلى نص (Prompt Engineering)"
        modelBadge="GEMINI 2.5"
        stats={stats}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto relative">
        {/* Overlay for mobile */}
        {showSettings && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Sidebar - Settings (Fixed) */}
        <aside className={clsx(
          "w-80 border-l border-white/5 bg-[#0a0c10]/95 backdrop-blur-sm flex-shrink-0 transition-transform duration-300 z-50",
          "fixed lg:relative top-0 right-0 h-full lg:h-auto",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            {/* Mobile Close Button */}
            <button
              onClick={() => setShowSettings(false)}
              className="lg:hidden absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="space-y-4 mt-12 lg:mt-0">
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
             <p className="text-[10px] text-gray-400 leading-relaxed text-right">ارفع أي صورة تعجبك وسيقوم الذكاء الاصطناعي باستخراج وصف دقيق جداً (Prompt) يمكنك استخدامه لإعادة توليد صور مشابهة أو تعديلها.</p>
          </div>
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 lg:p-6 space-y-6">
           <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
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

                       <div className="bg-white/5 rounded-2xl lg:rounded-3xl p-4 lg:p-8 border border-white/5 relative group w-full shadow-2xl">
                          <h3 className="text-teal-400 font-bold mb-4 flex items-center gap-2 text-right justify-end text-sm lg:text-base">الوصف المستخرج: <ImageIcon size={18} /></h3>
                          <div className="relative">
                            <p className="text-gray-300 leading-relaxed text-sm lg:text-lg font-medium font-sans ltr text-left dir-ltr selection:bg-teal-500/30 overflow-y-auto max-h-[300px] lg:max-h-[400px] custom-scrollbar p-3 lg:p-4 bg-black/20 rounded-xl lg:rounded-2xl border border-white/5">
                                {description}
                            </p>
                            <Button 
                                onClick={copyToClipboard} 
                                className="absolute top-2 right-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white h-10 w-10 lg:h-12 lg:w-12 p-0 border border-white/10"
                                title="نسخ الوصف"
                            >
                                {copied ? <Check className="text-white" size={16} /> : <Copy size={16} />}
                            </Button>
                          </div>
                          <div className="mt-6 lg:mt-8 flex items-center gap-3 justify-center">
                             <Button variant="ghost" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-9 lg:h-10 px-4 lg:px-6 text-xs lg:text-sm" onClick={() => {setDescription(null); setPreviewUrl(null);}}><RefreshCw size={14} className="lg:w-4 lg:h-4 ml-2" /> تجربة صورة أخرى</Button>
                          </div>
                          <BorderBeam colorFrom="#14B8A6" colorTo="#10B981" />
                       </div>
                    </motion.div>
                 ) : isAnalyzing ? <AILoader /> : (
                    <div className="text-center group px-4">
                       <Search size={60} className="lg:w-20 lg:h-20 text-teal-500/10 mb-4 lg:mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                       <h3 className="text-lg lg:text-2xl font-bold mb-2 text-white">أسرار الصورة بانتظارك</h3>
                       <p className="text-xs lg:text-sm text-gray-500 max-w-sm mx-auto">ارفع صورة لنكتشف معاً سحر الكلمات الكامنة خلفها.</p>
                       
                       <button
                         onClick={() => setShowSettings(true)}
                         className="lg:hidden mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold transition-transform hover:scale-105"
                       >
                         <Settings size={18} />
                         <span>افتح الإعدادات</span>
                       </button>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-teal-500" /> عمليات التحليل السابقة ({history.length})</h4>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => setShowSettings(true)}
                       className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold transition-transform hover:scale-105"
                     >
                       <Settings size={14} />
                       <span>إعدادات</span>
                     </button>
                     <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                   </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 lg:gap-3">
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
          </div>
        </main>
      </div>

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

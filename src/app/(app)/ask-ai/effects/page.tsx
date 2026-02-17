"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Wand2, FileVideo, X, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  processAIVideo, 
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


export default function EffectsPage() {
  const [token, setToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    }
  }, []);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const response = await getAIHistory(token, 'VIDEO');
      // Filter for effects operations only
      const mappedHistory: any[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'effects')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          original: (item.options as any)?.inputUrl,
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
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProcess = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع ملف فيديو أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'effects',
        inputUrl: previewUrl,
        prompt: prompt.trim() || "Add cinematic glow, professional color grading, sharp details"
      });
      const newItem = { 
        id: (res as any).historyId?.toString() || Date.now().toString(), 
        url: res.videoUrl, 
        original: previewUrl 
      };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      await loadStats();
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: res.remainingCredits,
        usedCredits: prev.usedCredits + (res as any).creditsUsed
      } : null);
      showSuccess("تم إضافة التأثيرات بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الفيديو؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(h => h.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedResult?.id === id) setSelectedResult(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الفيديو من السجل السحابي");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'VIDEO');
      setSelectedResult(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل مسح السجل السحابي");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">تأثيرات الفيديو الإبداعية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-cyan-400" /> <span className="text-sm font-bold font-mono">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            <div className="space-y-4">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-right">رفع الفيديو</label>
                <div 
                  className={clsx(
                    "relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all bg-white/5 group",
                    previewUrl ? "border-cyan-500/50" : "border-white/10 hover:border-cyan-500/30"
                  )}
                  onClick={() => document.getElementById('file-v-e')?.click()}
                >
                  {previewUrl ? (
                    <>
                      <video src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <FileVideo className="text-cyan-400 mb-2" size={32} />
                        <span className="text-xs font-bold text-white">تغيير الفيديو</span>
                      </div>
                    </>
                  ) : (
                    <FileVideo className="text-gray-700 group-hover:text-cyan-400" size={48} />
                  )}
                </div>
                <input id="file-v-e" type="file" className="hidden" accept="video/*" onChange={handleFileSelect} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 block text-right">وصف التأثير</label>
                <textarea 
                   value={prompt} 
                   onChange={(e) => setPrompt(e.target.value)} 
                   placeholder="مثال: اجعل الفيديو يبدو كأنه من عصر الثمانينات، أضف توهج أزرق على الأطراف، تصحيح ألوان سينمائي..." 
                   className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-cyan-500/30 transition-all text-right" 
                   dir="rtl"
                />
             </div>

             <GradientButton 
                onClick={handleProcess}
                disabled={!previewUrl}
                loading={isProcessing}
                loadingText="جاري التجهيز..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<Wand2 />}
                size="lg"
             >
                تطبيق التأثير
             </GradientButton>
          </div>

          <div className="p-6 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
             <h4 className="text-sm font-bold text-cyan-400 mb-2">اللمسة السحرية</h4>
             <p className="text-[10px] text-gray-400 leading-relaxed text-right">حوّل فيديوهاتك البسيطة إلى قطع فنية بضغطة زر. استخدم الأوامر النصية لوصف التغييرات التي تريدها وسيقوم الذكاء الاصطناعي بتنفيذها بدقة عالية.</p>
          </div>
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
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
                            <X size={14}/>
                          </button>
                        </div>

                       <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/10 shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                       <div className="mt-8 flex items-center gap-3">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-cyan-600 hover:bg-cyan-700 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="mr-2 h-4 w-4" /> تحميل الفيديو</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                       </div>
                       <BorderBeam colorFrom="#22D3EE" colorTo="#3B82F6" />
                    </motion.div>
                 ) : isProcessing ? <AILoader /> : (
                    <div className="text-center">
                       <Wand2 size={80} className="text-cyan-500/10 mb-6 mx-auto animate-pulse" />
                       <h3 className="text-2xl font-bold mb-2 text-white">ابهر العالم بفيديوهاتك</h3>
                       <p className="text-sm text-gray-500">ارفع الفيديو واكتب لمستك الخاصة بانتظار الإبداع.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-cyan-500" /> الفيديوهات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                   {history.map(h => (
                      <div key={h.id} className="relative group aspect-video rounded-xl cursor-pointer overflow-hidden border transition-all" onClick={() => setSelectedResult(h)}>
                         <video src={h.url} className={clsx("w-full h-full object-cover transition-all", selectedResult?.id === h.id ? "scale-110 opacity-100 border-2 border-cyan-500" : "opacity-40 hover:opacity-100")} />
                         <button 
                           onClick={(e) => handleDeleteItem(h.id, e)}
                           className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
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
        title="اشتراك مطلوب لتأثيرات الفيديو"
        description="للاستفادة من تقنية إضافة التأثيرات البصرية المذهلة على فيديوهاتك وتحويلها إلى قطع فنية احترافية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

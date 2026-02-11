"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Maximize, FileVideo, X, Trash2
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

import AskAIToolHeader from "@/components/AskAIToolHeader";

const RATIOS = [
  { id: "9:16", label: "TikTok / Reels (9:16)", value: "9:16" },
  { id: "16:9", label: "YouTube (16:9)", value: "16:9" },
  { id: "1:1", label: "Instagram (1:1)", value: "1:1" },
  { id: "4:5", label: "Portrait (4:5)", value: "4:5" },
];

export default function ResizePage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("9:16");
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
      // Filter for resize operations only
      const mappedHistory = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'resize')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          ratio: (item.options as any)?.aspectRatio || 'original',
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

  const handleProcess = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع فيديو أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'resize',
        inputUrl: previewUrl,
        aspectRatio: selectedRatio
      });
      const newItem = { 
        id: (res as any).historyId?.toString() || Date.now().toString(), 
        url: res.videoUrl, 
        ratio: selectedRatio 
      };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم تغيير الأبعاد بنجاح!");
      await loadStats();
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا المقطع؟")) return;
    
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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/10 via-[#00050a] to-[#00050a]" />
      
     {/* Header */}
      <AskAIToolHeader 
        title="تغيير أبعاد الفيديو الذكي "
        modelBadge="VEO 3.1"
        stats={stats}
      />
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            <div className="space-y-4">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 block text-right">الفيديو المستهدف</label>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload" onClick={() => document.getElementById('file-v-r')?.click()}>
                   {previewUrl ? (
                     <>
                        <video src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <FileVideo className="text-orange-400 mb-2" size={32} />
                          <span className="text-xs font-bold text-white">تغيير الفيديو</span>
                        </div>
                     </>
                   ) : <Upload className="text-gray-700 group-hover/upload:text-orange-400" size={32} />}
                </div>
                <input id="file-v-r" type="file" className="hidden" accept="video/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setPreviewUrl(URL.createObjectURL(file));
                }} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-right">الأبعاد الجديدة</label>
                <div className="grid grid-cols-1 gap-2">
                   {RATIOS.map(r => (
                      <button key={r.id} onClick={() => setSelectedRatio(r.value)} className={clsx("p-4 rounded-2xl text-xs font-bold border transition-all flex justify-between items-center", selectedRatio === r.value ? "bg-orange-600 border-orange-500 shadow-lg shadow-orange-600/20 text-white" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 text-right")}>
                         <div className="flex items-center gap-3">
                            <Maximize size={14} className={clsx(selectedRatio === r.value ? "text-white" : "text-gray-600")} />
                            <span>{r.label}</span>
                         </div>
                         {selectedRatio === r.value && <Zap size={10} className="fill-white" />}
                      </button>
                   ))}
                </div>
             </div>

             <GradientButton 
                onClick={handleProcess}
                disabled={!previewUrl}
                loading={isProcessing}
                loadingText="جاري التغيير..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<Maximize />}
                size="lg"
             >
                تطبيق المقاس الجديد
             </GradientButton>
          </div>
          
          <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
             <h4 className="text-sm font-bold text-orange-400 mb-2 text-right">مناسب لجميع المنصات</h4>
             <p className="text-[10px] text-gray-400 leading-relaxed text-right">حوّل فيديوهاتك العريضة إلى فيديوهات طولية تناسب تيك توك وستوري إنستغرام أو العكس، مع الحفاظ على العناصر الأساسية في منتصف المشهد بذكاء.</p>
          </div>
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
           <div className="min-h-[600px] w-full rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden group">
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
                       
                       <video src={selectedResult.url} controls autoPlay loop className={clsx("max-h-[550px] w-auto rounded-2xl shadow-3xl border border-white/5 transition-transform duration-500 hover:scale-[1.01]")} />
                       <div className="mt-8 flex items-center gap-3">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-orange-600 hover:bg-orange-700 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="mr-2 h-4 w-4" /> تحميل الفيديو</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                       </div>
                       <BorderBeam colorFrom="#FB923C" colorTo="#F59E0B" />
                    </motion.div>
                 ) : isProcessing ? (
                    <AILoader />
                 ) : (
                    <div className="text-center group">
                       <Maximize size={80} className="text-orange-500/10 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                       <p className="text-2xl font-bold text-white mb-2">اختر الأبعاد المناسبة لمنصتك</p>
                       <p className="text-sm text-gray-500">ارفع الفيديو وسنقوم بإعادة تحجيمه ليلائم مقاسات التواصل.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-orange-500" /> الفيديوهات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                   {history.map(h => (
                      <div key={h.id} className="relative group flex-shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-video rounded-2xl cursor-pointer border-2 transition-all overflow-hidden shadow-lg", selectedResult?.id === h.id ? "border-orange-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <video src={h.url} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] font-bold text-white bg-orange-600 px-2 py-0.5 rounded-full">{h.ratio}</span>
                           </div>
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
          </div>
        </main>
      </div>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لتغيير أبعاد الفيديو"
        description="للاستفادة من تقنية تغيير مقاسات الفيديو للمنصات المختلفة وتحسين المحتوى لجميع وسائل التواصل، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

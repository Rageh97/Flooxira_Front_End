"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, MessageSquare, Mic, FileVideo, X, Trash2 
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

export default function LipSyncPage() {
  const [token, setToken] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
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
      const saved = localStorage.getItem("ai_lipsync_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_lipsync_history", JSON.stringify(history)); }, [history]);

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
    
    if (!videoPreview || !audioPreview) return showError("تنبيه", "ارفع ملف فيديو وملف صوتي!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'lipsync',
        inputUrl: videoPreview,
        prompt: `Sync with this audio: ${audioPreview}`
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم مزامنة الشفاه بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا المقطع؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_lipsync_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const handleClearAll = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة؟")) {
      setHistory([]);
      setSelectedResult(null);
      localStorage.removeItem("ai_lipsync_history");
      showSuccess("تم حذف جميع الأعمال!");
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">تحريك الشفاه (Lip Sync)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-green-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            <div className="space-y-4">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 justify-end">فيديو الوجه <FileVideo size={16} /></label>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload" onClick={() => document.getElementById('file-v-l')?.click()}>
                   {videoPreview ? (
                     <>
                        <video src={videoPreview} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <FileVideo className="text-green-400 mb-2" size={32} />
                          <span className="text-xs font-bold text-white">تغيير الفيديو</span>
                        </div>
                     </>
                   ) : <Upload className="text-gray-700 group-hover/upload:text-green-400" size={32} />}
                </div>
                <input id="file-v-l" type="file" className="hidden" accept="video/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setVideoPreview(URL.createObjectURL(file));
                }} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 justify-end">ملف الصوت <Mic size={16} /></label>
                <div className="rounded-2xl border-2 border-dashed border-white/10 p-4 flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:border-green-500/30 transition-all" onClick={() => document.getElementById('file-a-l')?.click()}>
                   {audioPreview ? <audio src={audioPreview} controls className="w-full" /> : <><Upload className="text-gray-700 mb-2" size={24} /><span className="text-[10px] text-gray-500">اختر الملف الصوتي</span></>}
                </div>
                <input id="file-a-l" type="file" className="hidden" accept="audio/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setAudioPreview(URL.createObjectURL(file));
                }} />
             </div>

             <GradientButton 
                onClick={handleProcess}
                disabled={!videoPreview || !audioPreview}
                loading={isProcessing}
                loadingText="جاري المزامنة..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<MessageSquare />}
                size="lg"
             >
                ابدأ المزامنة
             </GradientButton>
          </div>
          
          <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10">
             <h4 className="text-sm font-bold text-green-400 mb-2 text-right">تكلم بجميع اللغات</h4>
             <p className="text-[10px] text-gray-400 leading-relaxed text-right">باستخدام تقنية Lip Sync، يمكنك جعل أي شخص في الفيديو ينطق بالكلمات الموجودة في الملف الصوتي بدقة مذهلة، وبشكل يبدو طبيعياً تماماً.</p>
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
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-green-600 hover:bg-green-700 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="mr-2 h-4 w-4" /> تحميل النتيجة</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                       </div>
                       <BorderBeam colorFrom="#10B981" colorTo="#34D399" />
                    </motion.div>
                 ) : isProcessing ? <AILoader /> : (
                    <div className="text-center group">
                       <MessageSquare size={80} className="text-green-500/5 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                       <h3 className="text-2xl font-bold mb-2 text-white">مزامنة احترافية</h3>
                       <p className="text-sm text-gray-500">ارفع الفيديو والصوت وشاهد النتائج المبهرة.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-green-500" /> النتائج السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                   {history.map(h => (
                      <div key={h.id} className="relative group flex-shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-video rounded-2xl cursor-pointer border-2 transition-all overflow-hidden shadow-lg", selectedResult?.id === h.id ? "border-green-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <video src={h.url} className="w-full h-full object-cover" />
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

      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لمزامنة الشفاه"
        description="للاستفادة من تقنية مزامنة حركة الشفاه مع الصوت وإنشاء فيديوهات واقعية بدقة عالية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

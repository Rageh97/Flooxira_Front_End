"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Users, ShieldCheck, Play, X, Trash2
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


export default function UGCPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
      // Filter for ugc operations only
      const mappedHistory = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'ugc')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          prompt: item.prompt,
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

  const handleGenerate = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!prompt.trim()) return showError("تنبيه", "اكتب وصفاً للمحتوى!");
    setIsGenerating(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'ugc',
        inputUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop", 
        prompt: `UGC (User Generated Content) style, handheld camera, natural lighting, relatable person, ${prompt.trim()}`
      });
      const newItem = { 
        id: (res as any).historyId?.toString() || Date.now().toString(), 
        url: res.videoUrl, 
        prompt: prompt.trim() 
      };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إنشاء محتوى UGC بنجاح!");
      await loadStats();
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsGenerating(false); }
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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 text-white rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">فيديوهات UGC تفاعلية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-pink-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            <div className="space-y-4">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 justify-end">سيناريو المحتوى <Users size={16} className="text-pink-400" /></label>
               <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="مثال: شخص يتحدث عن جودة منتج العناية بالبشرة، تصوير منزلي بسيط، حماس في الكلام..." 
                  className="w-full h-40 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-pink-500/30 transition-all leading-relaxed text-right" 
                  dir="rtl"
               />
            </div>
            
            <GradientButton 
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                loading={isGenerating}
                loadingText="جاري التحضير..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<Play />}
                size="lg"
            >
              توليد فيديو UGC
            </GradientButton>
          </div>
          
          <div className="p-6 bg-pink-500/5 rounded-2xl border border-pink-500/10 space-y-3 shadow-inner">
             <div className="flex items-center gap-2 text-pink-400 font-bold text-sm justify-end">
                <span>ستايل واقعي (UGC)</span>
                <ShieldCheck size={16} />
             </div>
             <p className="text-[10px] text-gray-400 leading-relaxed text-right">تتميز هذه الفيديوهات بكونها تبدو كأنها مصورة بواسطة مستخدمين حقيقيين، مما يزيد من ثقة العملاء في علامتك التجارية.</p>
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
                    <div className="absolute top-0 left-0 z-30">
                        <button 
                            onClick={() => setSelectedResult(null)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/10 shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                    <div className="mt-8 flex items-center gap-3">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-pink-600 hover:bg-pink-700 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="ml-2 h-4 w-4" /> تحميل المحتوى</Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 w-10 border border-red-500/20" onClick={(e) => handleDeleteItem(selectedResult.id, e)}><Trash2 size={18} /></Button>
                    </div>
                    <BorderBeam colorFrom="#DB2777" colorTo="#9333EA" />
                  </motion.div>
                ) : isGenerating ? <AILoader /> : (
                  <div className="flex flex-col items-center text-center max-w-sm group">
                     <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform duration-500 animate-pulse">
                        <Users size={32} className="text-pink-400" />
                     </div>
                     <h3 className="text-2xl font-bold mb-2 text-white">اصنع محتوى يلامس جمهورك</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">اكتب تفاصيل المشهد الذي تريده وسنقوم بتوليد فيديو يبدو وكأنه مصور بهاتف محمول بشكل شخصي وواقعي.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} className="text-pink-500" /> الفيديوهات السابقة ({history.length})</h4>
                   <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                   {history.map(h => (
                      <div key={h.id} className="relative group flex-shrink-0" onClick={() => setSelectedResult(h)}>
                        <div 
                           className={clsx("w-32 aspect-video rounded-2xl cursor-pointer border-2 transition-all overflow-hidden shadow-lg", selectedResult?.id === h.id ? "border-pink-500 scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100")}
                        >
                           <video src={h.url} className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[6px] text-white truncate text-center">{h.prompt}</p>
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
        title="اشتراك مطلوب لفيديوهات UGC"
        description="للاستفادة من تقنية إنشاء محتوى فيديو تفاعلي وواقعي يبدو كأنه مصور بواسطة مستخدمين حقيقيين, تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Users, ShieldCheck, Play 
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
      const saved = localStorage.getItem("ai_ugc_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_ugc_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
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
        inputUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg", // Dummy input to trigger the processAI operation for text-based if needed, or we adapt back-end to handle null input. For now, we use a placeholder or prompt-based.
        prompt: `UGC (User Generated Content) style, handheld camera, natural lighting, relatable person, ${prompt.trim()}`
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl, prompt: prompt.trim() };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إنشاء محتوى UGC بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsGenerating(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">فيديوهات UGC تفاعلية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-pink-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-pink-400" /> سيناريو المحتوى
               </label>
               <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="مثال: شخص يتحدث عن جودة منتج العناية بالبشرة، تصوير منزلي بسيط، حماس في الكلام..." 
                  className="w-full h-40 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-pink-500/30 transition-all leading-relaxed" 
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
          
          <div className="p-6 bg-pink-500/5 rounded-[24px] border border-pink-500/10 space-y-3">
             <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                <ShieldCheck size={16} /> ستايل واقعي (UGC)
             </div>
             <p className="text-xs text-gray-400 leading-relaxed">تتميز هذه الفيديوهات بكونها تبدو كأنها مصورة بواسطة مستخدمين حقيقيين، مما يزيد من ثقة العملاء في علامتك التجارية.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                    <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/10 shadow-3xl" />
                    <div className="mt-8">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-pink-600 hover:bg-pink-700 font-bold h-10 px-8"><Download className="mr-2 h-4 w-4" /> تحميل المحتوى</Button>
                    </div>
                    <BorderBeam colorFrom="#DB2777" colorTo="#9333EA" />
                  </motion.div>
                ) : isGenerating ? <AILoader /> : (
                  <div className="flex flex-col items-center text-center max-w-sm">
                     <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 border border-pink-500/20">
                        <Users size={32} className="text-pink-400" />
                     </div>
                     <h3 className="text-xl font-bold mb-2">اصنع محتوى يلامس جمهورك</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">اكتب تفاصيل المشهد الذي تريده وسنقوم بتوليد فيديو يبدو وكأنه مصور بهاتف محمول بشكل شخصي وواقعي.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {history.map(h => (
                    <div key={h.id} onClick={() => setSelectedResult(h)} className={clsx("aspect-square rounded-xl cursor-pointer border-2 transition-all overflow-hidden", selectedResult?.id === h.id ? "border-pink-500 ring-4 ring-pink-500/10" : "border-white/5 opacity-50 hover:opacity-100")}>
                        <video src={h.url} className="w-full h-full object-cover" />
                    </div>
                ))}
             </div>
           )}
        </section>
      </main>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لفيديوهات UGC"
        description="للاستفادة من تقنية إنشاء محتوى فيديو تفاعلي وواقعي يبدو كأنه مصور بواسطة مستخدمين حقيقيين، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

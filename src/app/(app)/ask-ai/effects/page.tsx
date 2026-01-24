"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Wand2, FileVideo 
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
      const saved = localStorage.getItem("ai_effects_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_effects_history", JSON.stringify(history)); }, [history]);

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
      const newItem = { id: Date.now().toString(), url: res.videoUrl, original: previewUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إضافة التأثيرات بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">تأثيرات الفيديو الإبداعية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-cyan-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">رفع الفيديو</label>
                <div 
                  className={clsx(
                    "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all bg-white/5",
                    previewUrl ? "border-cyan-500/50" : "border-white/10 hover:border-cyan-500/30"
                  )}
                  onClick={() => document.getElementById('file-v-e')?.click()}
                >
                  {previewUrl ? (
                    <video src={previewUrl} className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <FileVideo className="text-gray-700" size={48} />
                  )}
                </div>
                <input id="file-v-e" type="file" className="hidden" accept="video/*" onChange={handleFileSelect} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400">وصف التأثير</label>
                <textarea 
                   value={prompt} 
                   onChange={(e) => setPrompt(e.target.value)} 
                   placeholder="مثال: اجعل الفيديو يبدو كأنه من عصر الثمانينات، أضف توهج أزرق على الأطراف، تصحيح ألوان سينمائي..." 
                   className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-cyan-500/30 transition-all" 
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

          <div className="p-6 bg-cyan-500/5 rounded-[24px] border border-cyan-500/10">
             <h4 className="text-sm font-bold text-cyan-400 mb-2">اللمسة السحرية</h4>
             <p className="text-xs text-gray-400 leading-relaxed">حوّل فيديوهاتك البسيطة إلى قطع فنية بضغطة زر. استخدم الأوامر النصية لوصف التغييرات التي تريدها وسيقوم نماذجنا بتنفيذها بدقة عالية.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                 {selectedResult ? (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/10 shadow-3xl" />
                       <div className="mt-8">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-cyan-600 hover:bg-cyan-700 font-bold h-10 px-8"><Download className="mr-2 h-4 w-4" /> تحميل الفيديو</Button>
                       </div>
                       <BorderBeam colorFrom="#22D3EE" colorTo="#3B82F6" />
                    </motion.div>
                 ) : isProcessing ? <AILoader /> : (
                    <div className="text-center">
                       <Wand2 size={80} className="text-cyan-500/10 mb-6 mx-auto" />
                       <h3 className="text-xl font-bold mb-2">ابهر العالم بفيديوهاتك</h3>
                       <p className="text-sm text-gray-500">ارفع الفيديو واكتب لمستك الخاصة بانتظار الإبداع.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                {history.map(h => (
                   <div key={h.id} onClick={() => setSelectedResult(h)} className={clsx("aspect-square rounded-xl cursor-pointer border transition-all overflow-hidden", selectedResult?.id === h.id ? "border-cyan-500 scale-105" : "border-white/5 opacity-50 hover:opacity-100")}>
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
        title="اشتراك مطلوب لتأثيرات الفيديو"
        description="للاستفادة من تقنية إضافة التأثيرات البصرية المذهلة على فيديوهاتك وتحويلها إلى قطع فنية احترافية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

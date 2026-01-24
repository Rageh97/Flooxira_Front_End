"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, FileVideo, ShieldCheck 
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

export default function VideoUpscalePage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      const saved = localStorage.getItem("ai_vupscale_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_vupscale_history", JSON.stringify(history)); }, [history]);

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

  const handleProcess = async () => {
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع الفيديو المراد تحسينه!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'vupscale',
        inputUrl: previewUrl,
        prompt: "Crystal clear details, remove noise, 4k cinematic upscaling, enhance sharpness"
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم رفع جودة الفيديو بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">رفع جودة الفيديو (AI Upscaling)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-blue-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400">الفيديو الأصلي (Low Quality)</label>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden bg-white/5 group" onClick={() => document.getElementById('file-v-u')?.click()}>
                   {previewUrl ? <video src={previewUrl} className="w-full h-full object-cover opacity-50" /> : <Upload className="text-gray-700" size={32} />}
                </div>
                <input id="file-v-u" type="file" className="hidden" accept="video/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setPreviewUrl(URL.createObjectURL(file));
                }} />
             </div>

             <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-3">
                <ShieldCheck className="text-blue-400 shrink-0" size={20} />
                <p className="text-[10px] text-gray-400">سيقوم نظامنا بإعادة بناء البكسلات المفقودة وتوضيح الحواف باستخدام الذكاء الاصطناعي الفائق.</p>
             </div>

             <GradientButton 
                onClick={handleProcess}
                disabled={!previewUrl}
                loading={isProcessing}
                loadingText="جاري التحسين..."
                loadingIcon={<Loader2 className="animate-spin" />}
                icon={<Sparkles />}
                size="lg"
             >
                ابدأ التحسين
             </GradientButton>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                 {selectedResult ? (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/5 shadow-3xl" />
                       <div className="mt-8 flex gap-3">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold h-10 px-8"><Download className="mr-2 h-4 w-4" /> تحميل النسخة المحسنة</Button>
                       </div>
                       <BorderBeam />
                    </motion.div>
                 ) : isProcessing ? <AILoader /> : (
                    <div className="text-center opacity-40">
                       <FileVideo size={80} className="mb-4 mx-auto" />
                       <h3 className="text-xl font-bold">وضوح فائق الدقة</h3>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </section>
      </main>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لتحسين الفيديو"
        description="للاستفادة من تقنية رفع جودة الفيديو بالذكاء الاصطناعي وتحسين الوضوح والتفاصيل بشكل احترافي، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

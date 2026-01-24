"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, Palette, 
  Loader2, ArrowRight, Zap, History, Layout
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

export default function SketchPage() {
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
      const saved = localStorage.getItem("ai_sketch_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); } }, [token]);
  useEffect(() => { localStorage.setItem("ai_sketch_history", JSON.stringify(history)); }, [history]);

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
    
    if (!previewUrl) return showError("تنبيه", "ارفع رسمتك اليدوية أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIImage(token, {
        operation: 'sketch',
        imageUrl: previewUrl,
        prompt: prompt.trim() || "Realistic detailed masterpiece, high quality"
      });
      const newItem = { id: Date.now().toString(), url: res.imageUrl, original: previewUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم تحويل الرسمة بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">رسم إلى صور واقعية</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-purple-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ارفع رسمك اليدوي</label>
               <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-purple-500/30 transition-all bg-white/5" onClick={() => document.getElementById('file-s')?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" /> : <Palette className="text-gray-700" size={48} />}
               </div>
               <input id="file-s" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400">وصف النتيجة النهائية</label>
               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثال: منظر طبيعي للجبال وقت الغروب، جودة سينمائية، تفاصيل دقيقة..." className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-purple-500/30 transition-all" />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التحويل..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Sparkles />}
              size="lg"
            >
              حول الرسمة لصورة
            </GradientButton>
          </div>
          
          <div className="p-6 bg-purple-500/5 rounded-[24px] border border-purple-500/10 space-y-3">
             <h4 className="text-sm font-bold text-purple-400 mb-2">من خربشة إلى إبداع</h4>
             <p className="text-xs text-gray-400 leading-relaxed">حوّل أبسط الرسومات اليدوية إلى صور واقعية مذهلة. استخدم الأوامر النصية لتوجيه الذكاء الاصطناعي نحو الألوان والستايل الذي تفضله.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                       <div className="space-y-2">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">الرسم الأصلي</span>
                          <img src={selectedResult.original} className="rounded-xl border border-white/5 opacity-50 grayscale" />
                       </div>
                       <div className="space-y-2 relative group/img">
                          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">النتيجة النهائية</span>
                          <img src={selectedResult.url} className="rounded-2xl shadow-3xl border border-white/10" />
                          <Button onClick={() => window.open(selectedResult.url)} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white text-black font-bold h-10 px-6 opacity-0 group-hover/img:opacity-100 transition-opacity"><Download className="mr-2 h-4 w-4" /> تحميل</Button>
                       </div>
                    </div>
                    <BorderBeam colorFrom="#A855F7" colorTo="#EC4899" />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : (
                  <div className="text-center">
                     <Palette size={80} className="text-purple-500/10 mb-6 mx-auto animate-pulse" />
                     <h3 className="text-xl font-bold mb-2 text-gray-300">في انتظار لمستك الفنية</h3>
                     <p className="text-sm text-gray-600 max-w-sm mx-auto">ارفع رسمك اليدوي وسنقوم بتحويله إلى واقع ملموس بدقة عالية.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 px-2 flex items-center gap-2"><History size={14} /> التصميمات السابقة</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                   {history.map(img => (
                      <div key={img.id} onClick={() => setSelectedResult(img)} className={clsx("aspect-square rounded-xl cursor-pointer border-2 transition-all overflow-hidden", selectedResult?.id === img.id ? "border-purple-500 scale-105" : "border-white/5 opacity-40 hover:opacity-100")}>
                         <img src={img.url} className="w-full h-full object-cover" />
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
        title="اشتراك مطلوب لتحويل الرسم"
        description="للاستفادة من تقنية تحويل الرسومات اليدوية لصور واقعية وتحويل أفكارك الإبداعية إلى واقع ملموس، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

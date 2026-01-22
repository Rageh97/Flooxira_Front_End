"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Move 
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

export default function MotionPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_motion_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { localStorage.setItem("ai_motion_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "ارفع صورة أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'motion',
        inputUrl: previewUrl,
        prompt: prompt.trim() || "Natural cinematic motion, zoom in slowly"
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl, original: previewUrl };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إضافة الحركة بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><ArrowRight className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">محاكاة الحركة (Image to Video)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-[2px]">الصورة الأصلية</label>
               <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/30 transition-all bg-white/5" onClick={() => document.getElementById('file-m')?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-700" size={48} />}
               </div>
               <input id="file-m" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400">طبيعة الحركة (اختياري)</label>
               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثال: اجعل الأمواج تتحرك، حرك السحب ببطء، زووم سينمائي على الوجه..." className="w-full h-24 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none focus:border-blue-500/30 transition-all" />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التحرير..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Move />}
              size="lg"
            >
              إضافة حركة
            </GradientButton>
          </div>
          
          <div className="p-6 bg-blue-500/5 rounded-[24px] border border-blue-500/10">
             <h4 className="text-sm font-bold text-blue-400 mb-2">كيف تعمل؟</h4>
             <p className="text-xs text-gray-400 leading-relaxed">ارفع صورة ثابتة وسيقوم الذكاء الاصطناعي بتحليل العناصر داخلها وإضافة حركة واقعية (Cinematic Motion) لتحويلها إلى فيديو قصير مبهر.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                    <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] shadow-3xl border border-white/10" />
                    <div className="mt-8 flex gap-4">
                        <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-white text-black font-bold h-10 px-8 hover:scale-105 transition-all"><Download className="mr-2 h-4 w-4" /> تحميل الفيديو</Button>
                    </div>
                    <BorderBeam duration={6} />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : <div className="text-gray-800 flex flex-col items-center"><Move size={100} className="mb-4 opacity-5 animate-pulse" /><p className="font-medium text-gray-600">ارفع صورة وابدأ السحر</p></div>}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><HistoryIcon size={14} /> المعارض السابقة</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                    {history.map(h => (
                        <div key={h.id} onClick={() => setSelectedResult(h)} className={clsx("aspect-square rounded-xl cursor-pointer border-2 transition-all relative group overflow-hidden", selectedResult?.id === h.id ? "border-blue-500 scale-105" : "border-white/5 opacity-50 hover:opacity-100")}>
                            <video src={h.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Zap size={20} /></div>
                        </div>
                    ))}
                </div>
             </div>
           )}
        </section>
      </main>
    </div>
  );
}

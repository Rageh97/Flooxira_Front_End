"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, MessageSquare, Mic, FileVideo 
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

export default function LipSyncPage() {
  const [token, setToken] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_lipsync_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { localStorage.setItem("ai_lipsync_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
  };

  const handleProcess = async () => {
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

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">تحريك الشفاه (Lip Sync)</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-green-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileVideo size={16} /> فيديو الوجه</label>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden bg-white/5" onClick={() => document.getElementById('file-v-l')?.click()}>
                   {videoPreview ? <video src={videoPreview} className="w-full h-full object-cover opacity-50" /> : <Upload className="text-gray-700" size={32} />}
                </div>
                <input id="file-v-l" type="file" className="hidden" accept="video/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setVideoPreview(URL.createObjectURL(file));
                }} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mic size={16} /> ملف الصوت</label>
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
          
          <div className="p-6 bg-green-500/5 rounded-[24px] border border-green-500/10">
             <h4 className="text-sm font-bold text-green-400 mb-2">تكلم بجميع اللغات</h4>
             <p className="text-xs text-gray-400 leading-relaxed">باستخدام تقنية Lip Sync، يمكنك جعل أي شخص في الفيديو ينطق بالكلمات الموجودة في الملف الصوتي بدقة مذهلة، وبشكل يبدو طبيعياً تماماً.</p>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                 {selectedResult ? (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <video src={selectedResult.url} controls autoPlay loop className="max-h-[550px] w-auto rounded-[30px] border border-white/10 shadow-3xl" />
                       <div className="mt-8">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-green-600 hover:bg-green-700 font-bold h-10 px-8 hover:scale-105 transition-all"><Download className="mr-2 h-4 w-4" /> تحميل النتيجة</Button>
                       </div>
                       <BorderBeam colorFrom="#10B981" colorTo="#34D399" />
                    </motion.div>
                 ) : isProcessing ? <AILoader /> : (
                    <div className="text-center">
                       <MessageSquare size={80} className="text-green-500/5 mb-6 mx-auto" />
                       <h3 className="text-xl font-bold mb-2">مزامنة احترافية</h3>
                       <p className="text-sm text-gray-500">ارفع الفيديو والصوت وشاهد النتائج المبهرة.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="flex gap-3 overflow-x-auto pb-4 px-2 custom-scrollbar">
                {history.map(h => (
                   <div key={h.id} onClick={() => setSelectedResult(h)} className={clsx("w-24 aspect-square rounded-2xl cursor-pointer border-2 transition-all overflow-hidden flex-shrink-0", selectedResult?.id === h.id ? "border-green-500 scale-105" : "border-white/5 opacity-50")}>
                      <video src={h.url} className="w-full h-full object-cover" />
                   </div>
                ))}
             </div>
           )}
        </section>
      </main>
    </div>
  );
}

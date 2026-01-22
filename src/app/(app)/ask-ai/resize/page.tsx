"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Zap, Maximize, FileVideo 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIVideo, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

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
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_resize_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { localStorage.setItem("ai_resize_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "ارفع فيديو أولاً!");
    setIsProcessing(true);
    try {
      const res = await processAIVideo(token, {
        operation: 'resize',
        inputUrl: previewUrl,
        aspectRatio: selectedRatio
      });
      const newItem = { id: Date.now().toString(), url: res.videoUrl, ratio: selectedRatio };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم تغيير الأبعاد بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">تغيير أبعاد الفيديو الذكي</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5"><Zap size={14} className="text-orange-400" /> <span className="text-sm font-bold font-mono">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto w-full">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400">الفيديو المستهدف</label>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden bg-white/5" onClick={() => document.getElementById('file-v-r')?.click()}>
                   {previewUrl ? <video src={previewUrl} className="w-full h-full object-cover opacity-50" /> : <Upload className="text-gray-700" size={32} />}
                </div>
                <input id="file-v-r" type="file" className="hidden" accept="video/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) setPreviewUrl(URL.createObjectURL(file));
                }} />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">الأبعاد الجديدة</label>
                <div className="grid grid-cols-1 gap-2">
                   {RATIOS.map(r => (
                      <button key={r.id} onClick={() => setSelectedRatio(r.value)} className={clsx("p-4 rounded-2xl text-xs font-bold border transition-all flex justify-between items-center", selectedRatio === r.value ? "bg-orange-600 border-orange-500 shadow-lg shadow-orange-600/20" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 text-right")}>
                         <span>{r.label}</span>
                         <Maximize size={14} className={clsx(selectedRatio === r.value ? "text-white" : "text-gray-600")} />
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
                تحميل فيديو جديد
             </GradientButton>
          </div>
        </aside>

        <section className="lg:col-span-8 flex flex-col items-center">
           <div className="min-h-[600px] w-full rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                 {selectedResult ? (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <video src={selectedResult.url} controls autoPlay loop className={clsx("max-h-[550px] w-auto rounded-2xl shadow-3xl border border-white/5")} />
                       <div className="mt-8">
                          <Button onClick={() => window.open(selectedResult.url)} className="rounded-full bg-orange-600 hover:bg-orange-700 font-bold h-10 px-8"><Download className="mr-2 h-4 w-4" /> تحميل</Button>
                       </div>
                       <BorderBeam colorFrom="#FB923C" colorTo="#F59E0B" />
                    </motion.div>
                 ) : isProcessing ? (
                    <div className="flex flex-col items-center">
                       <Loader text="جاري معالجة الأبعاد..." size="lg" variant="warning" />
                    </div>
                 ) : (
                    <div className="text-center opacity-20">
                       <Maximize size={80} className="mb-4 mx-auto" />
                       <p className="font-bold">اختر الأبعاد المناسبة لمنصتك</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </section>
      </main>
    </div>
  );
}

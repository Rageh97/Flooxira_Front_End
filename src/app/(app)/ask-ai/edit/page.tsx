"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, Edit2, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Wand2, RefreshCw 
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

export default function ImageEditPage() {
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
      const saved = localStorage.getItem("ai_edit_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { localStorage.setItem("ai_edit_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
  };

  const handleProcess = async () => {
    if (!previewUrl || !prompt.trim()) return showError("تنبيه", "ارفع صورة واكتب ماذا تريد تعديله!");
    setIsProcessing(true);
    try {
      const res = await processAIImage(token, {
        operation: 'edit',
        imageUrl: previewUrl,
        prompt: prompt.trim()
      });
      const newItem = { id: Date.now().toString(), url: res.imageUrl, prompt: prompt.trim() };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم تعديل الصورة بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="rounded-full bg-white/5"><ArrowRight className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">تحرير الصور بالذكاء الاصطناعي</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2"><Zap size={14} className="text-amber-500" /> <span className="text-sm font-bold">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6">
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400">الصورة المراد تعديلها</label>
               <div className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/30 transition-all" onClick={() => document.getElementById('file-e')?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-600" size={32} />}
               </div>
               <input id="file-e" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400">ماذا تريد أن تغير؟</label>
               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثال: غير لون القميص إلى أحمر، أضف نظارات شمسية، اجعل الخلفية في باريس..." className="w-full h-32 bg-white/5 border-none rounded-2xl p-4 text-sm placeholder:text-gray-600 outline-none resize-none" />
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl || !prompt.trim()}
              loading={isProcessing}
              loadingText="جاري التعديل..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<Edit2 />}
              size="lg"
            >
              نفذ التعديل
            </GradientButton>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 text-center group">
                    <img src={selectedResult.url} className="max-h-[600px] rounded-2xl shadow-2xl" />
                    <Button onClick={() => window.open(selectedResult.url)} className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white text-black font-bold h-10 px-8 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="mr-2 h-4 w-4" /> تحميل</Button>
                    <BorderBeam />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : <div className="text-gray-800 flex flex-col items-center"><Edit2 size={80} className="mb-4 opacity-5" /><p>اكتب أوامرك لنتولى التعديل بدقة</p></div>}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="grid grid-cols-6 gap-3">
               {history.map(h => <img key={h.id} src={h.url} onClick={() => setSelectedResult(h)} className={clsx("aspect-square rounded-xl cursor-pointer border-2 transition-all", selectedResult?.id === h.id ? "border-indigo-500" : "border-transparent opacity-50")} />)}
             </div>
           )}
        </section>
      </main>
    </div>
  );
}

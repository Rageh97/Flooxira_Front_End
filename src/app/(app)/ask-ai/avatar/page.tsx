"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, UserCircle, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, PersonStanding 
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

const AVATAR_STYLES = [
  { id: "3d", label: "3D ستايل", prompt: "3D stylized character, Pixar style, highly detailed render, vibrant colors" },
  { id: "anime", label: "أنمي", prompt: "Modern anime style, studio ghibli aesthetic, clean line art" },
  { id: "cyber", label: "سايبربانك", prompt: "Cyberpunk aesthetic, neon lighting, futuristic tech details, synthwave style" },
  { id: "oil", label: "زيتي", prompt: "Classical oil painting, museum quality art, brush strokes" },
];

export default function AvatarPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_avatar_history");
      if (saved) setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => { if (token) loadStats(); }, [token]);
  useEffect(() => { localStorage.setItem("ai_avatar_history", JSON.stringify(history)); }, [history]);

  const loadStats = async () => {
    const res = await getAIStats(token);
    setStats(res.stats);
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "ارفع صورة واضحة لوجهك!");
    setIsProcessing(true);
    try {
      const style = AVATAR_STYLES.find(s => s.id === selectedStyle);
      const res = await processAIImage(token, {
        operation: 'avatar',
        imageUrl: previewUrl,
        prompt: `Convert this person into: ${style?.prompt}`
      });
      const newItem = { id: Date.now().toString(), url: res.imageUrl, style: style?.label };
      setHistory([newItem, ...history]);
      setSelectedResult(newItem);
      showSuccess("تم إنشاء الأفاتار بنجاح!");
    } catch (e: any) { showError("خطأ", e.message); }
    finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="group rounded-full bg-white/5"><ArrowRight className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">انشاء الأفاتار الشخصي</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2"><Zap size={14} className="text-blue-400" /> <span className="text-sm font-bold">{stats.remainingCredits}</span></div>}
      </header>

      <main className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-8">
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">الخطوة 1: صورة الوجه</label>
               <div className="aspect-square rounded-full border-4 border-dashed border-white/5 flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-500/30 transition-all p-2 bg-white/5" onClick={() => document.getElementById('file-a')?.click()}>
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-full" /> : <UserCircle className="text-gray-700" size={60} />}
               </div>
               <input id="file-a" type="file" className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(file);
                  }
               }} />
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">الخطوة 2: اختيار الستايل</label>
               <div className="grid grid-cols-2 gap-2">
                  {AVATAR_STYLES.map(style => (
                    <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={clsx("p-3 rounded-2xl text-[10px] font-bold border transition-all", selectedStyle === style.id ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/30" : "bg-white/5 border-transparent hover:bg-white/10 text-gray-400")}>{style.label}</button>
                  ))}
               </div>
            </div>

            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري التشكيل..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<PersonStanding />}
              size="lg"
            >
              صمم شخصيتي الآن
            </GradientButton>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedResult ? (
                  <motion.div key="res" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center">
                    <img src={selectedResult.url} className="max-h-[600px] rounded-[40px] shadow-3xl border border-white/10" />
                    <Button onClick={() => window.open(selectedResult.url)} className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 hover:bg-indigo-600 font-bold h-10 px-8 transition-all hover:scale-105"><Download className="mr-2 h-4 w-4" /> حفظ الأفاتار</Button>
                    <BorderBeam colorFrom="#818CF8" colorTo="#F472B6" />
                  </motion.div>
                ) : isProcessing ? <AILoader /> : <div className="text-gray-800 flex flex-col items-center"><UserCircle size={100} className="mb-4 opacity-5" /><p className="font-medium">انتظر حتى ترى شخصيتك الرقمية الجديدة</p></div>}
              </AnimatePresence>
           </div>
           
           {history.length > 0 && (
             <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
               {history.map(h => <img key={h.id} src={h.url} onClick={() => setSelectedResult(h)} className={clsx("w-20 h-20 rounded-full cursor-pointer border-2 transition-all flex-shrink-0 object-cover", selectedResult?.id === h.id ? "border-indigo-500 scale-110" : "border-white/10 opacity-60")} />)}
             </div>
           )}
        </section>
      </main>
    </div>
  );
}

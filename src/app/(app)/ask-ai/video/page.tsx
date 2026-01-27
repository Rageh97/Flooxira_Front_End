"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Video, 
  Download, 
  Share2, 
  RefreshCw, 
  Trash2,
  Sliders,
  Palette,
  Zap,
  Loader2,
  Wand2,
  Cpu,
  History,
  ArrowRight,
  Play,
  Film,
  X,
  Volume2,
  VolumeX,
  Mic,
  Languages,
  ArrowUpCircle,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  generateAIVideo, 
  addVideoAudio,
  extendVideo,
  enhanceVideo,
  listPlans,
  type AIStats 
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import AILoader from "@/components/AILoader";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

// --- Configuration Constants ---
const ASPECT_RATIOS = [
  { id: "16:9", label: "سينمائي", icon: "wide", value: "16:9" },
  { id: "9:16", label: "ستوري", icon: "tall", value: "9:16" },
  { id: "1:1", label: "مربع", icon: "square", value: "1:1" },
];

const STYLE_PRESETS = [
  { id: "none", label: "حر", prompt: "", color: "from-gray-500 to-slate-500" },
  { id: "cinematic", label: "سينمائي", prompt: ", cinematic shot, dramatic lighting, high production value, 4k, slow motion", color: "from-amber-500 to-orange-600" },
  { id: "realistic", label: "واقعي", prompt: ", photorealistic, lifelike motion, natural lighting, high detail, sharp focus", color: "from-emerald-500 to-teal-600" },
  { id: "anime", label: "أنمي", prompt: ", anime style, high-end animation, vibrant colors, fluid motion", color: "from-blue-400 to-indigo-500" },
  { id: "cyberpunk", label: "سايبر بانك", prompt: ", cyberpunk aesthetic, neon lights, rainy futuristic city, high tech atmosphere", color: "from-cyan-500 to-blue-600" },
  { id: "3d-animation", label: "3D", prompt: ", 3d animation, pixar style, smooth shading, high quality character animation", color: "from-violet-500 to-indigo-600" },
];

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
  style: string;
}

export default function TextToVideoPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [audioText, setAudioText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("ar-XA-Standard-A");
  const [selectedLanguage, setSelectedLanguage] = useState("ar");
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_video_history");
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem("ai_video_history", JSON.stringify(history));
  }, [history]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error) { console.error("Failed to load stats:", error); }
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
    if (!prompt.trim()) return showError("تنبيه", "أطلق العنان لخيالك واكتب وصفاً للفيديو!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 50) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsGenerating(true);
    try {
      const styleConfig = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const finalPrompt = prompt.trim() + (styleConfig?.prompt || "");

      const response = await generateAIVideo(token, {
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
        includeAudio: includeAudio,
      });

      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        url: response.videoUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        aspectRatio: selectedRatio,
        style: selectedStyle,
      };

      setHistory([newVideo, ...history]);
      setSelectedVideo(newVideo);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم بناء الفيديو بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء الإنتاج");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الفيديو؟")) return;
    const newHistory = history.filter(vid => vid.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_video_history", JSON.stringify(newHistory));
    if (selectedVideo?.id === id) setSelectedVideo(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearAllHistory = () => {
    if (window.confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة؟")) {
      setHistory([]);
      localStorage.removeItem("ai_video_history");
      setSelectedVideo(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    }
  };

  const downloadVideo = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { showError("خطأ", "تعذر التحميل"); }
  };

  const handleRegenerate = async () => {
    if (!selectedVideo) return;
    setPrompt(selectedVideo.prompt);
    setSelectedRatio(selectedVideo.aspectRatio);
    setSelectedStyle(selectedVideo.style);
    await handleGenerate();
  };

  const handleAddAudio = async () => {
    if (!selectedVideo || !audioText.trim()) return showError("تنبيه", "يرجى كتابة النص الصوتي");
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 30) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await addVideoAudio(token, {
        videoUrl: selectedVideo.url,
        audioText: audioText.trim(),
        voice: selectedVoice,
        language: selectedLanguage,
      });

      const videoWithAudio: GeneratedVideo = {
        id: Date.now().toString(),
        url: response.videoUrl,
        prompt: `${selectedVideo.prompt} (مع صوت)`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedVideo.aspectRatio,
        style: selectedVideo.style,
      };

      setHistory([videoWithAudio, ...history]);
      setSelectedVideo(videoWithAudio);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      setAudioText("");
      showSuccess("تمت إضافة الصوت بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء إضافة الصوت");
    } finally { setIsProcessing(false); }
  };

  const handleEnhanceVideo = async (enhancement: 'stabilize' | 'denoise' | 'upscale' | 'colorgrade') => {
    if (!selectedVideo) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 40) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await enhanceVideo(token, {
        videoUrl: selectedVideo.url,
        enhancement,
      });

      const enhancedVideo: GeneratedVideo = {
        id: Date.now().toString(),
        url: response.videoUrl,
        prompt: `${selectedVideo.prompt} (محسّن)`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedVideo.aspectRatio,
        style: selectedVideo.style,
      };

      setHistory([enhancedVideo, ...history]);
      setSelectedVideo(enhancedVideo);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم تحسين الفيديو بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التحسين");
    } finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري  التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] text-white overflow-x-hidden rounded-2xl selection:bg-purple-500/30 selection:text-purple-200 font-sans" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 shadow-2xl">
        <div className=" mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 rotate-180" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">نص إلى فيديو</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono tracking-widest uppercase">VEO 2.0 PRO</span>
            </h1>
          </div>
          {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
        </div>
      </header>

      <main className=" mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-4">
           <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 justify-end mb-2">
                    <span className="font-bold text-sm text-gray-200">أبعاد الفيديو</span>
                    <Sliders size={18} className="text-purple-400" />
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map(ratio => (
                       <button key={ratio.id} onClick={() => setSelectedRatio(ratio.value)} className={clsx("flex flex-col items-center p-2 rounded-xl transition-all border", selectedRatio === ratio.value ? "bg-purple-500/10 border-purple-500/50 text-white" : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10")}>
                          <div className={clsx("border-2 rounded-sm mb-1 transition-all", selectedRatio === ratio.value ? "border-purple-400" : "border-gray-600", ratio.id === "1:1" ? "w-4 h-4" : ratio.id === "16:9" ? "w-6 h-3" : "w-3 h-6")} />
                          <span className="text-[10px]">{ratio.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 justify-end mb-2">
                    <span className="font-bold text-sm text-gray-200">النمط الإخراجي</span>
                    <Palette size={18} className="text-indigo-400" />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {STYLE_PRESETS.map(style => (
                       <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={clsx("p-2 rounded-xl text-right transition-all border text-[10px] font-bold", selectedStyle === style.id ? "bg-indigo-500/10 border-indigo-500/50 text-white" : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10")}>{style.label}</button>
                    ))}
                 </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl">
                 <button onClick={() => setIncludeAudio(!includeAudio)} className={clsx("w-12 h-6 rounded-full transition-all p-1", includeAudio ? "bg-indigo-500 shadow-lg shadow-indigo-600/30" : "bg-white/10")}>
                    <motion.div animate={{ x: includeAudio ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full" />
                 </button>
                 <span className="text-xs text-gray-400 font-bold">تضمين الصوت</span>
              </div>

              {selectedVideo && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                   <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-2 justify-end">أدوات تعديل الفيديو <Wand2 size={14} /></h4>
                   <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => handleEnhanceVideo('upscale')} className="rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] h-10 gap-2"><ArrowUpCircle size={14} /> رفع الجودة</Button>
                      <Button onClick={() => handleEnhanceVideo('stabilize')} className="rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] h-10 gap-2"><Film size={14} /> تثبيت</Button>
                   </div>
                   <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                      <textarea value={audioText} onChange={(e) => setAudioText(e.target.value)} placeholder="نص لتحويله لصوت..." className="w-full bg-transparent text-[10px] outline-none border-none text-right" dir="rtl" rows={2} />
                      <Button onClick={handleAddAudio} className="w-full h-8 bg-purple-600 text-[10px] rounded-lg">إضافة تعليق صوتي</Button>
                   </div>
                </div>
              )}
           </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="relative bg-[#0a0c10] rounded-[32px] p-4 border border-white/10 shadow-2xl group">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="صف مشهد الفيديو الذي تتخيله بالتفصيل..." className="w-full min-h-[120px] bg-transparent text-white p-4 text-xl placeholder:text-gray-700 outline-none resize-none text-right" dir="rtl" />
              <div className="flex justify-between items-center px-4 pb-4">
                 <GradientButton onClick={handleGenerate} disabled={!prompt.trim()} loading={isGenerating} loadingText="جاري الإنتاج..." icon={<Video />} size="lg" className="rounded-2xl px-12">توليد الفيديو</GradientButton>
              </div>
              <BorderBeam size={120} duration={10} />
           </div>

           <div className="relative min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 overflow-hidden group/result">
              <AnimatePresence mode="wait">
                 {selectedVideo ? (
                    <motion.div key="vid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <div className="absolute top-0 left-0 z-30">
                          <button onClick={() => setSelectedVideo(null)} className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"><X size={14} /></button>
                       </div>
                       <video src={selectedVideo.url} controls autoPlay loop className="max-h-[650px] w-auto rounded-3xl shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                       <div className="mt-8 flex items-center gap-3">
                          <Button onClick={() => downloadVideo(selectedVideo.url, `ai-vid-${selectedVideo.id}.mp4`)} className="rounded-full bg-purple-500 hover:bg-purple-600 font-bold h-10 px-8"><Download size={16} className="ml-2" /> تحميل الفيديو</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 h-10 w-10 border border-red-500/20" onClick={(e) => deleteFromHistory(selectedVideo.id, e)}><Trash2 size={18} /></Button>
                       </div>
                       <BorderBeam />
                    </motion.div>
                 ) : isGenerating || isProcessing ? <AILoader /> : (
                    <div className="text-center group">
                       <Play size={100} className="text-purple-500/5 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 animate-pulse" />
                       <p className="text-sm text-gray-500 max-w-sm">صف المشهد وسنقوم بتحويله إلى فيديو سينمائي احترافي باستخدام Veo 2.0 Pro.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>

           {history.length > 0 && (
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-purple-500" /> الفيديوهات المنتجة ({history.length})</h4>
                    <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {history.map(vid => (
                       <div key={vid.id} className="relative group aspect-video rounded-2xl cursor-pointer overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all shadow-lg" onClick={() => setSelectedVideo(vid)}>
                          <video src={vid.url} className={clsx("w-full h-full object-cover transition-all", selectedVideo?.id === vid.id ? "scale-110 opacity-100 border-2 border-purple-500" : "opacity-40 hover:opacity-100")} />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                             <Play size={20} className="text-white fill-white" />
                          </div>
                          <button onClick={(e) => deleteFromHistory(vid.id, e)} className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"><X size={10} /></button>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </section>
      </main>

      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لتحويل النص لفيديو"
        description="للاستفادة من تقنية توليد الفيديوهات الاحترافية بدقة عالية واستخدام نماذج Veo 2.0 Pro المتطورة, تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

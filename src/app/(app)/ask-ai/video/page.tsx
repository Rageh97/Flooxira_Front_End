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
    if (stats && !stats.isUnlimited && stats.remainingCredits < 50) return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 50 كريديت)");

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

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(vid => vid.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_video_history", JSON.stringify(newHistory));
    if (selectedVideo?.id === id) setSelectedVideo(null);
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

  // إعادة توليد الفيديو بنفس الإعدادات
  const handleRegenerate = async () => {
    if (!selectedVideo) return;
    setPrompt(selectedVideo.prompt);
    setSelectedRatio(selectedVideo.aspectRatio);
    setSelectedStyle(selectedVideo.style);
    await handleGenerate();
  };

  // إضافة صوت للفيديو - Text to Speech
  const handleAddAudio = async () => {
    if (!selectedVideo || !audioText.trim()) {
      return showError("تنبيه", "يرجى كتابة النص الصوتي");
    }
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 30) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 30 كريديت)");
    }

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
      showSuccess("تم محاكاة إضافة الصوت بنجاح! (ملاحظة: هذه عملية تجريبية)");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء إضافة الصوت");
    } finally {
      setIsProcessing(false);
    }
  };

  // تحسين جودة الفيديو
  const handleEnhanceVideo = async (enhancement: 'stabilize' | 'denoise' | 'upscale' | 'colorgrade') => {
    if (!selectedVideo) return;
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 40) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 40 كريديت)");
    }

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
      
      showSuccess("تم محاكاة تحسين الفيديو بنجاح! (ملاحظة: هذه عملية تجريبية)");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التحسين");
    } finally {
      setIsProcessing(false);
    }
  };

  if (permissionsLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#00050a]">
      <Loader text="جاري  التحميل ..." size="lg" variant="warning" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#00050a] text-white overflow-x-hidden rounded-2xl selection:bg-purple-500/30 selection:text-purple-200 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 supports-[backdrop-filter]:bg-[#00050a]/50">
        <div className=" mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 hover:scale-110 transition-all duration-300">
                <ArrowRight className="h-5 w-5 text-white group-hover:text-white" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
              <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                نص إلى فيديو
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono tracking-widest uppercase">
                Veo 2.0 Pro
              </span>
            </h1>
          </div>

          {stats && (
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-full pl-2 pr-4 py-1.5 border border-white/5 shadow-inner">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  <Zap size={14} className="text-white fill-white" />
               </div>
               <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] text-gray-400 font-medium">الرصيد</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {stats.isUnlimited ? "∞" : stats.remainingCredits}
                  </span>
               </div>
            </div>
          )}
        </div>
      </header>

      <main className=" mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Aspect Ratio Card */}
            <div className=" relative bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-1 transition-all duration-500 ">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                     <Sliders size={18} />
                   </div>
                   <span className="font-bold text-sm text-gray-200">أبعاد الفيديو</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = selectedRatio === ratio.value;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSelectedRatio(ratio.value)}
                        className={clsx(
                          "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden group",
                          isSelected ? "bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/50" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {isSelected && <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />}
                        
                        {/* Visual Box */}
                        <div className={clsx(
                          "border-2 rounded-sm transition-all duration-300 z-10 box-content",
                          isSelected ? "border-purple-400 scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "border-gray-500 group-hover:border-gray-400",
                          ratio.id === "1:1" ? "w-6 h-6" : 
                          ratio.id === "16:9" ? "w-9 h-5" : "w-5 h-9"
                        )} />
                        
                        <div className="flex flex-col items-center z-10 gap-0.5">
                            <span className={clsx(
                            "text-[10px] font-bold font-mono tracking-wider transition-colors",
                            isSelected ? "text-purple-300" : "text-gray-400"
                            )}>
                            {ratio.value}
                            </span>
                            <span className={clsx(
                                "text-[9px] font-medium transition-colors",
                                isSelected ? "text-purple-200" : "text-gray-600"
                            )}>{ratio.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Styles Card */}
            <div className=" relative bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-1 transition-all duration-500 ">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                     <Palette size={18} />
                   </div>
                   <span className="font-bold text-sm text-gray-200">النمط الإخراجي</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={clsx(
                          "relative p-3 rounded-xl text-right transition-all duration-300 overflow-hidden group/item border",
                          isSelected ? "border-white/20" : "border-transparent bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${style.color}`} />
                        )}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className={clsx(
                            "text-xs font-bold transition-colors",
                            isSelected ? "text-white" : "text-gray-400"
                          )}>{style.label}</span>
                          {isSelected && <Sparkles size={10} className="text-white animate-pulse" />}
                        </div>
                        {isSelected && (
                           <motion.div 
                             layoutId="active-glow-vid"
                             className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${style.color}`}
                           />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sound Toggle Card */}
            <div className=" relative bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-1 transition-all duration-500 ">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                   <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <Volume2 size={18} />
                      </div>
                      <span className="font-bold text-sm text-gray-200">إعدادات الصوت</span>
                   </div>
                   <div 
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-all duration-500 cursor-pointer p-1 relative",
                      includeAudio ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-white/10"
                    )}
                   >
                     <motion.div 
                       animate={{ x: includeAudio ? 24 : 0 }}
                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                       className="w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden"
                     >
                        {includeAudio ? <Volume2 size={8} className="text-blue-600" /> : <VolumeX size={8} className="text-gray-400" />}
                     </motion.div>
                   </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-gray-400 leading-relaxed px-1">
                    {includeAudio 
                      ? "سيقوم الذكاء الاصطناعي بتوليد مؤثرات صوتية وموسيقى خلفية متوافقة مع الفيديو."
                      : "سيتم توليد فيديو صامت بدون صوت."}
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Editing Tools */}
            {selectedVideo && (
              <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wand2 size={80} />
                </div>
                <h3 className="text-sm font-bold text-white mb-4 relative z-10 flex items-center gap-2">
                  <Wand2 size={16} className="text-indigo-400" />
                  أدوات التعديل المتقدمة
                </h3>
                
                <div className="relative z-10 space-y-4">
                  {/* Add Audio Section */}
                  <div className="space-y-3 p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 size={14} className="text-purple-400" />
                      <span className="text-xs font-bold text-purple-200">إضافة صوت (TTS)</span>
                      <span className="text-[8px] text-gray-500 mr-auto">30 كريديت</span>
                    </div>
                    
                    <textarea
                      value={audioText}
                      onChange={(e) => setAudioText(e.target.value)}
                      placeholder="اكتب النص الذي تريد تحويله إلى صوت..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 resize-none"
                      rows={3}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                      
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                      >
                        <option value="ar-XA-Standard-A">صوت رجالي</option>
                        <option value="ar-XA-Standard-B">صوت نسائي</option>
                      </select>
                    </div>
                    
                    <Button
                      onClick={handleAddAudio}
                      disabled={isProcessing || isGenerating || !audioText.trim()}
                      className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-9"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-2" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <>
                          <Mic size={14} className="mr-2" />
                          إضافة الصوت
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Enhancement Options */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkle size={14} className="text-amber-400" />
                      <span className="text-xs font-bold text-amber-200">تحسينات الفيديو</span>
                      <span className="text-[8px] text-gray-500 mr-auto">40 كريديت</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleEnhanceVideo('upscale')}
                        disabled={isProcessing || isGenerating}
                        className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 text-emerald-300 h-auto py-3 flex flex-col items-center gap-1"
                      >
                        <ArrowUpCircle size={16} />
                        <span className="text-xs">رفع الجودة</span>
                      </Button>
                      
                      <Button
                        onClick={() => handleEnhanceVideo('stabilize')}
                        disabled={isProcessing || isGenerating}
                        className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 text-blue-300 h-auto py-3 flex flex-col items-center gap-1"
                      >
                        <Film size={16} />
                        <span className="text-xs">تثبيت الصورة</span>
                      </Button>
                      
                      <Button
                        onClick={() => handleEnhanceVideo('denoise')}
                        disabled={isProcessing || isGenerating}
                        className="rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20 text-violet-300 h-auto py-3 flex flex-col items-center gap-1"
                      >
                        <Sparkles size={16} />
                        <span className="text-xs">إزالة التشويش</span>
                      </Button>
                      
                      <Button
                        onClick={() => handleEnhanceVideo('colorgrade')}
                        disabled={isProcessing || isGenerating}
                        className="rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 border border-pink-500/20 text-pink-300 h-auto py-3 flex flex-col items-center gap-1"
                      >
                        <Palette size={16} />
                        <span className="text-xs">تحسين الألوان</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inspiration Tip */}
            {/* {!selectedVideo && (
              <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Film size={80} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 relative z-10">نصيحة للمخرج</h3>
                <p className="text-xs text-gray-400 leading-relaxed relative z-10">
                  صِف حركة الكاميرا بوضوح مثل "Slow zoom in" أو "Dolly shot" أو "Cinematic drone view" للحصول على نتائج سينمائية مذهلة.
                </p>
              </div>
            )} */}
          </div>
        </aside>

        {/* Center: Workspace */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Prompt Input Area */}
          <div className="relative group">
            {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-[34px] opacity-30 blur-lg group-hover:opacity-60 transition duration-1000" /> */}
            <div className="relative bg-[#0a0c10] rounded-[32px] p-2 border border-text-primary/20 shadow-2xl">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="وصف مشهد الفيديو..."
                  className="w-full min-h-[140px] bg-transparent text-white p-6 pb-20 text-lg md:text-xl font-medium placeholder:text-gray-600 outline-none resize-none scrollbar-hide rounded-[28px]"
                  style={{ lineHeight: '1.6' }}
                />
                
               
              </div>
              <BorderBeam duration={8} size={150} />
            </div>
            
          </div>
           <div className=" flex items-center justify-between">
                   <div className="flex gap-2">
                      {/* <Button 
                        variant="none" 
                        size="sm" 
                        onClick={() => setPrompt("")}
                        className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full h-10 px-4 transition-all"
                      >
                         <RefreshCw size={14} className="ml-2" />
                         مسح
                      </Button> */}
                   </div>
                   
                   <GradientButton
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    loading={isGenerating}
                    loadingText="جاري الإنتاج..."
                    loadingIcon={<Loader2 className="animate-spin" />}
                    icon={<Video className={prompt.trim() ? "animate-pulse" : ""} />}
                    size="md"
                    className="h-12 px-8 rounded-full font-bold tracking-wide"
                  >
                    توليد الفيديو
                  </GradientButton>
                </div>
          

          {/* Main Display Area */}
          <div className="flex-1 min-h-[500px] flex flex-col">
             <AnimatePresence mode="wait">
                {selectedVideo ? (
                   <motion.div
                      key="result-vid"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="relative flex-1 rounded-[40px] bg-[#00050a] border border-text-primary/20 overflow-hidden group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
                   >
                      {/* Close Button */}
                      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedVideo(null)}
                            className="rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md"
                         >
                            <X size={18} />
                         </Button>
                      </div>

                      <div className="relative h-full w-full flex items-center justify-center p-8 bg-black">
                         <video 
                           src={selectedVideo.url} 
                           controls
                           autoPlay
                           loop
                           className={clsx(
                              "max-h-[600px] w-auto max-w-full rounded-2xl shadow-2xl transition-transform duration-700",
                              "ring-1 ring-white/10"
                           )}
                         />
                      </div>

                      {/* Floating Actions Bar */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                         {/* Main Actions */}
                         <div className="flex items-center gap-3 p-2 bg-black/60 backdrop-blur-2xl border border-text-primary/20 rounded-full shadow-2xl">
                            <Button 
                              onClick={() => downloadVideo(selectedVideo.url, `ai-vid-${selectedVideo.id}.mp4`)}
                              className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-10 px-5 font-bold"
                            >
                               <Download size={16} className="mr-2" />
                               تحميل الفيديو
                            </Button>
                            <div className="w-px h-6 bg-white/20" />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-full hover:bg-purple-500/20 text-purple-400 hover:text-purple-300"
                              onClick={handleRegenerate}
                              disabled={isGenerating || isProcessing}
                            >
                               <RefreshCw size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-400"
                              onClick={(e) => deleteFromHistory(selectedVideo.id, e)}
                            >
                               <Trash2 size={16} />
                            </Button>
                         </div>
                      </div>
                   </motion.div>
                ) : isGenerating ? (
                  <AILoader />
                ) : (
                   <motion.div
                      key="empty-vid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 rounded-[40px] border-2 border-dashed border-text-primary/20 flex flex-col items-center justify-center p-12 text-center hover:bg-white/[0.01] transition-colors group px-6"
                   >
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 group-hover:border-purple-500/20">
                         <Play size={32} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">استوديو الفيديو الخاص بك جاهز</h3>
                      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                        اكتب سيناريو بسيط في الأعلى وسيقوم Veo 2.0 Pro بتحويله إلى فيديو عالي الجودة.
                      </p>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* History Strip */}
          {history.length > 0 && (
             <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-lg font-bold flex items-center gap-2 text-white">
                      <History size={18} className="text-purple-400" />
                      فيديوهات سابقة
                   </h4>
                   <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="text-xs text-red-500/50 hover:text-red-400 hover:bg-red-500/10 h-8 rounded-full">
                      مسح الكل
                   </Button>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                   {history.map((vid) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={vid.id}
                        onClick={() => setSelectedVideo(vid)}
                        className={clsx(
                           "aspect-video rounded-2xl cursor-pointer overflow-hidden border transition-all duration-300 relative group bg-black/40 flex items-center justify-center",
                           selectedVideo?.id === vid.id ? "border-purple-500 ring-2 ring-purple-500/20 z-10 scale-105" : "border-white/5 hover:border-white/20 hover:scale-105"
                        )}
                      >
                         <div className="absolute inset-0 z-0">
                            <video src={vid.url} className="w-full h-full object-cover opacity-60" />
                         </div>
                         <div className="relative z-10 p-2 bg-black/40 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <Play size={12} className="text-white fill-white" />
                         </div>
                      </motion.div>
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
        title="اشتراك مطلوب لتوليد الفيديوهات"
        description="للاستفادة من تقنيات توليد وتحرير الفيديوهات بالذكاء الاصطناعي، تحتاج إلى اشتراك نشط. أنشئ فيديوهات سينمائية مذهلة من النصوص!"
        hasAIPlans={hasAIPlans}
      />
      
      <style jsx global>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-gradient-xy {
           background-size: 200% 200%;
           animation: gradient-xy 6s ease infinite;
        }
        @keyframes gradient-xy {
           0%, 100% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

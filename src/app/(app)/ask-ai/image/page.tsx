"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  RefreshCw, 
  Maximize2, 
  Trash2,
  ChevronRight,
  Settings2,
  Sliders,
  Palette,
  Layers,
  Zap,
  Loader2,
  AlertCircle,
  Wand2,
  Cpu,
  History,
  ArrowRight,
  X,
  Expand,
  ArrowUpCircle,
  Eraser,
  Copy,
  Scissors
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  generateAIImage, 
  editImageInpainting,
  editImageOutpainting,
  upscaleImage,
  removeImageBackground,
  listPlans,
  type AIStats 
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";

// --- Configuration Constants ---
const ASPECT_RATIOS = [
  { id: "1:1", label: "مربع", icon: "square", value: "1:1" },
  // { id: "4:3", label: "أفقي", icon: "landscape", value: "4:3" },
  { id: "3:4", label: "عمودي", icon: "portrait", value: "3:4" },
  { id: "16:9", label: "سينمائي", icon: "wide", value: "16:9" },
  { id: "9:16", label: "ستوري", icon: "tall", value: "9:16" },
];

const STYLE_PRESETS = [
  { id: "none", label: "حر", prompt: "", color: "from-gray-500 to-slate-500" },
  { id: "cinematic", label: "سينمائي", prompt: ", cinematic lighting, dramatic atmosphere, high contrast, 8k, ultra realistic, depth of field", color: "from-amber-500 to-orange-600" },
  { id: "photorealistic", label: "واقعي", prompt: ", photorealistic, hyper-realistic, 8k resolution, raw photo, f/1.8, sharp focus", color: "from-emerald-500 to-teal-600" },
  { id: "anime", label: "أنمي", prompt: ", anime style, vibrant colors, studio ghibli aesthetic, detailed line art", color: "from-blue-400 to-indigo-500" },
  { id: "cyberpunk", label: "سايبر بانك", prompt: ", cyberpunk theme, neon lights, futuristic city, high tech, dark atmosphere", color: "from-cyan-500 to-blue-600" },
  { id: "3d-render", label: "3D", prompt: ", 3d render, octane render, unreal engine 5, pixar style, clay material", color: "from-violet-500 to-indigo-600" },
  { id: "oil", label: "زيتي", prompt: ", oil painting, thick brush strokes, museum quality, classic art", color: "from-yellow-600 to-amber-700" },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
  style: string;
}

const MODEL_OPTIONS = [
  { id: "imagen-4.0", label: "Imagen 4.0 Pro", value: "imagen-4.0-generate-001", description: "الأحدث والأكثر دقة" },
  { id: "imagen-3.0", label: "Imagen 3.0", value: "imagen-3.0-generate-001", description: "كلاسيكي ومستقر" },
  { id: "imagen-3.0-fast", label: "Imagen 3.0 Fast", value: "imagen-3.0-fast-001", description: "سرعة مضاعفة" },
];

export default function TextToImagePage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [selectedModel, setSelectedModel] = useState("imagen-4.0-generate-001");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editMode, setEditMode] = useState<'none' | 'inpaint' | 'outpaint' | 'upscale' | 'remove-bg'>('none');
  const [editPrompt, setEditPrompt] = useState("");
  const textareaRef = typeof window !== "undefined" ?  require("react").useRef<HTMLTextAreaElement>(null) : { current: null };
  const [outpaintDirection, setOutpaintDirection] = useState<'left' | 'right' | 'up' | 'down'>('right');
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_image_history");
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  useEffect(() => {
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem("ai_image_history", JSON.stringify(history));
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
    if (!prompt.trim()) return showError("تنبيه", "أطلق العنان لخيالك واكتب وصفاً للصورة!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 10) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsGenerating(true);
    try {
      const styleConfig = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const finalPrompt = prompt.trim() + (styleConfig?.prompt || "");

      const response = await generateAIImage(token, {
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
        model: selectedModel
      });

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        aspectRatio: selectedRatio,
        style: selectedStyle,
      };

      setHistory([newImage, ...history]);
      setSelectedImage(newImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم بناء خيالك بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء الرسم");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_image_history", JSON.stringify(newHistory));
    if (selectedImage?.id === id) setSelectedImage(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearAllHistory = () => {
    if (window.confirm("هل أنت متأكد من حذف جميع الأعمال؟")) {
      setHistory([]);
      localStorage.removeItem("ai_image_history");
      setSelectedImage(null);
      showSuccess("تم حذف جميع الأعمال!");
    }
  };

  const downloadImage = async (url: string, filename: string) => {
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
    if (!selectedImage) return;
    setPrompt(selectedImage.prompt);
    setSelectedRatio(selectedImage.aspectRatio);
    setSelectedStyle(selectedImage.style);
    await handleGenerate();
  };

  const handleInpaint = async () => {
    if (!selectedImage || !editPrompt.trim()) return showError("تنبيه", "يرجى كتابة وصف للتعديل المطلوب");
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await editImageInpainting(token, {
        imageUrl: selectedImage.url,
        prompt: editPrompt.trim(),
      });

      const editedImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: `${selectedImage.prompt} (تعديل: ${editPrompt})`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
      };

      setHistory([editedImage, ...history]);
      setSelectedImage(editedImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      setEditMode('none');
      setEditPrompt("");
      showSuccess("تم تعديل الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التعديل");
    } finally { setIsProcessing(false); }
  };

  const handleOutpaint = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await editImageOutpainting(token, {
        imageUrl: selectedImage.url,
        direction: outpaintDirection,
        prompt: editPrompt.trim() || selectedImage.prompt,
      });

      const expandedImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: `${selectedImage.prompt} (توسيع ${outpaintDirection})`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
      };

      setHistory([expandedImage, ...history]);
      setSelectedImage(expandedImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      setEditMode('none');
      setEditPrompt("");
      showSuccess("تم توسيع الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التوسيع");
    } finally { setIsProcessing(false); }
  };

  const handleUpscale = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 20) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await upscaleImage(token, {
        imageUrl: selectedImage.url,
        scale: 2,
      });

      const upscaledImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: `${selectedImage.prompt} (جودة عالية)`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
      };

      setHistory([upscaledImage, ...history]);
      setSelectedImage(upscaledImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      setEditMode('none');
      showSuccess("تم تحسين جودة الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التحسين");
    } finally { setIsProcessing(false); }
  };

  const handleRemoveBackground = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 10) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await removeImageBackground(token, selectedImage.url);

      const noBgImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: `${selectedImage.prompt} (بدون خلفية)`,
        timestamp: new Date().toISOString(),
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
      };

      setHistory([noBgImage, ...history]);
      setSelectedImage(noBgImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      setEditMode('none');
      showSuccess("تم إزالة الخلفية بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء إزالة الخلفية");
    } finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200 font-sans" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-cyan-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 shadow-2xl">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 rotate-180" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">نص الى صورة</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-mono tracking-widest">IMAGEN 4.0</span>
            </h1>
          </div>
          {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/5 font-mono"><Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px]">
        <aside className="lg:col-span-4 space-y-4">
           <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 shadow-2xl">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 justify-start mb-2">
                    <Sliders size={18} className="text-blue-400" />
                    <span className="font-bold text-sm text-gray-200">أبعاد اللوحة</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {ASPECT_RATIOS.map(ratio => (
                       <button 
                         key={ratio.id} 
                         onClick={() => setSelectedRatio(ratio.value)} 
                         className={clsx(
                           "group relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 border overflow-hidden", 
                           selectedRatio === ratio.value 
                             ? "bg-blue-600/20 border-blue-400 text-white " 
                             : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                         )}
                       >
                          <div className={clsx(
                            "border-2 rounded-sm mb-2 transition-all duration-300", 
                            selectedRatio === ratio.value ? "border-white scale-110 shadow-sm" : "border-gray-600 group-hover:border-gray-400", 
                            ratio.id === "1:1" ? "w-5 h-5" : ratio.id === "16:9" ? "w-7 h-4" : "w-4 h-7"
                          )} />
                          <span className="text-[11px] font-bold">{ratio.label}</span>
                          {selectedRatio === ratio.value && (
                            <motion.div layoutId="ratio-active" className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent pointer-none" />
                          )}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 justify-start mb-2">
                    <Palette size={18} className="text-cyan-400" />
                    <span className="font-bold text-sm text-gray-200">النمط الفني</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {STYLE_PRESETS.map(style => (
                       <button 
                         key={style.id} 
                         onClick={() => setSelectedStyle(style.id)} 
                         className={clsx(
                           "relative h-11 px-3 rounded-xl text-right transition-all duration-300 border text-[11px] font-bold overflow-hidden group", 
                           selectedStyle === style.id 
                             ? "bg-gradient-to-l border-transparent text-white shadow-lg" 
                             : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20",
                           selectedStyle === style.id ? style.color : ""
                         )}
                       >
                         <span className="relative z-10">{style.label}</span>
                         {selectedStyle === style.id && (
                           <div className="absolute inset-0 bg-white/10 animate-pulse" />
                         )}
                         <div className={clsx(
                           "absolute -left-1 -bottom-1 w-6 h-6 rounded-full blur-md transition-all duration-500 group-hover:scale-150", 
                           style.color.replace('from-', 'bg-').split(' ')[0]
                         )} />
                       </button>
                    ))}
                 </div>
              </div>

              {selectedImage && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                   <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2 justify-end">أدوات تعديل احترافية <Wand2 size={14} /></h4>
                   <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleUpscale} disabled={isProcessing} className="rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] h-10 gap-2"><ArrowUpCircle size={14} /> تحسين</Button>
                      <Button onClick={handleRemoveBackground} disabled={isProcessing} className="rounded-xl bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[10px] h-10 gap-2"><Eraser size={14} /> إزالة خلفية</Button>
                      <Button onClick={() => setEditMode('inpaint')} className={clsx("rounded-xl border text-[10px] h-10 gap-2", editMode === 'inpaint' ? "bg-blue-500 font-white" : "bg-blue-500/10 text-blue-300 border-blue-500/20")}><Scissors size={14} /> تعديل جزء</Button>
                      <Button onClick={() => setEditMode('outpaint')} className={clsx("rounded-xl border text-[10px] h-10 gap-2", editMode === 'outpaint' ? "bg-violet-500 text-white" : "bg-violet-500/10 text-violet-300 border-violet-500/20")}><Expand size={14} /> توسيع</Button>
                   </div>
                </div>
              )}
           </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
            <div className="relative bg-[#0a0c10] rounded-[32px] p-4 border border-white/10 shadow-2xl group transition-all focus-within:border-blue-500/50">
              <textarea 
                ref={textareaRef}
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="أطلق عنان خيالك واكتب وصفاً للصورة بانتظار إبداعك..." 
                className="w-full min-h-[60px] bg-transparent text-white p-4 text-xl placeholder:text-gray-700 outline-none resize-none text-right transition-all" 
                dir="rtl" 
              />
              <div className="flex justify-between items-center px-4 pb-4">
                 {/* <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setPrompt("")} className="text-gray-500 hover:text-white"><RefreshCw size={16} /></Button>
                 </div> */}
                 <GradientButton onClick={handleGenerate} disabled={!prompt.trim()} loading={isGenerating} loadingText="جاري الأنشاء..." icon={<Sparkles />} size="lg" className="rounded-2xl px-8">ابدأ التوليد</GradientButton>
              </div>
              <BorderBeam size={100} duration={8} />
           </div>

           <div className="relative min-h-[600px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 overflow-hidden group/result">
              <AnimatePresence mode="wait">
                 {selectedImage ? (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       {/* Close Button */}
                       <div className="absolute top-0 left-0 z-30">
                          <button onClick={() => setSelectedImage(null)} className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20"><X size={14} /></button>
                       </div>
                       <img src={selectedImage.url} className="max-h-[650px] rounded-2xl shadow-3xl transition-transform duration-500 hover:scale-[1.01]" />
                       <div className="mt-8 flex items-center gap-3">
                          <Button onClick={() => downloadImage(selectedImage.url, `ai-art-${selectedImage.id}.png`)} className="rounded-full bg-blue-500 hover:bg-blue-600 font-bold h-10 px-8"><Download size={16} className="ml-2" /> تحميل الصورة</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 h-10 w-10 border border-red-500/20" onClick={(e) => deleteFromHistory(selectedImage.id, e)}><Trash2 size={18} /></Button>
                       </div>
                       <BorderBeam />
                    </motion.div>
                 ) : isGenerating || isProcessing ? <AILoader /> : (
                    <div className="text-center group">
                       <ImageIcon size={100} className="text-blue-500/20 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                       {/* <h3 className="text-2xl font-bold text-white mb-2">أهلاً بك في استوديو الخيال</h3> */}
                       <p className="text-sm text-gray-500 max-w-sm">صف ما تريده وسنقوم بتحويله إلى لوحة فنية فريدة في ثوانٍ.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>

           {history.length > 0 && (
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-widest"><History size={14} className="text-blue-500" /> معرض الأعمال ({history.length})</h4>
                    <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-red-400 hover:bg-red-500/10 h-8 rounded-full text-xs transition-colors">مسح الكل</Button>
                 </div>
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                    {history.map(img => (
                       <div key={img.id} className="relative group aspect-square rounded-2xl cursor-pointer overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all shadow-lg" onClick={() => setSelectedImage(img)}>
                          <img src={img.url} className={clsx("w-full h-full object-cover transition-all", selectedImage?.id === img.id ? "scale-110 opacity-100 border-2 border-blue-500" : "opacity-40 hover:opacity-100")} />
                          <button onClick={(e) => deleteFromHistory(img.id, e)} className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"><X size={10} /></button>
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
        title="اشتراك مطلوب لتحويل النص لصور"
        description="للاستفادة من تقنية التوليد المستمر للصور الاحترافية بدقة عالية واستخدام نماذج Imagen 4.0 المتطورة, تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

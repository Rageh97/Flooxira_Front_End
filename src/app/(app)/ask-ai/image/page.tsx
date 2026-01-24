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
  { id: "4:3", label: "أفقي", icon: "landscape", value: "4:3" },
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
    if (stats && !stats.isUnlimited && stats.remainingCredits < 10) return showError("تنبيه", "رصيدك غير كافٍ   ");

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

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_image_history", JSON.stringify(newHistory));
    if (selectedImage?.id === id) setSelectedImage(null);
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

  // إعادة توليد الصورة بنفس الإعدادات
  const handleRegenerate = async () => {
    if (!selectedImage) return;
    setPrompt(selectedImage.prompt);
    setSelectedRatio(selectedImage.aspectRatio);
    setSelectedStyle(selectedImage.style);
    await handleGenerate();
  };

  // تعديل الصورة - Inpainting
  const handleInpaint = async () => {
    if (!selectedImage || !editPrompt.trim()) {
      return showError("تنبيه", "يرجى كتابة وصف للتعديل المطلوب");
    }
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 15 كريديت)");
    }

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
    } finally {
      setIsProcessing(false);
    }
  };

  // توسيع الصورة - Outpainting
  const handleOutpaint = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 15 كريديت)");
    }

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
    } finally {
      setIsProcessing(false);
    }
  };

  // تحسين جودة الصورة - Upscale
  const handleUpscale = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 20) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 20 كريديت)");
    }

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
    } finally {
      setIsProcessing(false);
    }
  };

  // إزالة الخلفية
  const handleRemoveBackground = async () => {
    if (!selectedImage) return;
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 10) {
      return showError("تنبيه", "رصيدك غير كافٍ (تحتاج 10 كريديت)");
    }

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
    } finally {
      setIsProcessing(false);
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-cyan-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80 supports-[backdrop-filter]:bg-[#00050a]/50">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 hover:scale-110 transition-all duration-300">
                <ArrowRight className="h-5 w-5 text-white group-hover:text-white" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
               نص الى صورة
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-mono tracking-widest uppercase">
                Nano banana bro 🍌
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
        <aside className="lg:col-span-4 space-y-2">
          <div className="sticky top-24 space-y-2">
            
            {/* Aspect Ratio Card */}
            <div className=" relative bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-1 transition-all duration-500 ">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                     <Sliders size={18} />
                   </div>
                   <span className="font-bold text-sm text-gray-200">أبعاد اللوحة</span>
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
                          isSelected ? "bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/50" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {isSelected && <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />}
                        
                        {/* Visual Box */}
                        <div className={clsx(
                          "border-2 rounded-sm transition-all duration-300 z-10 box-content",
                          isSelected ? "border-blue-400 scale-110 shadow-[0_0_10px_rgba(96,165,250,0.5)]" : "border-gray-500 group-hover:border-gray-400",
                          ratio.id === "1:1" ? "w-6 h-6" : 
                          ratio.id === "4:3" ? "w-8 h-6" :
                          ratio.id === "3:4" ? "w-6 h-8" :
                          ratio.id === "16:9" ? "w-9 h-5" : "w-5 h-9"
                        )} />
                        
                        <div className="flex flex-col items-center z-10 gap-0.5">
                            <span className={clsx(
                            "text-[10px] font-bold font-mono tracking-wider transition-colors",
                            isSelected ? "text-blue-300" : "text-gray-400"
                            )}>
                            {ratio.value}
                            </span>
                            <span className={clsx(
                                "text-[9px] font-medium transition-colors",
                                isSelected ? "text-blue-200" : "text-gray-600"
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                     <Palette size={18} />
                   </div>
                   <span className="font-bold text-sm text-gray-200">النمط الفني</span>
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
                             layoutId="active-glow"
                             className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${style.color}`}
                           />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Models Card */}
            {/* <div className=" relative bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-1 transition-all duration-500 ">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                     <Cpu size={18} />
                   </div>
                   <span className="font-bold text-sm text-gray-200">محرك الرسم</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {MODEL_OPTIONS.map((model) => {
                    const isSelected = selectedModel === model.value;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.value)}
                        className={clsx(
                          "relative p-3 rounded-xl text-right transition-all duration-300 overflow-hidden group/item border",
                          isSelected ? "border-purple-500/50 bg-purple-500/5" : "border-transparent bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex flex-col text-right">
                            <span className={clsx(
                              "text-xs font-bold transition-colors",
                              isSelected ? "text-purple-300" : "text-gray-400"
                            )}>{model.label}</span>
                            <span className="text-[9px] text-gray-600">{model.description}</span>
                          </div>
                          {isSelected && <Zap size={12} className="text-purple-400 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div> */}

            {/* Advanced Editing Tools */}
            {selectedImage && (
              <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wand2 size={80} />
                </div>
                <h3 className="text-sm font-bold text-white mb-4 relative z-10 flex items-center gap-2">
                  <Wand2 size={16} className="text-purple-400" />
                  أدوات التعديل المتقدمة
                </h3>
                
                <div className="relative z-10 space-y-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button
                      onClick={handleUpscale}
                      disabled={isProcessing || isGenerating}
                      className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 text-emerald-300 h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <ArrowUpCircle size={16} />
                      <span className="text-xs">تحسين الجودة</span>
                      <span className="text-[8px] text-gray-500">20 كريديت</span>
                    </Button>
                    
                    <Button
                      onClick={handleRemoveBackground}
                      disabled={isProcessing || isGenerating}
                      className="rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 border border-pink-500/20 text-pink-300 h-auto py-3 flex flex-col items-center gap-1"
                    >
                      <Eraser size={16} />
                      <span className="text-xs">إزالة الخلفية</span>
                      <span className="text-[8px] text-gray-500">10 كريديت</span>
                    </Button>
                    
                    <Button
                      onClick={() => setEditMode(editMode === 'inpaint' ? 'none' : 'inpaint')}
                      disabled={isProcessing || isGenerating}
                      className={clsx(
                        "rounded-xl border h-auto py-3 flex flex-col items-center gap-1",
                        editMode === 'inpaint' 
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-300" 
                          : "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-500/20 text-blue-300"
                      )}
                    >
                      <Scissors size={16} />
                      <span className="text-xs">تعديل جزء</span>
                      <span className="text-[8px] text-gray-500">15 كريديت</span>
                    </Button>
                    
                    <Button
                      onClick={() => setEditMode(editMode === 'outpaint' ? 'none' : 'outpaint')}
                      disabled={isProcessing || isGenerating}
                      className={clsx(
                        "rounded-xl border h-auto py-3 flex flex-col items-center gap-1",
                        editMode === 'outpaint' 
                          ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/50 text-violet-300" 
                          : "bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border-violet-500/20 text-violet-300"
                      )}
                    >
                      <Expand size={16} />
                      <span className="text-xs">توسيع الصورة</span>
                      <span className="text-[8px] text-gray-500">15 كريديت</span>
                    </Button>
                  </div>

                  {/* Inpaint/Outpaint Controls */}
                  {(editMode === 'inpaint' || editMode === 'outpaint') && (
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      {editMode === 'outpaint' && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {(['right', 'left', 'up', 'down'] as const).map((dir) => (
                            <button
                              key={dir}
                              onClick={() => setOutpaintDirection(dir)}
                              className={clsx(
                                "p-2 rounded-lg text-xs transition-all",
                                outpaintDirection === dir 
                                  ? "bg-violet-500/30 text-violet-200 ring-1 ring-violet-500/50" 
                                  : "bg-white/5 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              {dir === 'right' && 'يمين'}
                              {dir === 'left' && 'يسار'}
                              {dir === 'up' && 'أعلى'}
                              {dir === 'down' && 'أسفل'}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder={editMode === 'inpaint' ? "صف التعديل المطلوب..." : "وصف إضافي (اختياري)..."}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50"
                      />
                      
                      <Button
                        onClick={editMode === 'inpaint' ? handleInpaint : handleOutpaint}
                        disabled={isProcessing || isGenerating || (editMode === 'inpaint' && !editPrompt.trim())}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-9"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="animate-spin mr-2" />
                            جاري المعالجة...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="mr-2" />
                            {editMode === 'inpaint' ? 'تطبيق التعديل' : 'توسيع الصورة'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inspiration Tip */}
            {!selectedImage && (
              <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wand2 size={80} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 relative z-10">أطلق خيالك</h3>
                <p className="text-xs text-gray-400 leading-relaxed relative z-10">
                  جرب وصف مواد مثل "كرستال"، "نيون"، "بخار"، أو إضاءات مثل "ضوء القمر"، "غروب الشمس" لتحصل على نتائج مبهره.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Center: Workspace */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Prompt Input Area */}
          <div className="relative group">
            {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 rounded-[34px] opacity-30 blur-lg group-hover:opacity-60 transition duration-1000" /> */}
            <div className="relative  bg-[#0a0c10] rounded-[32px] p-2 border border-text-primary/20 shadow-2xl">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ما الذي يدور في ذهنك؟ ... "
                  className="w-full min-h-[140px] bg-transparent text-white p-6 pb-20 text-lg md:text-xl font-medium placeholder:text-gray-600 outline-none resize-none scrollbar-hide rounded-[28px] "
                  style={{ lineHeight: '1.6' }}
                />
                
               
              </div>
             <BorderBeam duration={8} size={150} />
            </div>
          </div>
           <div className=" flex items-center justify-between">
                   <div className="flex gap-2">
                      {/* <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPrompt("")}
                        className="text-gray-500  rounded-full h-6 px-2 transition-all"
                      >
                         <RefreshCw size={14} className="ml-2" />
                         مسح
                      </Button> */}
                   </div>
                   
                   <GradientButton
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    loading={isGenerating}
                    loadingText="جاري التخيل..."
                    loadingIcon={<Loader2 className="animate-spin" />}
                    icon={<Sparkles className={prompt.trim() ? "animate-pulse" : ""} />}
                    size="md"
                    className="h-12 px-8 rounded-full font-bold tracking-wide"
                  >
                    توليد الآن
                  </GradientButton>
                </div>

          {/* Main Display Area */}
          <div className="flex-1 min-h-[500px] flex flex-col">
             <AnimatePresence mode="wait">
                {selectedImage ? (
                   <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="relative flex-1 rounded-[40px] bg-[#00050a] border border-white/10 overflow-hidden group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
                   >
                      {/* Background Blur Effect */}
                      <div 
                        className="absolute inset-0 opacity-30 transform scale-150 blur-3xl saturate-200 pointer-events-none"
                        style={{ backgroundImage: `url(${selectedImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />

                      {/* Close Button */}
                      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedImage(null)}
                            className="rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md"
                         >
                            <X size={18} />
                         </Button>
                      </div>
                      
                      <div className="relative h-full w-full flex items-center justify-center p-8">
                         <img 
                           src={selectedImage.url} 
                           alt={selectedImage.prompt}
                           className={clsx(
                              "max-h-[600px] w-auto max-w-full rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.01] hover:cursor-zoom-in",
                              "ring-1 ring-white/10"
                           )}
                           onClick={() => window.open(selectedImage.url, '_blank')}
                         />
                      </div>

                      {/* Floating Actions Bar */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
                         {/* Main Actions */}
                         <div className="flex items-center gap-3 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl translate-y-5 transition-all duration-500">
                            <Button 
                              onClick={() => downloadImage(selectedImage.url, `ai-art-${selectedImage.id}.png`)}
                              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-10 px-5 font-bold"
                            >
                               <Download size={16} className="mr-2" />
                               تحميل
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
                              onClick={(e) => deleteFromHistory(selectedImage.id, e)}
                            >
                               <Trash2 size={16} />
                            </Button>
                         </div>

                         {/* Prompt Details */}
                         <div className="absolute top-6 left-6 right-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 max-w-2xl text-center">
                               <p className="text-sm text-gray-100 font-medium line-clamp-1">"{selectedImage.prompt}"</p>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                ) : isGenerating ? (
                   <AILoader />
                ) : (
                   <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 rounded-[40px] border-2 border-dashed border-text-primary/20 flex flex-col items-center justify-center p-12 text-center hover:bg-white/[0.01] transition-colors group"
                   >
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5 group-hover:border-white/10">
                         <ImageIcon size={32} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">مساحتك الإبداعية فارغة</h3>
                      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                        اختر نمطاً، حدد الأبعاد، واكتب ما يجول في خاطرك لنحوله إلى حقيقة رقمية.
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
                      <History size={18} className="text-blue-400" />
                      أعمالك السابقة
                   </h4>
                   <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="text-xs text-red-500/50 hover:text-red-400 hover:bg-red-500/10 h-8 rounded-full">
                      مسح الكل
                   </Button>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                   {history.map((img) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={clsx(
                           "aspect-square rounded-2xl cursor-pointer overflow-hidden border transition-all duration-300 relative group",
                           selectedImage?.id === img.id ? "border-blue-500 ring-2 ring-blue-500/20 z-10 scale-105" : "border-white/5 hover:border-white/20 hover:scale-105"
                        )}
                      >
                         <img src={img.url} alt="" className="w-full h-full object-cover" />
                         {selectedImage?.id === img.id && (
                            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[1px]" />
                         )}
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
        title="اشتراك مطلوب لتوليد الصور"
        description="للاستفادة من تقنيات توليد وتحرير الصور بالذكاء الاصطناعي، تحتاج إلى اشتراك نشط. أطلق العنان لإبداعك وحول أفكارك إلى صور مذهلة!"
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

"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Sliders,
  Palette,
  Zap,
  Loader2,
  Wand2,
  History,
  X,
  Expand,
  ArrowUpCircle,
  Eraser,
  Scissors,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/lib/permissions";
import AskAIToolHeader from "@/components/AskAIToolHeader";
import { 
  getAIStats, 
  generateAIImage, 
  editImageInpainting,
  editImageOutpainting,
  upscaleImage,
  removeImageBackground,
  listPlans,
  getAIHistory,
  deleteAIHistoryItem,
  clearAIHistory,
  type AIStats,
  type AIHistoryItem,
  getAIConfig
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { BorderBeam } from "@/components/ui/border-beam";
import { useRouter } from "next/navigation";

// --- Configuration Constants ---
const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", value: "1:1" },
  { id: "3:4", label: "3:4", value: "3:4" },
  { id: "16:9", label: "16:9", value: "16:9" },
  { id: "9:16", label: "9:16", value: "9:16" },
];

const MODEL_OPTIONS = [
  { id: "imagen-3.0", label: "Imagen 3.0", value: "imagen-3.0-generate-001", description: "كلاسيكي ومستقر ", badge: "الافتراضي" },
  { id: "imagen-3.0-fast", label: "Imagen 3.0 Fast", value: "imagen-3.0-fast-generate-001", description: "سرعة مضاعفة - اقتصادي " },
  { id: "imagen-4.0-fast", label: "Imagen 4.0 Fast ⚡", value: "imagen-4.0-fast-generate-001", description: "سرعة فائقة مع جودة ممتازة" },
  { id: "imagen-4.0", label: "Imagen 4.0 Pro", value: "imagen-4.0-generate-001", description: "الأحدث والأكثر دقة" },
  { id: "imagen-4.0-ultra", label: "Imagen 4.0 Ultra ✨", value: "imagen-4.0-ultra-generate-001", description: "أعلى جودة - تصاميم احترافية", badge: "الأفضل" },
];

const STYLE_PRESETS = [
  { id: "none", label: "حر", prompt: "", color: "from-gray-500 to-slate-500" },
  { id: "cinematic", label: "سينمائي", prompt: ", cinematic lighting, dramatic atmosphere, high contrast, 8k, ultra realistic, depth of field", color: "from-amber-500 to-orange-600" },
  { id: "photorealistic", label: "واقعي", prompt: ", photorealistic, hyper-realistic, 8k resolution, raw photo, f/1.8, sharp focus", color: "from-emerald-500 to-teal-600" },
  { id: "anime", label: "أنمي", prompt: ", anime style, vibrant colors, studio ghibli aesthetic, detailed line art", color: "from-blue-400 to-indigo-500" },
  { id: "cyberpunk", label: "سايبر بانك", prompt: ", cyberpunk theme, neon lights, futuristic city, high tech, dark atmosphere", color: "from-cyan-500 to-blue-600" },
  { id: "3d-render", label: "3D", prompt: ", 3d render, octane render, unreal engine 5, pixar style, clay material", color: "from-violet-500 to-indigo-600" },
];

interface GeneratedImage {
  id: string; // Database ID or placeholder
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
  style: string;
  isGenerating?: boolean;
  progress?: number;
}

export default function TextToImagePage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [selectedModel, setSelectedModel] = useState("imagen-3.0-generate-001");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [modelCosts, setModelCosts] = useState<Record<string, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const response = await getAIHistory(token, 'IMAGE');
      const mappedHistory: GeneratedImage[] = response.history.map((item: AIHistoryItem) => ({
        id: item.id.toString(),
        url: item.outputUrl,
        prompt: item.prompt,
        timestamp: item.createdAt,
        aspectRatio: (item.options as any)?.aspectRatio || "1:1",
        style: (item.options as any)?.style || "none",
      }));
      setHistory(mappedHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  useEffect(() => {
    if (token) {
      loadStats();
      checkAIPlans();
      loadHistory();
      getAIConfig(token).then(data => {
        if (data?.models) setModelCosts(data.models);
      }).catch(console.error);
    }
  }, [token]);



  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [prompt]);

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

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedImage = {
      id: placeholderId,
      url: "",
      prompt: prompt.trim(),
      timestamp: new Date().toISOString(),
      aspectRatio: selectedRatio,
      style: selectedStyle,
      isGenerating: true,
      progress: 0,
    };

    setHistory([placeholder, ...history]);
    setIsGenerating(true);

    const progressInterval = setInterval(() => {
      setHistory(prev => prev.map(img => 
        img.id === placeholderId && img.isGenerating
          ? { ...img, progress: Math.min((img.progress || 0) + Math.random() * 15, 90) }
          : img
      ));
    }, 500);

    try {
      const styleConfig = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const finalPrompt = prompt.trim() + (styleConfig?.prompt || "");

      const response = await generateAIImage(token, {
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
        model: selectedModel
      });

      clearInterval(progressInterval);

      // Validate response
      if (!response || !response.imageUrl) {
        throw new Error("لم يتم استلام رابط الصورة من السيرفر");
      }

      const newImage: GeneratedImage = {
        id: response.historyId?.toString() || placeholderId,
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        aspectRatio: selectedRatio,
        style: selectedStyle,
        isGenerating: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم بناء الصورة بنجاح!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      
      // Better error handling
      const errorMessage = error.message || "حدث خطأ أثناء الرسم";
      console.error("Image generation error:", error);
      
      showError("خطأ", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    
    // Optimistic UI update
    const originalHistory = [...history];
    setHistory(history.filter(img => img.id !== id));
    
    try {
      if (id.length < 15) { // Assuming DB IDs are numeric/short, and placeholder IDs are timestamps (long)
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedImage?.id === id) setSelectedImage(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الصورة من السجل السحابي");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال؟ لا يمكن التراجع عن هذه الخطوة من السحابة.")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);
    localStorage.removeItem("ai_image_history");

    try {
      await clearAIHistory(token, 'IMAGE');
      setSelectedImage(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل مسح السجل السحابي");
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

  const handleUpscale = async () => {
    if (!selectedImage || selectedImage.isGenerating) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 20) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await upscaleImage(token, {
        imageUrl: selectedImage.url,
        scale: 2,
      });

      const upscaledImage: GeneratedImage = {
        id: (response as any).historyId?.toString() || Date.now().toString(),
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
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم تحسين جودة الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التحسين");
    } finally { setIsProcessing(false); }
  };

  const handleRemoveBackground = async () => {
    if (!selectedImage || selectedImage.isGenerating) return;
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 10) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await removeImageBackground(token, selectedImage.url);

      const noBgImage: GeneratedImage = {
        id: (response as any).historyId?.toString() || Date.now().toString(),
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
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم إزالة الخلفية بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء إزالة الخلفية");
    } finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen  flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen  text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-cyan-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <AskAIToolHeader 
        title="نص إلى صورة"
        modelBadge="IMAGEN 4.0 ULTRA"
        stats={stats}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
           

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                وصف الصورة
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="اكتب وصفاً تفصيلياً للصورة التي تريد إنشاءها..."
                className="w-full min-h-[80px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <GradientButton
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              loading={isGenerating}
              loadingText="جاري الإنشاء..."
              icon={<Sparkles />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              إنشاء صورة
            </GradientButton>
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                نموذج الذكاء الاصطناعي
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel} dir="rtl">
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-14 rounded-xl text-right ring-offset-transparent focus:ring-0 focus:ring-offset-0 px-3">
                  <div className="flex items-center gap-2 w-full overflow-hidden text-right">
                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-bold text-sm truncate text-white">
                          {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
                        </span>
                        {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.badge && (
                          <span className="text-[9px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                            {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] text-gray-500 truncate">
                          {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#12141a] border-white/10 text-white max-w-[280px]" align="end">
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.value}
                      className="focus:bg-white/5 focus:text-white cursor-pointer py-2 px-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex flex-col gap-1 w-full text-right">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm">{model.label}</span>
                          {modelCosts[model.value] !== undefined && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono border border-yellow-500/30">
                              {modelCosts[model.value].toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500">{model.description}</span>
                          {model.badge && (
                            <span className="text-[9px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">
                              {model.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders size={14} className="text-cyan-400" />
                أبعاد الصورة
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.value)}
                    className={clsx(
                      "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all border",
                      selectedRatio === ratio.value
                        ? "bg-blue-500/20 border-blue-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <div
                      className={clsx(
                        "border-2 rounded-sm mb-1",
                        selectedRatio === ratio.value ? "border-white" : "border-gray-600",
                        ratio.id === "1:1" ? "w-4 h-4" : ratio.id === "16:9" ? "w-5 h-3" : ratio.id === "9:16" ? "w-3 h-5" : "w-4 h-3"
                      )}
                    />
                    <span className="text-[10px] font-medium">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Palette size={14} className="text-purple-400" />
                النمط الفني
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLE_PRESETS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={clsx(
                      "w-full text-center px-2 py-1.5 rounded-lg transition-all border text-[10px] font-medium",
                      selectedStyle === style.id
                        ? "bg-gradient-to-l border-transparent text-white shadow-lg " + style.color
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Tools */}
            {selectedImage && !selectedImage.isGenerating && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-xs font-bold text-purple-400 flex items-center gap-2">
                  <Wand2 size={14} />
                  أدوات التعديل
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    onClick={handleUpscale}
                    disabled={isProcessing}
                    className="rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] h-8"
                  >
                    <ArrowUpCircle size={12} className="ml-1" />
                    تحسين
                  </Button>
                  <Button
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    className="rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[10px] h-8"
                  >
                    <Eraser size={12} className="ml-1" />
                    إزالة خلفية
                  </Button>
                </div>
              </div>
            )}

            {/* Clear History */}
            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearAllHistory}
                className="w-full text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-9"
              >
                <Trash2 size={12} className="ml-2" />
                مسح جميع الأعمال
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon size={80} className="text-blue-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">ابدأ في إنشاء صورك</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    اكتب وصفاً للصورة التي تريدها في الجانب الأيمن وسنقوم بإنشائها لك في ثوانٍ
                  </p>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <History size={18} className="text-blue-400" />
                    أعمالك ({history.length})
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {history.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      {img.isGenerating ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${img.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري الإنشاء...</p>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <img
                            src={img.url}
                            alt={img.prompt}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedImage(img)}
                          />

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(img);
                                  }}
                                  className="flex-1 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs"
                                >
                                  <Eye size={12} className="ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(img.url, `ai-art-${img.id}.png`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(img.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedImage?.id === img.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <Eye size={14} className="text-white" />
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && !selectedImage.isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 line-clamp-2">{selectedImage.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadImage(selectedImage.url, `ai-art-${selectedImage.id}.png`)}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedImage.id, e)}
                    className="rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 h-10 w-10 p-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لتحويل النص لصور"
        description="للاستفادة من تقنية التوليد المستمر للصور الاحترافية بدقة عالية واستخدام نماذج Imagen 4.0 Ultra المتطورة, تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

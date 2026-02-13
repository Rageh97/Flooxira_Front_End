"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Download, 
  Zap,
  Loader2,
  ArrowRight,
  Sliders,
  Cpu,
  Trash2,
  X,
  History,
  Eye,
  Settings,
  Copy,
  Check
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
import { 
  getAIStats, 
  generateAINano, 
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
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";

const ASPECT_RATIOS = [
  { id: "1:1", label: "مربع", value: "1:1" },
  { id: "16:9", label: "أفقي", value: "16:9" },
  { id: "9:16", label: "ستوري", value: "9:16" },
];

const MODEL_OPTIONS = [
  { id: "imagen-4.0-ultra", label: "Nano Banana Pro 🍌", value: "imagen-4.0-ultra-generate-001", description: "أعلى جودة - تصاميم احترافية", badge: "الأفضل" },
  { id: "imagen-4.0", label: "Nano Banana Creative", value: "imagen-4.0-generate-001", description: "  " },
  { id: "imagen-4.0-fast", label: "Nano Banana Standard ⚡", value: "imagen-4.0-fast-generate-001", description: "  " },
  // { id: "imagen-3.0", label: "Imagen 3.0", value: "imagen-3.0-generate-001", description: "كلاسيكي ومستقر" },
  // { id: "imagen-3.0-fast", label: "Imagen 3.0 Fast", value: "imagen-3.0-fast-generate-001", description: "سرعة مضاعفة - اقتصادي " },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
  isGenerating?: boolean;
  progress?: number;
}

export default function NanoPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState("imagen-4.0-ultra-generate-001");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [modelCosts, setModelCosts] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  // Get cost directly from modelCosts
  const totalCost = modelCosts[selectedModel] || 0;
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("auth_token") || "";
      setToken(t);
      if (t) {
        getAIConfig(t).then(data => {
          if (data?.models) setModelCosts(data.models);
        }).catch(console.error);
      }
    }
  }, []);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const response = await getAIHistory(token, 'NANO');
      const mappedHistory: GeneratedImage[] = response.history.map((item: AIHistoryItem) => ({
        id: item.id.toString(),
        url: item.outputUrl,
        prompt: item.prompt,
        timestamp: item.createdAt,
        aspectRatio: (item.options as any)?.aspectRatio || "1:1",
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
    }
  }, [token]);



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
    if (!prompt.trim()) return showError("تنبيه", "اكتب وصفاً سريعاً!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 5) return showError("تنبيه", "رصيدك غير كافٍ");

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedImage = {
      id: placeholderId,
      url: "",
      prompt: prompt.trim(),
      timestamp: new Date().toISOString(),
      aspectRatio: selectedRatio,
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
      const response = await generateAINano(token, {
        prompt: prompt.trim(),
        aspectRatio: selectedRatio,
        model: selectedModel
      });

      clearInterval(progressInterval);

      const newImage: GeneratedImage = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        aspectRatio: selectedRatio,
        isGenerating: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم التوليد بسرعة البرق!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      showError("خطأ", error.message || "حدث خطأ");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(img => img.id !== id));
    
    try {
      if (id.length < 15) {
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
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'NANO');
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
      showSuccess("تم التحميل بنجاح!");
    } catch (error) { showError("خطأ", "تعذر التحميل"); }
  };

  const copyPromptToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      showSuccess("تم النسخ!");
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (error) {
      showError("خطأ", "فشل نسخ النص");
    }
  };

  if (permissionsLoading) return <div className="h-screen  flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen  text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-yellow-900/10 via-amber-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
   {/* Header */}
      <AskAIToolHeader 
        title=" NANO BANANA PRO 🍌 "
        modelBadge={MODEL_OPTIONS.find(m => m.value === selectedModel)?.label?.toUpperCase() || "IMAGEN 4.0 ULTRA"}
        stats={stats}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto relative">
        {/* Overlay for mobile */}
        {showSettings && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Sidebar - Settings (Fixed) */}
        <aside className={clsx(
          "w-80 border-l border-white/5 bg-[#0a0c10]/95 backdrop-blur-sm flex-shrink-0 transition-transform duration-300 z-50",
          "fixed lg:relative top-0 right-0 h-full lg:h-auto",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            {/* Mobile Close Button */}
            <button
              onClick={() => setShowSettings(false)}
              className="lg:hidden absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            {/* Prompt Input */}
            <div className="space-y-2 mt-12 lg:mt-0">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-400" />
                وصف سريع
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="وصف سريع للصورة..."
                className="w-full min-h-[80px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
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
              icon={<Zap />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              <div className="flex items-center justify-center gap-2">
                <span>توليد سريع</span>
                {totalCost > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono">
                     {totalCost.toLocaleString()} كريديت 
                  </span>
                )}
              </div>
            </GradientButton>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders size={14} className="text-yellow-400" />
                الأبعاد
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.value)}
                    className={clsx(
                      "p-2 rounded-lg transition-all border text-[10px] font-medium",
                      selectedRatio === ratio.value
                        ? "bg-yellow-500/20 border-yellow-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Cpu size={14} className="text-yellow-400" />
                النموذج
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel} dir="rtl">
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-14 rounded-xl text-right ring-offset-transparent focus:ring-0 focus:ring-offset-0 px-3 py-6">
                  <div className="flex items-center gap-2 w-full overflow-hidden text-right">
                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-bold text-sm truncate text-white">
                          {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
                        </span>
                        {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.badge && (
                          <span className="text-[9px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
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
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono border border-yellow-500/20">
                              {modelCosts[model.value].toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500">{model.description}</span>
                          {model.badge && (
                            <span className="text-[9px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
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

       

            {/* Clear History Button */}
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
          <div className="p-4 lg:p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                  <Zap size={60} className="lg:w-20 lg:h-20 text-yellow-500/20 mb-4 mx-auto animate-pulse" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">توليد فوري</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    اكتب وصفاً سريعاً وشاهد النتيجة تظهر بسرعة البرق
                  </p>
                  
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={18} />
                    <span>افتح الإعدادات</span>
                  </button>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                    <History size={16} className="lg:w-[18px] lg:h-[18px] text-yellow-400" />
                    أعمالك ({history.length})
                  </h2>
                  
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={16} />
                    <span>الإعدادات</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-yellow-500/50 transition-all"
                    >
                      {img.isGenerating ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 lg:p-4">
                          <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 animate-spin mb-2 lg:mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-1.5 lg:h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${img.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-[10px] lg:text-xs text-gray-400 mt-1 lg:mt-2">جاري الإنشاء...</p>
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
                            <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3 space-y-1 lg:space-y-2">
                              <p className="text-[10px] lg:text-xs text-white line-clamp-2">{img.prompt}</p>
                              <div className="flex items-center gap-1 lg:gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(img);
                                  }}
                                  className="flex-1 h-7 lg:h-8 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] lg:text-xs font-bold"
                                >
                                  <Eye size={10} className="lg:w-3 lg:h-3 ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(img.url, `nano-${img.id}.png`);
                                  }}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(img.id, e)}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedImage?.id === img.id && (
                            <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                              <Eye size={12} className="lg:w-[14px] lg:h-[14px] text-black" />
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
              <div className="mt-3 lg:mt-4 space-y-3">
                {/* Prompt Section */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400 mb-1 block">البرومبت:</label>
                      <div className="max-h-[100px] overflow-y-auto scrollbar-hide pl-2">
                        <p className="text-sm lg:text-base text-white leading-relaxed break-words">{selectedImage.prompt}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyPromptToClipboard(selectedImage.prompt)}
                      className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="نسخ البرومبت"
                    >
                      {copiedPrompt ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadImage(selectedImage.url, `nano-${selectedImage.id}.png`)}
                    className="flex-1 sm:flex-none rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black h-9 lg:h-10 px-4 lg:px-6 text-sm font-bold"
                  >
                    <Download size={14} className="lg:w-4 lg:h-4 ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedImage.id, e)}
                    className="rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 h-9 lg:h-10 w-9 lg:w-10 p-0"
                  >
                    <Trash2 size={14} className="lg:w-4 lg:h-4" />
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
        title="اشتراك مطلوب للتوليد السريع"
        description="للاستفادة من نموذج Nano banana Pro فائق السرعة وتوليد الصور في ثوانٍ معدودة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

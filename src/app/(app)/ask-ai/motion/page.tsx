"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Move, Trash2, X, Eye, Play, Settings, Copy, Check, Sliders
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
  processAIVideo, 
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

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  original: string;
  timestamp: string;
  isProcessing?: boolean;
  progress?: number;
  aspectRatio?: string;
}

const ASPECT_RATIOS = [
  { id: "16:9", label: "سينمائي", value: "16:9", icon: "" },
  { id: "9:16", label: "ستوري", value: "9:16", icon: "" },
  { id: "1:1", label: "مربع", value: "1:1", icon: "" },
  { id: "4:3", label: "كلاسيكي", value: "4:3", icon: "" },
  { id: "3:4", label: "عمودي", value: "3:4", icon: "" },
];

const VIDEO_DURATIONS = [
  { id: "4s", label: "4 ثواني", value: 4 },
  { id: "6s", label: "6 ثواني", value: 6 },
  { id: "8s", label: "8 ثواني", value: 8 },
];

const MOTION_MODELS = [
  { id: "veo-3.1", label: "Veo 3.1 Pro Motion ✨", value: "veo-3.1-generate-preview", description: "أعلى جودة - واقعية سينمائية فائقة", badge: "جديد" },
  { id: "veo-3.1-fast", label: "Veo 3.1 Fast Motion ⚡", value: "veo-3.1-fast-generate-preview", description: "سرعة مضاعفة مع جودة ممتازة", badge: "سريع" },
  { id: "veo-3.0", label: "Veo 3.0 Pro Motion", value: "veo-3.0-generate-001", description: "جودة احترافية وحركة متوازنة" },
  { id: "veo-3.0-fast", label: "Veo 3.0 Fast Motion", value: "veo-3.0-fast-generate-001", description: "توازن بين السرعة والجودة" },
  // { id: "veo-2.0", label: "Veo 2.0 Legacy Motion", value: "veo-2.0-generate-001", description: "حركة سلسة ومستقرة - اقتصادي" },
];

export default function MotionPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("veo-3.1-generate-preview");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<GeneratedVideo | null>(null);
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
  
  // Debug log
  useEffect(() => {
    console.log('[Motion] Selected Model:', selectedModel);
    console.log('[Motion] Total Cost:', totalCost);
    console.log('[Motion] All Model Costs:', modelCosts);
  }, [selectedModel, totalCost, modelCosts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  const loadHistory = async () => {
    if (!token) return;
    setIsHistoryLoading(true);
    try {
      const response = await getAIHistory(token, 'VIDEO');
      // Filter for motion operations only
      const mappedHistory: GeneratedVideo[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'motion')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl.includes('#t=') ? item.outputUrl : `${item.outputUrl}#t=0.001`,
          prompt: item.prompt,
          original: (item.options as any)?.inputUrl || "",
          timestamp: item.createdAt,
          isProcessing: false,
          progress: 100,
          aspectRatio: (item.options as any)?.aspectRatio || "16:9",
        }));
      
      setHistory(prev => {
        const processingItems = prev.filter(item => item.isProcessing);
        return [...processingItems, ...mappedHistory];
      });
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => { 
    if (token) {
      loadStats();
      checkAIPlans();
      loadHistory();
      getAIConfig(token).then(data => {
        if (data?.models) {
          console.log('[Motion] Model Costs:', data.models);
          setModelCosts(data.models);
        }
      }).catch(console.error);
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
      const res = await getAIStats(token);
      setStats(res.stats);
    } catch (e) { console.error(e); }
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

  const handleProcess = async () => {
    // Check if user has active subscription OR remaining credits
    const hasCredits = stats && (stats.isUnlimited || stats.remainingCredits > 0);
    if (!hasActiveSubscription && !hasCredits) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl) return showError("تنبيه", "ارفع صورة أولاً!");

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedVideo = {
      id: placeholderId,
      url: "",
      prompt: prompt.trim() || "Natural cinematic motion",
      original: previewUrl,
      timestamp: new Date().toISOString(),
      isProcessing: true,
      progress: 0,
      aspectRatio: selectedRatio,
    };

    setHistory(prev => [placeholder, ...prev]);
    setIsProcessing(true);

    const progressInterval = setInterval(() => {
      setHistory(prev => prev.map(vid => 
        vid.id === placeholderId && vid.isProcessing
          ? { ...vid, progress: Math.min((vid.progress || 0) + Math.random() * 10, 90) }
          : vid
      ));
    }, 800);

    try {
      const res = await processAIVideo(token, {
        operation: 'motion',
        inputUrl: previewUrl,
        prompt: prompt.trim() || "Natural cinematic motion, zoom in slowly",
        aspectRatio: selectedRatio,
        duration: selectedDuration,
        model: selectedModel
      });

      clearInterval(progressInterval);

      const newItem: GeneratedVideo = {
        id: (res as any).historyId?.toString() || placeholderId,
        url: res.videoUrl,
        prompt: prompt.trim() || "Natural cinematic motion",
        original: previewUrl,
        timestamp: new Date().toISOString(),
        isProcessing: false,
        progress: 100,
        aspectRatio: selectedRatio,
      };

      setHistory(prev => prev.map(vid => vid.id === placeholderId ? newItem : vid));
      await loadStats();
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: res.remainingCredits,
        usedCredits: prev.usedCredits + (res as any).creditsUsed
      } : null);
      showSuccess("تم إضافة الحركة بنجاح!");
    } catch (e: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(vid => vid.id !== placeholderId));
      showError("خطأ", e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    
    // Optimistic update
    setHistory(prev => prev.filter(h => h.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedResult?.id === id) setSelectedResult(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      loadHistory();
      showError("خطأ", error.message || "فشل حذف الفيديو من السجل السحابي");
    }
  };

  const clearHistory = async () => {
    if (!confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة من السحابة؟")) return;

    // Optimistic update
    setHistory(prev => prev.filter(p => p.isProcessing)); // Keep processing items

    try {
      await clearAIHistory(token, 'VIDEO');
      setSelectedResult(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      loadHistory();
      showError("خطأ", error.message || "فشل مسح السجل السحابي");
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
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="محاكاة الحركة  "
          modelBadge="VEO MOTION"
          stats={stats}
        />
      </div>
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[2000px] mx-auto w-full relative">
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
          "fixed lg:relative top-0 right-0 h-full overflow-y-auto custom-scrollbar",
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
            {/* Upload Image */}
            <div className="space-y-2 mt-12 lg:mt-0">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Upload size={14} className="text-blue-400" />
                الصورة الأصلية
              </label>
              <div 
                className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group hover:border-blue-500/30 transition-all"
                onClick={() => document.getElementById('file-m')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-blue-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <ImageIcon className="text-gray-700 group-hover:text-blue-400 transition-colors" size={48} />
                )}
              </div>
              <input id="file-m" type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const r = new FileReader();
                  r.onload = () => setPreviewUrl(r.result as string);
                  r.readAsDataURL(file);
                }
              }} />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Zap size={14} className="text-blue-400" />
                نموذج التحريك
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel} dir="rtl">
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-14 rounded-xl text-right ring-offset-transparent focus:ring-0 focus:ring-offset-0 px-3 py-6">
                  <div className="flex items-center gap-2 w-full overflow-hidden text-right">
                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-bold text-sm truncate text-white">
                          {MOTION_MODELS.find((m) => m.value === selectedModel)?.label}
                        </span>
                        {MOTION_MODELS.find((m) => m.value === selectedModel)?.badge && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold whitespace-nowrap">
                            {MOTION_MODELS.find((m) => m.value === selectedModel)?.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] text-gray-500 truncate">
                          {MOTION_MODELS.find((m) => m.value === selectedModel)?.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#12141a] border-white/10 text-white max-w-[280px]" align="end">
                  {MOTION_MODELS.map((model) => (
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
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider shadow-sm">
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

            {/* Aspect Ratio Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders size={14} className="text-blue-400" />
                أبعاد الفيديو
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.value)}
                    className={clsx(
                      "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all border text-[10px]",
                      selectedRatio === ratio.value
                        ? "bg-blue-500/20 border-blue-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <span className="text-base mb-1">{ratio.icon}</span>
                    <span className="font-medium">{ratio.label}</span>
                    <span className="text-[9px] text-gray-500">{ratio.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                مدة الفيديو
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {VIDEO_DURATIONS.map(duration => {
                  // Display the same cost for all durations (cost is per model, not per duration)
                  const cost = modelCosts[selectedModel] || 0;
                  
                  return (
                    <button
                      key={duration.id}
                      onClick={() => setSelectedDuration(duration.value)}
                      className={clsx(
                        "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all border text-[10px]",
                        selectedDuration === duration.value
                          ? "bg-indigo-500/20 border-indigo-400 text-white"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <span className="font-medium">{duration.label}</span>
                      {cost > 0 && (
                        <span className="text-[8px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded mt-1 font-mono border border-yellow-500/20">
                          {cost.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Motion Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                طبيعة الحركة (اختياري)
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="مثال: اجعل الأمواج تتحرك، حرك السحب ببطء، زووم سينمائي على الوجه..."
                className="w-full min-h-[80px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={3}
              />
            </div>

            {/* Process Button */}
            <GradientButton
              onClick={handleProcess}
              disabled={!previewUrl || isProcessing}
              loading={isProcessing}
              loadingText="جاري التحريك..."
              icon={<Move />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              <div className="flex items-center justify-center gap-2">
                <span>إضافة حركة</span>
                {totalCost > 0 && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {totalCost.toLocaleString()}
                  </span>
                )}
              </div>
            </GradientButton>


      
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-4 lg:p-6">
            {isHistoryLoading ? (
               <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="h-6 w-32 bg-white/5 animate-pulse rounded-lg" />
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="aspect-square rounded-xl lg:rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                 ))}
               </div>
             </div>
            ) : history.length === 0 ? (
              // Empty State
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                  <Move size={60} className="lg:w-20 lg:h-20 text-blue-500/20 mb-4 mx-auto" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">حرك صورك الثابتة</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    ارفع صورة ثابتة لنحولها إلى فيديو سينمائي مذهل بلمسة ذكاء
                  </p>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold transition-transform hover:scale-105"
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
                    <HistoryIcon size={16} className="lg:w-[18px] lg:h-[18px] text-blue-400" />
                    أعمالك ({history.length})
                  </h2>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={16} />
                    <span>الإعدادات</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 lg:p-4">
                          <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 animate-spin mb-2 lg:mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-1.5 lg:h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-[10px] lg:text-xs text-gray-400 mt-1 lg:mt-2">جاري التحريك...</p>
                        </div>
                      ) : (
                        <>
                          {/* Video */}
                          <video
                            src={item.url}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedResult(item)}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseOver={(e) => e.currentTarget.play()}
                            onMouseOut={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                          />

                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <Play size={16} className="lg:w-5 lg:h-5 text-white fill-white ml-1" />
                            </div>
                          </div>

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3 space-y-1 lg:space-y-2">
                              <p className="text-[10px] lg:text-xs text-white line-clamp-1">{item.prompt}</p>
                              <div className="flex items-center gap-1 lg:gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(item);
                                  }}
                                  className="flex-1 h-7 lg:h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-[10px] lg:text-xs"
                                >
                                  <Eye size={10} className="lg:w-3 lg:h-3 ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadVideo(item.url, `motion-${item.id}.mp4`);
                                  }}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handleDeleteHistory(item.id, e)}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedResult?.id === item.id && (
                            <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <Eye size={12} className="lg:w-[14px] lg:h-[14px] text-white" />
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

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selectedResult && !selectedResult.isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={clsx(
                "relative w-full flex flex-col max-h-[90vh] lg:max-h-[95vh]",
                selectedResult.aspectRatio === "9:16" ? "max-w-[400px]" : "max-w-5xl"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedResult(null)}
                className="absolute -top-12 left-0 lg:left-0 w-10 h-10 rounded-full bg-black/50 border border-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-[60]"
              >
                <X size={20} className="text-white" />
              </button>

              {/* Video Container - Content Area */}
              <div className="flex flex-col h-full overflow-hidden bg-[#0d1017] rounded-2xl border border-white/10 shadow-2xl relative">
                {/* Video */}
                <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black">
                  <video
                    src={selectedResult.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain"
                  />
                  <BorderBeam />
                </div>

                {/* Prompt and Actions - Footer Area */}
                <div className="flex-shrink-0 p-4 lg:p-6 bg-gradient-to-t from-black/80 to-transparent border-t border-white/5 space-y-4">
                  {/* Prompt Section */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-bold text-blue-400 mb-1.5 block">طبيعة الحركة:</label>
                        <div className="max-h-[80px] overflow-y-auto custom-scrollbar">
                          <p className="text-sm lg:text-base text-gray-100 leading-relaxed break-words">{selectedResult.prompt}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyPromptToClipboard(selectedResult.prompt)}
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group"
                        title="نسخ البرومبت"
                      >
                        {copiedPrompt ? (
                          <Check size={18} className="text-green-400" />
                        ) : (
                          <Copy size={18} className="text-gray-400 group-hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => downloadVideo(selectedResult.url, `motion-${selectedResult.id}.mp4`)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 h-11 text-sm font-bold shadow-lg shadow-blue-500/20"
                    >
                      <Download size={18} className="ml-2" />
                      تحميل الفيديو
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => handleDeleteHistory(selectedResult.id, e)}
                      className="rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 h-11 w-11 p-0 border border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
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
        title="اشتراك مطلوب لمحاكاة الحركة"
        description="للاستفادة من تقنية تحويل الصور الثابتة لفيديوهات متحركة وإضافة الحركة السينمائية الواقعية باستخدام تقنية Veo Motion، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

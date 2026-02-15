"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Video, Download, Trash2, Sliders, Palette, Zap, Loader2, Wand2,
  History, ArrowRight, Play, Film, X, ArrowUpCircle, Eye, Settings, Copy, Check
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
  generateAIVideo, 
  addVideoAudio, 
  enhanceVideo, 
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
  { id: "16:9", label: "سينمائي", value: "16:9", icon: "" },
  { id: "9:16", label: "ستوري", value: "9:16", icon: "" },
  { id: "1:1", label: "مربع", value: "1:1", icon: "" },
  { id: "4:3", label: "كلاسيكي", value: "4:3", icon: "" },
  { id: "3:4", label: "عمودي", value: "3:4", icon: "" },
];

const VIDEO_DURATIONS = [
  { id: "4s", label: "4 ثواني", value: 4 },
  { id: "6s", label: "6 ثواني", value: 6 },
  { id: "8s", label: "8 ثانية", value: 8 },
];

const VIDEO_MODELS = [
  { id: "veo-3.1", label: "Veo 3.1 Pro ✨", value: "veo-3.1-generate-preview", description: "أعلى جودة - واقعية سينمائية مع صوت", badge: "الأفضل" },
  { id: "veo-3.1-fast", label: "Veo 3.1 Fast ⚡", value: "veo-3.1-fast-generate-preview", description: "سرعة مضاعفة مع جودة ممتازة وصوت", badge: "سريع" },
  { id: "veo-3.0", label: "Veo 3.0 Pro", value: "veo-3.0-generate-001", description: "جودة احترافية مع دعم الصوت" },
  { id: "veo-3.0-fast", label: "Veo 3.0 Fast", value: "veo-3.0-fast-generate-001", description: "توازن بين السرعة والجودة" },
  { id: "veo-2.0", label: "Veo 2.0 Legacy", value: "veo-2.0-generate-001", description: "ثابت ومستقر - بدون صوت" },
];

const STYLE_PRESETS = [
  { id: "none", label: "حر", prompt: "" },
  { id: "cinematic", label: "سينمائي", prompt: ", cinematic shot, dramatic lighting, high production value, 4k" },
  { id: "realistic", label: "واقعي", prompt: ", photorealistic, lifelike motion, natural lighting, high detail" },
  { id: "anime", label: "أنمي", prompt: ", anime style, high-end animation, vibrant colors, fluid motion" },
  { id: "cyberpunk", label: "سايبر بانك", prompt: ", cyberpunk aesthetic, neon lights, futuristic city" },
  { id: "3d-animation", label: "3D", prompt: ", 3d animation, pixar style, smooth shading" },
];

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
  style: string;
  isGenerating?: boolean;
  progress?: number;
}

export default function TextToVideoPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [selectedModel, setSelectedModel] = useState("veo-3.1-generate-preview");
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
    console.log('[Video] Selected Model:', selectedModel);
    console.log('[Video] Total Cost:', totalCost);
    console.log('[Video] All Model Costs:', modelCosts);
  }, [selectedModel, totalCost, modelCosts]);

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
      const response = await getAIHistory(token, 'VIDEO');
      const mappedHistory: GeneratedVideo[] = response.history.map((item: AIHistoryItem) => ({
        id: item.id.toString(),
        url: item.outputUrl,
        prompt: item.prompt,
        timestamp: item.createdAt,
        aspectRatio: (item.options as any)?.aspectRatio || "16:9",
        style: (item.options as any)?.style || "none",
      }));
      
      setHistory(prev => {
        const generatingItems = prev.filter(item => item.isGenerating);
        return [...generatingItems, ...mappedHistory];
      });
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); loadHistory(); } }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("auth_token") || "";
      setToken(t);
      if (t) {
        getAIConfig(t).then(data => {
          if (data?.models) {
            console.log('[Video] Model Costs:', data.models);
            setModelCosts(data.models);
          }
        }).catch(console.error);
      }
    }
  }, []);

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
    if (!prompt.trim()) return showError("تنبيه", "أطلق العنان لخيالك واكتب وصفاً للفيديو!");
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 50) return showError("تنبيه", "رصيدك غير كافٍ");

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedVideo = {
      id: placeholderId, url: "", prompt: prompt.trim(), timestamp: new Date().toISOString(),
      aspectRatio: selectedRatio, style: selectedStyle, isGenerating: true, progress: 0,
    };

    setHistory(prev => [placeholder, ...prev]);
    setIsGenerating(true);

    const progressInterval = setInterval(() => {
      setHistory(prev => prev.map(vid => 
        vid.id === placeholderId && vid.isGenerating
          ? { ...vid, progress: Math.min((vid.progress || 0) + Math.random() * 10, 90) }
          : vid
      ));
    }, 800);

    try {
      const styleConfig = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const finalPrompt = prompt.trim() + (styleConfig?.prompt || "");

      const response = await generateAIVideo(token, {
        prompt: finalPrompt, aspectRatio: selectedRatio, duration: selectedDuration, includeAudio: includeAudio, model: selectedModel
      });

      clearInterval(progressInterval);

      const newVideo: GeneratedVideo = {
        id: (response as any).historyId?.toString() || placeholderId, 
        url: response.videoUrl, 
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(), aspectRatio: selectedRatio, style: selectedStyle,
        isGenerating: false, progress: 100,
      };

      setHistory(prev => prev.map(vid => vid.id === placeholderId ? newVideo : vid));
      setSelectedVideo(newVideo);
      setStats(prev => prev ? {
        ...prev, remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم بناء الفيديو بنجاح!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(vid => vid.id !== placeholderId));
      showError("خطأ", error.message || "حدث خطأ أثناء الإنتاج");
    } finally { setIsGenerating(false); }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الفيديو؟")) return;
    
    // Optimistic update
    setHistory(prev => prev.filter(vid => vid.id !== id));
    
    try {
      // Only call API if it's a real ID (assuming server IDs are small numbers in string or large if UUID, but placeholders are Date.now which is large)
      // Actually safe to attempt delete or check if it's a placeholder. 
      // Placeholders have isGenerating=true ideally.
      // Assuming valid IDs for delete.
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedVideo?.id === id) setSelectedVideo(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      // Revert is hard without keeping the item, so we just reload history
      loadHistory();
      showError("خطأ", error.message || "فشل حذف الفيديو من السجل السحابي");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة من السحابة؟")) return;

    setHistory(prev => prev.filter(p => p.isGenerating)); // Keep generating items

    try {
      await clearAIHistory(token, 'VIDEO');
      setSelectedVideo(null);
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

  const handleAddAudio = async () => {
    if (!selectedVideo || !audioText.trim()) return showError("تنبيه", "يرجى كتابة النص الصوتي");
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 30) return showError("تنبيه", "رصيدك غير كافٍ");

    setIsProcessing(true);
    try {
      const response = await addVideoAudio(token, {
        videoUrl: selectedVideo.url, audioText: audioText.trim(),
        voice: selectedVoice, language: selectedLanguage,
      });

      const videoWithAudio: GeneratedVideo = {
        id: (response as any).historyId?.toString() || Date.now().toString(), 
        url: response.videoUrl,
        prompt: `${selectedVideo.prompt} (مع صوت)`, timestamp: new Date().toISOString(),
        aspectRatio: selectedVideo.aspectRatio, style: selectedVideo.style,
      };

      setHistory(prev => [videoWithAudio, ...prev]);
      setSelectedVideo(videoWithAudio);
      setStats(prev => prev ? {
        ...prev, remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
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
        videoUrl: selectedVideo.url, enhancement,
      });

      const enhancedVideo: GeneratedVideo = {
        id: (response as any).historyId?.toString() || Date.now().toString(), 
        url: response.videoUrl,
        prompt: `${selectedVideo.prompt} (محسّن)`, timestamp: new Date().toISOString(),
        aspectRatio: selectedVideo.aspectRatio, style: selectedVideo.style,
      };

      setHistory(prev => [enhancedVideo, ...prev]);
      setSelectedVideo(enhancedVideo);
      setStats(prev => prev ? {
        ...prev, remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم تحسين الفيديو بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التحسين");
    } finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="نص إلى فيديو"
          modelBadge="VEO 3.1 PREVIEW"
          stats={stats}
        />
      </div>
      <div className="flex-1 flex overflow-hidden max-w-[2000px] mx-auto w-full relative">
        {/* Overlay for mobile */}
        {showSettings && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
        )}

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
            <div className="space-y-2 mt-12 lg:mt-0">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                وصف الفيديو
              </label>

              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="صف مشهد الفيديو الذي تتخيله بالتفصيل..."
                className="w-full min-h-[100px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={4}
              />
            </div>

            <GradientButton
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              loading={isGenerating}
              loadingText="جاري الإنتاج..."
              icon={<Video />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              <div className="flex items-center justify-center gap-2">
                <span>توليد الفيديو</span>
                {totalCost > 0 && (
                  <span className="text-xs  px-2 py-0.5 rounded-full font-mono">
                     {totalCost.toLocaleString()} كريديت 
                  </span>
                )}
              </div>
            </GradientButton>
 {/* Model Selection */}
              <div className="mb-4 space-y-2">
                <Select value={selectedModel} onValueChange={setSelectedModel} dir="rtl">
                  <SelectTrigger className="w-full bg-white/5 border-white/10 h-14 rounded-xl text-right ring-offset-transparent focus:ring-0 focus:ring-offset-0 px-3 py-6">
                    <div className="flex items-center gap-2 w-full overflow-hidden text-right">
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-bold text-sm truncate text-white">
                            {VIDEO_MODELS.find((m) => m.value === selectedModel)?.label}
                          </span>
                          {VIDEO_MODELS.find((m) => m.value === selectedModel)?.badge && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold whitespace-nowrap">
                              {VIDEO_MODELS.find((m) => m.value === selectedModel)?.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-[10px] text-gray-500 truncate">
                            {VIDEO_MODELS.find((m) => m.value === selectedModel)?.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#12141a] border-white/10 text-white max-w-[280px]" align="end">
                    {VIDEO_MODELS.map((model) => (
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
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wider shadow-sm">
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders size={14} className="text-purple-400" />
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
                        ? "bg-purple-500/20 border-purple-400 text-white"
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Palette size={14} className="text-indigo-400" />
                النمط الإخراجي
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLE_PRESETS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={clsx(
                      "w-full text-center px-2 py-1.5 rounded-lg transition-all border text-[10px] font-medium",
                      selectedStyle === style.id
                        ? "bg-indigo-500/20 border-indigo-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
              <button
                onClick={() => setIncludeAudio(!includeAudio)}
                className={clsx(
                  "w-11 h-6 rounded-full transition-all p-0.5",
                  includeAudio ? "bg-indigo-500 shadow-lg shadow-indigo-600/30" : "bg-white/10"
                )}
              >
                <motion.div
                  animate={{ x: includeAudio ? 20 : 0 }}
                  className="w-5 h-5 bg-white rounded-full"
                />
              </button>
              <span className="text-xs text-gray-400 font-medium">تضمين الصوت</span>
            </div> */}

            {selectedVideo && !selectedVideo.isGenerating && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                  <Wand2 size={14} />
                  أدوات تعديل الفيديو
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    onClick={() => handleEnhanceVideo('upscale')}
                    disabled={isProcessing}
                    className="rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] h-8"
                  >
                    <ArrowUpCircle size={12} className="ml-1" />
                    رفع الجودة
                  </Button>
                  <Button
                    onClick={() => handleEnhanceVideo('stabilize')}
                    disabled={isProcessing}
                    className="rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] h-8"
                  >
                    <Film size={12} className="ml-1" />
                    تثبيت
                  </Button>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-2">
                  <textarea
                    value={audioText}
                    onChange={(e) => setAudioText(e.target.value)}
                    placeholder="نص لتحويله لصوت..."
                    className="w-full bg-transparent text-[10px] outline-none border-none text-right placeholder:text-gray-600"
                    dir="rtl"
                    rows={2}
                  />
                  <Button
                    onClick={handleAddAudio}
                    disabled={isProcessing || !audioText.trim()}
                    className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-[10px] rounded-lg"
                  >
                    إضافة تعليق صوتي
                  </Button>
                </div>
              </div>
            )}

            
          </div>
        </aside>

        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-4 lg:p-6">
            {history.length === 0 ? (
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                  <Play size={60} className="lg:w-20 lg:h-20 text-purple-500/20 mb-4 mx-auto" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">استديو الفيديو الاحترافي</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    صف المشهد وسنقوم بتحويله إلى فيديو سينمائي احترافي باستخدام Veo 3.1
                  </p>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={18} />
                    <span>افتح الإعدادات</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                    <History size={16} className="lg:w-[18px] lg:h-[18px] text-purple-400" />
                    أعمالك ({history.length})
                  </h2>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={16} />
                    <span>الإعدادات</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((vid) => (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-video rounded-xl lg:rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {vid.isGenerating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 lg:p-4">
                          <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400 animate-spin mb-2 lg:mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-1.5 lg:h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${vid.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-[10px] lg:text-xs text-gray-400 mt-1 lg:mt-2">جاري الإنتاج...</p>
                        </div>
                      ) : (
                        <>
                          <video
                            src={vid.url}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedVideo(vid)}
                            muted
                            loop
                          />

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <Play size={20} className="text-white fill-white ml-1" />
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3 space-y-1 lg:space-y-2">
                              <p className="text-[10px] lg:text-xs text-white line-clamp-1">{vid.prompt}</p>
                              <div className="flex items-center gap-1 lg:gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVideo(vid);
                                  }}
                                  className="flex-1 h-7 lg:h-8 rounded-lg bg-purple-500 hover:bg-purple-600 text-[10px] lg:text-xs"
                                >
                                  <Eye size={10} className="lg:w-3 lg:h-3 ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadVideo(vid.url, `ai-vid-${vid.id}.mp4`);
                                  }}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(vid.id, e)}
                                  className="h-7 lg:h-8 w-7 lg:w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={10} className="lg:w-3 lg:h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {selectedVideo?.id === vid.id && (
                            <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-purple-500 flex items-center justify-center">
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

      <AnimatePresence>
        {selectedVideo && !selectedVideo.isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-10 lg:-top-12 left-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={18} className="lg:w-5 lg:h-5" />
              </button>

              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  loop
                  className="w-full max-h-[70vh] lg:max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              <div className="mt-3 lg:mt-4 space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400 mb-1 block">البرومبت:</label>
                      <div className="max-h-[100px] overflow-y-auto scrollbar-hide pl-2">
                        <p className="text-sm lg:text-base text-white leading-relaxed break-words">{selectedVideo.prompt}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyPromptToClipboard(selectedVideo.prompt)}
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

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadVideo(selectedVideo.url, `ai-vid-${selectedVideo.id}.mp4`)}
                    className="flex-1 sm:flex-none rounded-xl bg-purple-500 hover:bg-purple-600 h-9 lg:h-10 px-4 lg:px-6 text-sm"
                  >
                    <Download size={14} className="lg:w-4 lg:h-4 ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedVideo.id, e)}
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

      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لتحويل النص لفيديو"
        description="للاستفادة من تقنية توليد الفيديوهات الاحترافية بدقة عالية واستخدام نماذج Veo 3.1 المتطورة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

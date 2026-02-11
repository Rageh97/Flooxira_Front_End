"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Move, Trash2, X, Eye, Play
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
}

const MOTION_MODELS = [
  { id: "veo-3.1", label: "Veo 3.1 Pro Motion ✨", value: "veo-3.1-generate-preview", description: "أعلى جودة - واقعية سينمائية فائقة", badge: "جديد" },
  { id: "veo-3.1-fast", label: "Veo 3.1 Fast Motion ⚡", value: "veo-3.1-fast-generate-preview", description: "سرعة مضاعفة مع جودة ممتازة", badge: "سريع" },
  { id: "veo-3.0", label: "Veo 3.0 Pro Motion", value: "veo-3.0-generate-001", description: "جودة احترافية وحركة متوازنة" },
  { id: "veo-3.0-fast", label: "Veo 3.0 Fast Motion", value: "veo-3.0-fast-generate-001", description: "توازن بين السرعة والجودة" },
  { id: "veo-2.0", label: "Veo 2.0 Legacy Motion", value: "veo-2.0-generate-001", description: "حركة سلسة ومستقرة - اقتصادي" },
];

export default function MotionPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("veo-3.1-generate-preview");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeneratedVideo | null>(null);
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
      const response = await getAIHistory(token, 'VIDEO');
      // Filter for motion operations only
      const mappedHistory: GeneratedVideo[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'motion')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          prompt: item.prompt,
          original: (item.options as any)?.inputUrl || "",
          timestamp: item.createdAt,
          isProcessing: false,
          progress: 100,
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
    if (!hasActiveSubscription) {
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
    };

    setHistory([placeholder, ...history]);
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
    const originalHistory = [...history];
    setHistory(history.filter(h => h.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedResult?.id === id) setSelectedResult(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الفيديو من السجل السحابي");
    }
  };

  const clearHistory = async () => {
    if (!confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'VIDEO');
      setSelectedResult(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      setHistory(originalHistory);
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

  if (permissionsLoading) return <div className="h-screen  flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen  text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <AskAIToolHeader 
        title="محاكاة الحركة  "
        modelBadge="VEO MOTION"
        stats={stats}
      />
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto">
        {/* Sidebar - Settings (Fixed) */}
        <aside className="w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0">
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            {/* Upload Image */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Upload size={14} className="text-blue-400" />
                الصورة الأصلية
              </label>
              <div 
                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload hover:border-blue-500/30 transition-all relative"
                onClick={() => document.getElementById('file-m')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-blue-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <ImageIcon className="text-gray-700 group-hover/upload:text-blue-400 transition-colors" size={48} />
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
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-14 rounded-xl text-right ring-offset-transparent focus:ring-0 focus:ring-offset-0 px-3">
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
              إضافة حركة
            </GradientButton>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Move className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-blue-300">كيف تعمل؟</h3>
                  <p className="text-xs text-gray-400">
                    ارفع صورة ثابتة وسيقوم الذكاء الاصطناعي بتحليل العناصر وإضافة حركة واقعية
                  </p>
                </div>
              </div>
            </div>

            {/* Clear History Button */}
            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearHistory}
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
                  <Move size={80} className="text-blue-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">حرك صورك الثابتة</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    ارفع صورة ثابتة لنحولها إلى فيديو سينمائي مذهل بلمسة ذكاء
                  </p>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HistoryIcon size={18} className="text-blue-400" />
                    أعمالك ({history.length})
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري التحريك...</p>
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
                          />

                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <Play size={20} className="text-white fill-white ml-1" />
                            </div>
                          </div>

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-1">{item.prompt}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(item);
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
                                    downloadVideo(item.url, `motion-${item.id}.mp4`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handleDeleteHistory(item.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedResult?.id === item.id && (
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

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selectedResult && !selectedResult.isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedResult(null)}
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
                onClick={() => setSelectedResult(null)}
                className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              {/* Video */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <video
                  src={selectedResult.url}
                  controls
                  autoPlay
                  loop
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 line-clamp-1">{selectedResult.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadVideo(selectedResult.url, `motion-${selectedResult.id}.mp4`)}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => handleDeleteHistory(selectedResult.id, e)}
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
        title="اشتراك مطلوب لمحاكاة الحركة"
        description="للاستفادة من تقنية تحويل الصور الثابتة لفيديوهات متحركة وإضافة الحركة السينمائية الواقعية باستخدام تقنية Veo Motion، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

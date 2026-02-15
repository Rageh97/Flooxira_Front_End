"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Video, Download, Trash2, Sliders, Loader2, History, X, Eye, Play,
  Plus, Minus, Film, ArrowRight, Zap, FileText, Layers, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  listPlans, 
  getAIHistory,
  deleteAIHistoryItem,
  clearAIHistory,
  type AIStats,
  type AIHistoryItem
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";

interface Scene {
  id: string;
  description: string;
  duration: number;
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  mode: 'script' | 'scenes';
  isGenerating?: boolean;
  progress?: number;
  status?: string;
}

export default function LongVideoPage() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<'script' | 'scenes'>('script');
  const [scriptText, setScriptText] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([{ id: '1', description: '', duration: 5 }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
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
      // Filter for long-video operations only
      const mappedHistory: GeneratedVideo[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'long-video')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          prompt: item.prompt,
          timestamp: item.createdAt,
          mode: (item.options as any)?.mode || 'script',
          isGenerating: false,
          progress: 100,
          status: "مكتمل",
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
  }, [scriptText]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

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

  const addScene = () => {
    setScenes([...scenes, { id: Date.now().toString(), description: '', duration: 5 }]);
  };

  const removeScene = (id: string) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  const updateScene = (id: string, field: 'description' | 'duration', value: string | number) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerate = async () => {
    if (mode === 'script' && !scriptText.trim()) {
      return showError("تنبيه", "اكتب نص السيناريو أولاً!");
    }
    if (mode === 'scenes' && scenes.some(s => !s.description.trim())) {
      return showError("تنبيه", "املأ وصف جميع المشاهد!");
    }
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 100) {
      return showError("تنبيه", "رصيدك غير كافٍ");
    }

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedVideo = {
      id: placeholderId,
      url: "",
      prompt: mode === 'script' ? scriptText.trim() : `${scenes.length} مشاهد`,
      timestamp: new Date().toISOString(),
      mode,
      isGenerating: true,
      progress: 0,
      status: "جاري التحضير...",
    };

    setHistory([placeholder, ...history]);
    setIsGenerating(true);
    setCurrentProgress(0);
    setCurrentStatus("جاري التحضير...");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const endpoint = `${API_URL}/api/ai/long-video`;
      
      const body = mode === 'script' 
        ? { script: scriptText.trim() }
        : { scenes: scenes.map(s => ({ description: s.description, duration: s.duration })) };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إنشاء الفيديو');
      }

      const data = await response.json();
      const jobId = data.jobId;

      // Setup SSE for progress tracking
      const eventSource = new EventSource(`${API_URL}/api/ai/long-video/progress/${jobId}?token=${token}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        setCurrentProgress(data.progress || 0);
        setCurrentStatus(data.status || "جاري المعالجة...");
        
        setHistory(prev => prev.map(vid => 
          vid.id === placeholderId 
            ? { ...vid, progress: data.progress, status: data.status }
            : vid
        ));

        if (data.status === 'completed' && data.videoUrl) {
          const newVideo: GeneratedVideo = {
            id: data.historyId?.toString() || placeholderId,
            url: data.videoUrl,
            prompt: mode === 'script' ? scriptText.trim() : `${scenes.length} مشاهد`,
            timestamp: new Date().toISOString(),
            mode,
            isGenerating: false,
            progress: 100,
            status: "مكتمل",
          };

          setHistory(prev => prev.map(vid => vid.id === placeholderId ? newVideo : vid));
          setSelectedVideo(newVideo);
          
          if (data.remainingCredits !== undefined) {
            setStats(prev => prev ? {
              ...prev,
              remainingCredits: data.remainingCredits,
              usedCredits: prev.usedCredits + (data.creditsUsed || 0)
            } : null);
          }
          
          showSuccess("تم إنشاء الفيديو بنجاح!");
          eventSource.close();
          eventSourceRef.current = null;
          setIsGenerating(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        eventSourceRef.current = null;
        setHistory(prev => prev.filter(vid => vid.id !== placeholderId));
        setIsGenerating(false);
        showError("خطأ", "حدث خطأ أثناء الإنتاج");
      };

    } catch (error: any) {
      setHistory(prev => prev.filter(vid => vid.id !== placeholderId));
      setIsGenerating(false);
      showError("خطأ", error.message || "حدث خطأ أثناء الإنتاج");
    }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الفيديو؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(vid => vid.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedVideo?.id === id) setSelectedVideo(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الفيديو من السجل السحابي");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("هل أنت متأكد من مسح جميع الفيديوهات السابقة من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'VIDEO');
      setSelectedVideo(null);
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

  if (permissionsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#00050a]">
        <Loader text="جاري التحميل ..." size="lg" variant="warning" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="انتاج فيديو طويل "
          modelBadge="LONG VIDEO"
          stats={stats}
        />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[2000px] mx-auto w-full relative">
        {/* Overlay */}
        {showSettings && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Sidebar - Settings (Fixed on desktop, sliding on mobile) */}
        <aside className={clsx(
          "w-80 border-l border-white/5 bg-[#0a0c10]/50 backdrop-blur-sm flex-shrink-0 z-50",
          "fixed lg:relative top-0 right-0 h-full overflow-y-auto custom-scrollbar transition-transform duration-300",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Mobile Close Button */}
          <button
            onClick={() => setShowSettings(false)}
            className="lg:hidden absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5 mt-12 lg:mt-0">
            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders size={14} className="text-purple-400" />
                طريقة الإنشاء
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('script')}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all border",
                    mode === 'script'
                      ? "bg-purple-500/20 border-purple-400 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <FileText size={20} className="mb-1" />
                  <span className="text-xs font-medium">سيناريو</span>
                </button>
                <button
                  onClick={() => setMode('scenes')}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all border",
                    mode === 'scenes'
                      ? "bg-indigo-500/20 border-indigo-400 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <Layers size={20} className="mb-1" />
                  <span className="text-xs font-medium">مشاهد</span>
                </button>
              </div>
            </div>

            {/* Script Mode */}
            {mode === 'script' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  نص السيناريو
                </label>
                <textarea
                  ref={textareaRef}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="اكتب سيناريو الفيديو بالتفصيل... سيتم تحويله تلقائياً إلى مشاهد متتابعة"
                  className="w-full min-h-[150px] max-h-[300px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                  dir="rtl"
                  rows={6}
                />
              </div>
            )}

            {/* Scenes Mode */}
            {mode === 'scenes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Film size={14} className="text-indigo-400" />
                    المشاهد ({scenes.length})
                  </label>
                  <Button
                    onClick={addScene}
                    size="sm"
                    className="h-7 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                  >
                    <Plus size={12} className="ml-1" />
                    إضافة
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {scenes.map((scene, index) => (
                    <div key={scene.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300">مشهد {index + 1}</span>
                        {scenes.length > 1 && (
                          <button
                            onClick={() => removeScene(scene.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={scene.description}
                        onChange={(e) => updateScene(scene.id, 'description', e.target.value)}
                        placeholder="وصف المشهد..."
                        className="w-full bg-transparent border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 resize-none"
                        dir="rtl"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500">المدة (ثانية):</label>
                        <input
                          type="number"
                          value={scene.duration}
                          onChange={(e) => updateScene(scene.id, 'duration', parseInt(e.target.value) || 5)}
                          min="3"
                          max="10"
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <GradientButton
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'script' && !scriptText.trim()) || (mode === 'scenes' && scenes.some(s => !s.description.trim()))}
              loading={isGenerating}
              loadingText="جاري الإنتاج..."
              icon={<Video />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              إنشاء فيديو طويل
            </GradientButton>

            {/* Progress Display */}
            {isGenerating && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-medium">{currentStatus}</span>
                  <span className="text-purple-400 font-bold">{currentProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Film className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-blue-300">فيديو طويل احترافي</h3>
                  <p className="text-xs text-gray-400">
                    أنشئ فيديوهات طويلة من سيناريو أو مشاهد متعددة بجودة سينمائية
                  </p>
                </div>
              </div>
            </div>

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
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Film size={80} className="text-purple-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">استديو الفيديو الطويل</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    أنشئ فيديوهات طويلة احترافية من سيناريو كامل أو مشاهد متعددة
                  </p>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold flex items-center gap-2 mx-auto transition-all"
                  >
                    <Settings size={18} />
                    فتح الإعدادات
                  </button>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-purple-400 lg:hidden" />
                    <History size={18} className="text-purple-400 hidden lg:block" />
                    أعمالك ({history.length})
                  </h2>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 flex items-center justify-center transition-all"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((vid) => (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {vid.isGenerating ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${vid.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 text-center">{vid.status || "جاري الإنتاج..."}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{vid.progress}%</p>
                        </div>
                      ) : (
                        <>
                          {/* Video */}
                          <video
                            src={vid.url}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedVideo(vid)}
                            muted
                            loop
                          />

                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <Play size={20} className="text-white fill-white ml-1" />
                            </div>
                          </div>

                          {/* Mode Badge */}
                          <div className="absolute top-2 left-2">
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              vid.mode === 'script' 
                                ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                            )}>
                              {vid.mode === 'script' ? 'سيناريو' : 'مشاهد'}
                            </span>
                          </div>

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-1">{vid.prompt}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVideo(vid);
                                  }}
                                  className="flex-1 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 text-xs"
                                >
                                  <Eye size={12} className="ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadVideo(vid.url, `long-video-${vid.id}.mp4`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(vid.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedVideo?.id === vid.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
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
        {selectedVideo && !selectedVideo.isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
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
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              {/* Video */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  loop
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-400 line-clamp-1">{selectedVideo.prompt}</p>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      selectedVideo.mode === 'script' 
                        ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                        : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                    )}>
                      {selectedVideo.mode === 'script' ? 'سيناريو' : 'مشاهد'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedVideo.timestamp).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadVideo(selectedVideo.url, `long-video-${selectedVideo.id}.mp4`)}
                    className="rounded-xl bg-purple-500 hover:bg-purple-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedVideo.id, e)}
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
        title="اشتراك مطلوب لإنشاء فيديو طويل"
        description="للاستفادة من تقنية إنشاء الفيديوهات الطويلة الاحترافية من السيناريوهات والمشاهد المتعددة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

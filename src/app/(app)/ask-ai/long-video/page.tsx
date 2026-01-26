"use client";

import { useState, useEffect } from "react";
import { 
  Film, 
  Sparkles, 
  Plus, 
  Trash2, 
  Play,
  Download,
  Loader2,
  FileText,
  Wand2,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { listPlans } from "@/lib/api";

const ASPECT_RATIOS = [
  { id: "16:9", label: "سينمائي", value: "16:9" },
  { id: "9:16", label: "ستوري", value: "9:16" },
  { id: "1:1", label: "مربع", value: "1:1" },
];

const TRANSITIONS = [
  { id: "fade", label: "تلاشي" },
  { id: "dissolve", label: "ذوبان" },
  { id: "none", label: "بدون" },
];

export default function LongVideoPage() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"scenes" | "script">("scenes");
  const [scenes, setScenes] = useState<string[]>([""]);
  const [script, setScript] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedTransition, setSelectedTransition] = useState("fade");
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading, isAIToolAllowed } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
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
    if (scenes.length >= 10) {
      showError("تنبيه", "الحد الأقصى 10 مشاهد");
      return;
    }
    setScenes([...scenes, ""]);
  };

  const removeScene = (index: number) => {
    if (scenes.length === 1) return;
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const updateScene = (index: number, value: string) => {
    const newScenes = [...scenes];
    newScenes[index] = value;
    setScenes(newScenes);
  };

  const handleGenerate = async () => {
    // Check for subscription AND specific tool permission
    if (!hasActiveSubscription || !isAIToolAllowed('video_long')) {
      setSubscriptionModalOpen(true);
      return;
    }

    if (mode === "scenes") {
      const validScenes = scenes.filter(s => s.trim());
      if (validScenes.length === 0) {
        showError("تنبيه", "يجب إضافة مشهد واحد على الأقل");
        return;
      }
    } else {
      if (!script.trim()) {
        showError("تنبيه", "يجب كتابة السيناريو");
        return;
      }
    }

    const totalCost = mode === "scenes" ? scenes.filter(s => s.trim()).length * 50 : 500;
    if (stats && !stats.isUnlimited && stats.remainingCredits < totalCost) {
      showError("تنبيه", `رصيد غير كافٍ. تحتاج ${totalCost} كريديت`);
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    setGeneratedVideo(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const validScenes = mode === "scenes" ? scenes.filter(s => s.trim()) : [];
      
      // Build URL with proper encoding
      let url = `${API_URL}/api/ai/video/long?token=${encodeURIComponent(token)}&mode=${mode}&aspectRatio=${selectedRatio}&includeAudio=${includeAudio}&transition=${selectedTransition}&transitionDuration=0.5`;
      
      if (mode === "scenes") {
        url += `&scenes=${encodeURIComponent(JSON.stringify(validScenes))}`;
      } else {
        url += `&script=${encodeURIComponent(script)}`;
      }
      
      console.log('[Long Video] Connecting to:', url.substring(0, 100) + '...');
      
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[Long Video] ✅ Connection established');
      };

      eventSource.onmessage = (event) => {
        console.log('[Long Video] Message received:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'start') {
            console.log('[Long Video] Generation started');
          } else if (data.event === 'progress') {
            console.log('[Long Video] Progress:', data.message);
            setProgress(data);
          } else if (data.event === 'complete') {
            console.log('[Long Video] ✅ Complete!', data);
            setGeneratedVideo(data);
            setStats(prev => prev ? {
              ...prev,
              remainingCredits: data.remainingCredits,
              usedCredits: prev.usedCredits + data.creditsUsed
            } : null);
            showSuccess("تم توليد الفيديو الطويل بنجاح!");
            eventSource.close();
            setIsGenerating(false);
          } else if (data.event === 'error') {
            console.error('[Long Video] ❌ Error from server:', data.message);
            showError("خطأ", data.message);
            eventSource.close();
            setIsGenerating(false);
          }
        } catch (parseError) {
          console.error('[Long Video] Failed to parse message:', event.data, parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Long Video] ❌ EventSource error:', error);
        console.error('[Long Video] ReadyState:', eventSource.readyState);
        
        // ReadyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          showError("خطأ", "انقطع الاتصال بالخادم. تحقق من اتصالك بالإنترنت.");
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          showError("خطأ", "فشل الاتصال بالخادم. تأكد من تشغيل الخادم.");
        }
        
        eventSource.close();
        setIsGenerating(false);
      };

    } catch (error: any) {
      console.error('[Long Video] ❌ Exception:', error);
      showError("خطأ", error.message || "حدث خطأ أثناء التوليد");
      setIsGenerating(false);
    }
  };

  const downloadVideo = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `long-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      showError("خطأ", "تعذر التحميل");
    }
  };

  if (permissionsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#00050a]">
        <Loader text="جاري التحميل..." size="lg" variant="warning" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00050a] text-white overflow-x-hidden rounded-2xl selection:bg-purple-500/30 selection:text-purple-200 font-sans">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                فيديو طويل
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono">
                MULTI-SCENE
              </span>
            </h1>
          </div>

          {stats && (
            <div className="flex items-center gap-3 bg-white/5 rounded-full pl-2 pr-4 py-1.5 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center">
                <Zap size={14} className="text-white fill-white" />
              </div>
              <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] text-gray-400">الرصيد</span>
                <span className="text-sm font-bold font-mono">
                  {stats.isUnlimited ? "∞" : stats.remainingCredits}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Controls */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Mode Selection */}
            <div className="bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Wand2 size={16} className="text-purple-400" />
                طريقة الإنشاء
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("scenes")}
                  className={clsx(
                    "p-3 rounded-xl transition-all flex flex-col items-center gap-2",
                    mode === "scenes" ? "bg-purple-500/20 border border-purple-500/50" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <Film size={20} />
                  <span className="text-xs">مشاهد متعددة</span>
                </button>
                <button
                  onClick={() => setMode("script")}
                  className={clsx(
                    "p-3 rounded-xl transition-all flex flex-col items-center gap-2",
                    mode === "script" ? "bg-purple-500/20 border border-purple-500/50" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <FileText size={20} />
                  <span className="text-xs">من سيناريو</span>
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-[#0a0c10] rounded-3xl border border-text-primary/20 p-6 space-y-4">
              <h3 className="text-sm font-bold mb-4">الإعدادات</h3>
              
              {/* Aspect Ratio */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">نسبة الأبعاد</label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio.value)}
                      className={clsx(
                        "p-2 rounded-lg text-xs transition-all",
                        selectedRatio === ratio.value 
                          ? "bg-purple-500/20 border border-purple-500/50" 
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transition */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">الانتقالات</label>
                <div className="grid grid-cols-3 gap-2">
                  {TRANSITIONS.map((trans) => (
                    <button
                      key={trans.id}
                      onClick={() => setSelectedTransition(trans.id)}
                      className={clsx(
                        "p-2 rounded-lg text-xs transition-all",
                        selectedTransition === trans.id 
                          ? "bg-indigo-500/20 border border-indigo-500/50" 
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {trans.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">تضمين الصوت</span>
                <button
                  onClick={() => setIncludeAudio(!includeAudio)}
                  className={clsx(
                    "w-12 h-6 rounded-full transition-all p-1",
                    includeAudio ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: includeAudio ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>
            </div>

            {/* Cost Info */}
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-200">التكلفة المتوقعة</span>
              </div>
              <p className="text-2xl font-bold text-amber-300">
                {mode === "scenes" ? scenes.filter(s => s.trim()).length * 50 : 500}
                <span className="text-xs text-amber-400 mr-2">كريديت</span>
              </p>
            </div>

          </aside>

          {/* Right Panel: Content */}
          <section className="lg:col-span-2 space-y-6">
            
            {mode === "scenes" ? (
              // Scenes Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">المشاهد ({scenes.length}/10)</h2>
                  <Button
                    onClick={addScene}
                    disabled={scenes.length >= 10}
                    className="rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                    size="sm"
                  >
                    <Plus size={16} className="ml-2" />
                    إضافة مشهد
                  </Button>
                </div>

                {scenes.map((scene, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0c10] rounded-2xl border border-text-primary/20 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-purple-300">المشهد {index + 1}</span>
                      {scenes.length > 1 && (
                        <button
                          onClick={() => removeScene(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={scene}
                      onChange={(e) => updateScene(index, e.target.value)}
                      placeholder="صف المشهد بالتفصيل..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50 resize-none"
                      rows={3}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              // Script Mode
              <div className="bg-[#0a0c10] rounded-2xl border border-text-primary/20 p-6">
                <h2 className="text-lg font-bold mb-4">السيناريو</h2>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="اكتب سيناريو الفيديو الطويل هنا... سيقوم الذكاء الاصطناعي بتقسيمه إلى مشاهد تلقائياً"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
                  rows={15}
                />
              </div>
            )}

            {/* Generate Button */}
            <GradientButton
              onClick={handleGenerate}
              disabled={isGenerating}
              loading={isGenerating}
              loadingText="جاري التوليد..."
              icon={<Film />}
              size="lg"
              className="w-full h-14 text-lg"
            >
              توليد الفيديو الطويل
            </GradientButton>

            {/* Progress */}
            {progress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0c10] rounded-2xl border border-purple-500/20 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="animate-spin text-purple-400" size={20} />
                  <span className="text-sm font-bold">{progress.message}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {progress.current} / {progress.total}
                </p>
              </motion.div>
            )}

            {/* Result */}
            {generatedVideo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0c10] rounded-2xl border border-green-500/20 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="text-green-400" size={20} />
                  <span className="text-sm font-bold text-green-300">تم التوليد بنجاح!</span>
                </div>
                
                <video 
                  src={generatedVideo.videoUrl} 
                  controls 
                  className="w-full rounded-lg mb-4"
                />
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => downloadVideo(generatedVideo.videoUrl)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <div className="text-xs text-gray-400">
                    <Clock size={12} className="inline ml-1" />
                    {Math.round(generatedVideo.duration)}s
                  </div>
                </div>
              </motion.div>
            )}

          </section>
        </div>
      </main>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب للمتابعة"
        description="لإنشاء فيديوهات طويلة احترافية متعددة المشاهد، تحتاج إلى اشتراك نشط في باقات الذكاء الاصطناعي. اختر الباقة المناسبة لك وابدأ رحلتك!"
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

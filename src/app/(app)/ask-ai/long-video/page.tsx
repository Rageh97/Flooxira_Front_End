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
  AlertCircle,
  History as HistoryIcon,
  X,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { listPlans } from "@/lib/api";

const ASPECT_RATIOS = [
  { id: "16:9", label: "سينمائي", value: "16:9" },
  { id: "9:16", label: "ستوري", value: "9:16" },
  { id: "1:1", label: "مربع", value: "1:1" },
];

const RESOLUTIONS = [
  { id: "720p", label: "HD (720p)", value: "720p", cost: 50 },
  { id: "1080p", label: "FHD (1080p)", value: "1080p", cost: 75 },
  { id: "2k", label: "2K (1440p)", value: "1440p", cost: 150 },
  { id: "4k", label: "4K (2160p)", value: "2160p", cost: 250 },
];

const TRANSITIONS = [
  { id: "fade", label: "تلاشي" },
  { id: "dissolve", label: "ذوبان" },
  { id: "none", label: "بدون" },
];

interface GeneratedLongVideo {
  id: string;
  url: string;
  duration: number;
  timestamp: string;
  mode: string;
}

export default function LongVideoPage() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"scenes" | "script">("scenes");
  const [scenes, setScenes] = useState<string[]>([""]);
  const [script, setScript] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedResolution, setSelectedResolution] = useState("720p");
  const [selectedTransition, setSelectedTransition] = useState("fade");
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedLongVideo | null>(null);
  const [history, setHistory] = useState<GeneratedLongVideo[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading, isAIToolAllowed } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const saved = localStorage.getItem("ai_long_video_history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setHistory(parsed);
        } catch (e) {
          console.error("History parse error:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("ai_long_video_history", JSON.stringify(history));
    }
  }, [history]);

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

    const resObj = RESOLUTIONS.find(r => r.value === selectedResolution);
    const sceneCost = resObj ? resObj.cost : 50;
    const totalCost = mode === "scenes" ? scenes.filter(s => s.trim()).length * sceneCost : 500 * (sceneCost / 50);
    if (stats && !stats.isUnlimited && stats.remainingCredits < totalCost) {
      showError("تنبيه", `رصيد غير كافٍ. تحتاج ${totalCost} كريديت`);
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    setSelectedVideo(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const validScenes = mode === "scenes" ? scenes.filter(s => s.trim()) : [];
      let url = `${API_URL}/api/ai/video/long?token=${encodeURIComponent(token)}&mode=${mode}&aspectRatio=${selectedRatio}&resolution=${selectedResolution}&includeAudio=${includeAudio}&transition=${selectedTransition}&transitionDuration=0.5`;
      
      if (mode === "scenes") {
        url += `&scenes=${encodeURIComponent(JSON.stringify(validScenes))}`;
      } else {
        url += `&script=${encodeURIComponent(script)}`;
      }
      
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'progress') {
            setProgress(data);
          } else if (data.event === 'complete') {
            const newVideo: GeneratedLongVideo = {
              id: Date.now().toString(),
              url: data.videoUrl,
              duration: data.duration,
              timestamp: new Date().toISOString(),
              mode: mode
            };
            const newHistory = [newVideo, ...history];
            setHistory(newHistory);
            localStorage.setItem("ai_long_video_history", JSON.stringify(newHistory));
            setSelectedVideo(newVideo);
            setStats(prev => prev ? {
              ...prev,
              remainingCredits: data.remainingCredits,
              usedCredits: (prev.usedCredits || 0) + data.creditsUsed
            } : null);
            showSuccess("تم توليد الفيديو الطويل بنجاح!");
            eventSource.close();
            setIsGenerating(false);
          } else if (data.event === 'error') {
            showError("خطأ", data.message);
            eventSource.close();
            setIsGenerating(false);
          }
        } catch (parseError) {
          console.error(parseError);
        }
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        setIsGenerating(false);
      };

    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ أثناء التوليد");
      setIsGenerating(false);
    }
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الفيديو؟")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_long_video_history", JSON.stringify(newHistory));
    if (selectedVideo?.id === id) setSelectedVideo(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearHistory = () => {
    if (!confirm("هل تريد مسح السجل بالكامل؟")) return;
    setHistory([]);
    localStorage.removeItem("ai_long_video_history");
    setSelectedVideo(null);
    showSuccess("تم مسح السجل بالكامل.");
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

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] text-white overflow-x-hidden rounded-2xl selection:bg-purple-500/30 font-sans" dir="rtl">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8 bg-[#00050a]/80 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <ArrowRight className="h-5 w-5 rotate-180 text-white" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">فيديو طويل</h1>
        </div>
        {stats && (
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 font-mono">
            <Zap size={14} className="text-amber-400" /> <span className="text-sm font-bold">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span>
          </div>
        )}
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center gap-2 text-purple-400 justify-end">
                <span className="text-sm font-bold">طريقة الإنشاء</span>
                <Wand2 size={18} />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode("scenes")} className={clsx("p-4 rounded-2xl transition-all flex flex-col items-center gap-2", mode === "scenes" ? "bg-purple-500/20 border border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "bg-white/5 hover:bg-white/10 text-gray-400")}>
                  <Film size={20} /> <span className="text-xs font-bold">مشاهد متعددة</span>
                </button>
                <button onClick={() => setMode("script")} className={clsx("p-4 rounded-2xl transition-all flex flex-col items-center gap-2", mode === "script" ? "bg-purple-500/20 border border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "bg-white/5 hover:bg-white/10 text-gray-400")}>
                  <FileText size={20} /> <span className="text-xs font-bold">من سيناريو</span>
                </button>
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-gray-400 justify-end">
                   <span className="text-xs font-bold uppercase tracking-widest">إعدادات الإخراج</span>
                   <Settings size={14} />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block text-right font-mono">ASPECT RATIO / الأبعاد</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button key={ratio.id} onClick={() => setSelectedRatio(ratio.value)} className={clsx("p-2.5 rounded-xl text-xs transition-all border font-bold", selectedRatio === ratio.value ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-transparent text-gray-500 hover:bg-white/[0.07]")}>{ratio.label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block text-right font-mono">QUALITY / الجودة</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RESOLUTIONS.map((res) => (
                      <button key={res.id} onClick={() => setSelectedResolution(res.value)} className={clsx("p-2.5 rounded-xl text-xs transition-all border font-bold", selectedResolution === res.value ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-white/5 border-transparent text-gray-500")}>{res.label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block text-right font-mono">TRANSITIONS / الانتقالات</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRANSITIONS.map((trans) => (
                      <button key={trans.id} onClick={() => setSelectedTransition(trans.id)} className={clsx("p-2.5 rounded-xl text-xs transition-all border font-bold", selectedTransition === trans.id ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-white/5 border-transparent text-gray-500")}>{trans.label}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                  <button onClick={() => setIncludeAudio(!includeAudio)} className={clsx("w-12 h-6 rounded-full transition-all p-1 relative", includeAudio ? "bg-purple-600" : "bg-white/10")}>
                    <motion.div animate={{ x: includeAudio ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-lg" />
                  </button>
                  <span className="text-xs text-gray-300 font-bold">تضمين موسيقى خلفية</span>
                </div>
              </div>
              
              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
                <div className="flex items-center gap-2 justify-end mb-1">
                   <span className="text-[10px] font-bold text-amber-500/70 uppercase">Estimated Cost</span>
                   <Zap size={14} className="text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-500 text-right">
                  {(() => {
                    const resObj = RESOLUTIONS.find(r => r.value === selectedResolution);
                    const sceneCost = resObj ? resObj.cost : 50;
                    return mode === "scenes" ? scenes.filter(s => s.trim()).length * sceneCost : 500 * (sceneCost / 50);
                  })()}
                  <span className="text-xs mr-2 opacity-60">كريديت</span>
                </p>
              </div>

              <GradientButton onClick={handleGenerate} disabled={isGenerating} loading={isGenerating} loadingText="جاري الإنتاج..." icon={<Film />} size="lg" className="w-full h-14 text-base">بدء إنتاج الفيديو</GradientButton>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-6">
            <div className="relative min-h-[600px] rounded-[48px] bg-[#0a0c10] border border-white/10 flex flex-col items-center justify-center p-8 overflow-hidden group shadow-2xl">
               <AnimatePresence mode="wait">
                 {selectedVideo ? (
                    <motion.div key="vid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full flex flex-col items-center">
                       <button onClick={() => setSelectedVideo(null)} className="absolute top-0 left-0 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors border border-red-500/20">
                          <X size={14}/>
                       </button>
                       <video src={selectedVideo.url} controls autoPlay className="max-h-[550px] w-auto rounded-3xl shadow-3xl border border-white/5" />
                       <div className="mt-8 flex items-center gap-3">
                          <Button onClick={() => downloadVideo(selectedVideo.url)} className="rounded-full bg-white opacity-90 hover:opacity-100 text-black font-bold h-11 px-10 transition-all hover:scale-105"><Download size={18} className="ml-2" /> حفظ الفيديو</Button>
                          <Button variant="ghost" size="icon" className="rounded-full bg-red-500/10 text-red-400 h-11 w-11 border border-red-500/20 hover:bg-red-500/20" onClick={(e) => handleDeleteItem(selectedVideo.id, e)}><Trash2 size={20} /></Button>
                       </div>
                       <BorderBeam duration={10} colorFrom="#8b5cf6" colorTo="#3b82f6" />
                    </motion.div>
                 ) : isGenerating ? (
                    <div className="w-full max-w-md text-center">
                       <AILoader />
                       {progress && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 space-y-4">
                             <div className="flex justify-between items-center text-sm font-bold text-gray-400 px-1">
                                <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-mono border border-white/5">{progress.current} / {progress.total}</span>
                                <span className="text-xs">{progress.message}</span>
                             </div>
                             <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
                                <motion.div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 h-full rounded-full" animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ type: "spring", stiffness: 50 }} />
                             </div>
                          </motion.div>
                       )}
                    </div>
                 ) : (
                    <div className="w-full h-full flex flex-col">
                       {mode === "scenes" ? (
                          <div className="space-y-6">
                             <div className="flex items-center justify-between px-4">
                                <Button onClick={addScene} disabled={scenes.length >= 10} className="rounded-full bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 h-10 px-6 font-bold" size="sm"><Plus size={18} className="ml-2" /> إدراج مشهد جديد</Button>
                                <h2 className="text-xl font-bold bg-gradient-to-l from-white to-gray-500 bg-clip-text text-transparent">هيكل المشاهد ({scenes.length}/10)</h2>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[600px] overflow-y-auto custom-scrollbar p-2">
                                {scenes.map((scene, index) => (
                                   <motion.div key={index} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f1115] rounded-[24px] border border-white/5 p-5 group/scene relative hover:border-purple-500/30 transition-colors shadow-lg">
                                      <div className="flex items-center justify-between mb-3">
                                         {scenes.length > 1 && <button onClick={() => removeScene(index)} className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover/scene:opacity-100 transition-all hover:bg-red-500/20"><Trash2 size={14} /></button>}
                                         <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">Scene</span>
                                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">{index + 1}</span>
                                         </div>
                                      </div>
                                      <textarea value={scene} onChange={(e) => updateScene(index, e.target.value)} placeholder="اكتب وصفاً تفصيلياً للمشهد، مثلاً: رائد فضاء يسير على سطح المريخ تحت سماء أرجوانية مع انعكاس النجوم على خوذته..." className="w-full bg-transparent text-sm text-gray-300 placeholder:text-gray-700 outline-none resize-none min-h-[120px] leading-relaxed text-right" dir="rtl" />
                                   </motion.div>
                                ))}
                             </div>
                          </div>
                       ) : (
                          <div className="h-full flex flex-col space-y-4">
                             <div className="flex items-center justify-end gap-2 px-2">
                                <h2 className="text-xl font-bold text-white">السيناريو القصصي</h2>
                                <FileText size={20} className="text-purple-400" />
                             </div>
                             <div className="flex-1 bg-white/[0.02] rounded-[32px] p-8 border border-white/5 shadow-inner">
                                <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="ابدأ بكتابة قصتك هنا... 

مثال: تبدأ القصة في مدينة غارقة تحت الماء في عام 2150. تسبح الأسماك المضيئة حول ناطحات السحاب الصدئة. تظهر بطلة القصة ببدلة غوص متطورة تستكشف مكتبة قديمة..." className="w-full h-full bg-transparent text-white placeholder:text-gray-700 outline-none resize-none min-h-[450px] text-lg leading-relaxed text-right scrollbar-hide" dir="rtl" />
                             </div>
                          </div>
                       )}
                    </div>
                 )}
               </AnimatePresence>
            </div>

            {history.length > 0 && (
               <div className="space-y-5 pt-8">
                  <div className="flex items-center justify-between px-4">
                     <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 rounded-full px-4 border border-transparent hover:border-red-500/20 transition-all">مسح السجل</Button>
                     <h4 className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-[3px]"><HistoryIcon size={14} className="text-purple-500" /> Recent Productions ({history.length})</h4>
                  </div>
                  <div className="flex gap-5 overflow-x-auto pb-6 px-4 custom-scrollbar">
                     {history.map(h => (
                        <div key={h.id} className="relative group shrink-0" onClick={() => setSelectedResult ? setSelectedVideo(h) : null}>
                           <div className={clsx("w-48 aspect-video rounded-2xl border-2 transition-all overflow-hidden shadow-2xl cursor-pointer", selectedVideo?.id === h.id ? "border-purple-500 scale-105 z-10" : "border-white/5 opacity-50 hover:opacity-100")}>
                              <video src={h.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Play size={24} className="text-white fill-white scale-75 group-hover:scale-100 transition-transform" />
                              </div>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(h.id); }} className="absolute -top-2 -right-2 h-7 w-7 flex items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-red-500 z-20"><X size={12} /></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </section>
        </div>
      </main>

      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="باقة الفيديو الطويل مطلوبة"
        description="لإنشاء فيديوهات سينمائية طويلة تصل لعدة دقائق مع تقنية الدمج الذكي، تحتاج للاشتراك في باقة PRO."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

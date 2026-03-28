"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Mic2, Download, Trash2, Sliders, Volume2, Zap, Loader2, Wand2,
  History, Play, Pause, X, Music, Settings, Copy, Check, AudioLines,
  User, Globe, Activity, Heart
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
  generateAIAudio,
  getAIHistory,
  deleteAIHistoryItem,
  clearAIHistory,
  getAIConfig,
  type AIStats,
  type AIHistoryItem
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";

const VOICES = [
  { id: "professional", label: "احترافي (إخباري)", icon: "" },
  { id: "storyteller", label: "راوي قصص", icon: "" },
  { id: "friendly", label: "صديق (كاجوال)", icon: "" },
  { id: "serious", label: "رسمي جاد", icon: "" },
  { id: "energetic", label: "متحمس (إعلاني)", icon: "" },
];

const DIALECTS = [
  { id: "Standard", label: "العربية الفصحى", flag: "🇸🇦" },
  { id: "Egyptian", label: "اللهجة المصرية", flag: "🇪🇬" },
  { id: "Saudi", label: "اللهجة السعودية", flag: "🇸🇦" },
  { id: "Gulf", label: "اللهجة الخليجية العامة", flag: "🇦🇪" },
  { id: "Iraqi", label: "اللهجة العراقية", flag: "🇮🇶" },
  { id: "Levantine", label: "اللهجة الشامية", flag: "🇱🇧" },
  { id: "Maghrebi", label: "اللهجة المغربية", flag: "🇲🇦" },
  { id: "English", label: "الإنجليزية", flag: "🇺🇸" },
];

const EMOTIONS = [
  { id: "neutral", label: "طبيعي (Neutral)", icon: "" },
  { id: "happy", label: "سعيد (Happy)", icon: "" },
  { id: "sad", label: "حزين (Sad)", icon: "" },
  { id: "angry", label: "غاضب (Angry)", icon: "" },
  { id: "scared", label: "خائف (Scared)", icon: "" },
];

const MODELS = [
  { id: "gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS ⚡", description: "سرعة فائقة وجودة ممتازة للتعليق الصوتي", badge: "سريع" },
  { id: "gemini-2.5-pro-tts", label: "Gemini 2.5 Pro TTS ✨", description: "أعلى جودة مع تعبيرات عاطفية واقعية جداً", badge: "احترافي" },
];

interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  timestamp: string;
  options: any;
  isGenerating?: boolean;
}

export default function VoiceGenerationPage() {
  const [token, setToken] = useState("");
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-tts");
  const [selectedVoice, setSelectedVoice] = useState("professional");
  const [selectedGender, setSelectedGender] = useState("male");
  const [selectedDialect, setSelectedDialect] = useState("Standard");
  const [selectedPace, setSelectedPace] = useState("normal");
  const [selectedEmotion, setSelectedEmotion] = useState("neutral");
  const [selectedLanguage, setSelectedLanguage] = useState("Arabic");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedAudio, setSelectedAudio] = useState<GeneratedAudio | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [modelCosts, setModelCosts] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  const totalCost = modelCosts[selectedModel] || 15;

  // استخراج الامتداد من الرابط
  const getFileExtension = (url: string) => {
    try {
      const parts = url.split('.');
      return parts.length > 1 ? parts[parts.length - 1] : 'wav';
    } catch { return 'wav'; }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("auth_token") || "";
      setToken(t);
      if (t) {
        getAIConfig(t).then(data => {
          if (data?.models) setModelCosts(data.models);
        }).catch(console.error);
        loadStats(t);
        loadHistory(t);
      }
    }
  }, []);

  const loadStats = async (t: string) => {
    try {
      const response = await getAIStats(t);
      setStats(response.stats);
    } catch (error) { console.error("Failed to load stats:", error); }
  };

  const loadHistory = async (t: string) => {
    setIsHistoryLoading(true);
    try {
      const response = await getAIHistory(t, 'AUDIO');
      const mappedHistory: GeneratedAudio[] = response.history.map((item: AIHistoryItem) => ({
        id: item.id.toString(),
        url: item.outputUrl,
        text: item.prompt,
        timestamp: item.createdAt,
        options: item.options || {},
      }));
      setHistory(mappedHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return showError("تنبيه", "يرجى كتابة النص المراد تحويله لصوت!");
    if (!hasActiveSubscription) { setSubscriptionModalOpen(true); return; }
    if (stats && !stats.isUnlimited && stats.remainingCredits < totalCost) return showError("تنبيه", "رصيدك غير كافٍ");

    const placeholderId = Date.now().toString();
    const placeholder: GeneratedAudio = {
      id: placeholderId,
      url: "",
      text: text.trim(),
      timestamp: new Date().toISOString(),
      options: { voice: selectedVoice, dialect: selectedDialect, gender: selectedGender },
      isGenerating: true,
    };

    setHistory(prev => [placeholder, ...prev]);
    setSelectedAudio(placeholder);
    setIsGenerating(true);

    try {
      const response = await generateAIAudio(token, {
        text: text.trim(),
        model: selectedModel,
        voice: selectedVoice,
        gender: selectedGender,
        dialect: selectedDialect,
        pace: selectedPace,
        emotion: selectedEmotion,
        language: selectedLanguage,
        extraPrompt: `Strictly use a ${selectedGender} voice for this narration. No exceptions.`
      });

      const newAudio: GeneratedAudio = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.audioUrl,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        options: { voice: selectedVoice, dialect: selectedDialect, gender: selectedGender }
      };

      setHistory(prev => prev.map(a => a.id === placeholderId ? newAudio : a));
      setSelectedAudio(newAudio);
      setStats(prev => prev ? {
        ...prev, 
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم توليد الصوت بنجاح!");
      if (audioRef.current) {
        audioRef.current.src = response.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error: any) {
      setHistory(prev => prev.filter(a => a.id !== placeholderId));
      if (selectedAudio?.id === placeholderId) setSelectedAudio(null);
      showError("خطأ", error.message || "حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  };


  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا المقطع؟")) return;
    setHistory(prev => prev.filter(a => a.id !== id));
    try {
      if (id.length < 15) await deleteAIHistoryItem(token, parseInt(id));
      if (selectedAudio?.id === id) {
        setSelectedAudio(null);
        setIsPlaying(false);
      }
      showSuccess("تم الحذف بنجاح");
    } catch (error) {
      loadHistory(token);
    }
  };

  const downloadAudio = async (url: string, id: string) => {
    try {
      const ext = getFileExtension(url);
      const filename = `gemini-voice-${id}.${ext}`;
      
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { 
      console.error("Download error:", error);
      // Fallback: فتح الرابط في نافذة جديدة
      window.open(url, '_blank');
      showError("تنبيه", "جاري المحاولة لفتح الملف في نافذة جديدة للتحميل..."); 
    }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl no-scrollbar" dir="rtl">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-indigo-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="توليد الصوت الاحترافي"
          modelBadge="GEMINI 2.5 TTS"
          stats={stats}
        />
      </div>

      <div className="flex-1 flex overflow-hidden max-w-[2000px] mx-auto w-full relative">
        {/* Sidebar Settings */}
        <aside className={clsx(
          "w-72 border-l border-white/5 bg-[#0a0c10]/95 backdrop-blur-sm flex-shrink-0 transition-transform duration-300 z-50",
          "fixed lg:relative top-0 right-0 h-full overflow-y-auto no-scrollbar p-5 space-y-5",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Mobile Close */}
          <button onClick={() => setShowSettings(false)} className="lg:hidden absolute top-4 left-4 p-2 bg-white/5 rounded-full"><X size={18} /></button>

          <div className="space-y-5">
             {/* Text Input */}
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                  <AudioLines size={12} className="text-blue-400" />
                  النص المراد تحويله
                </label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب النص الذي ترغب في تحويله إلى صوت احترافي هنا..."
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-blue-500/50 resize-none transition-all no-scrollbar"
                />
             </div>

             {/* Model Selection */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                   <Zap size={12} className="text-amber-400" />
                   نموذج الذكاء الاصطناعي
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel} dir="rtl">
                  <SelectTrigger className="w-full bg-white/5 border-white/10 h-11 rounded-xl text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12141a] border-white/10 text-white">
                    {MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-right">
                        <div className="flex flex-col items-start text-right py-0.5">
                          <span className="font-bold text-xs">{m.label}</span>
                          <span className="text-[9px] text-gray-500">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Gender & Pace */}
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5"><User size={12}/> النوع</label>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                    <button 
                      onClick={() => setSelectedGender('male')}
                      className={clsx("flex-1 py-1.5 text-[10px] rounded-md transition-all", selectedGender === 'male' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                    >ذكر</button>
                    <button 
                      onClick={() => setSelectedGender('female')}
                      className={clsx("flex-1 py-1.5 text-[10px] rounded-md transition-all", selectedGender === 'female' ? "bg-pink-600 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                    >أنثى</button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5"><Activity size={12}/> السرعة</label>
                  <Select value={selectedPace} onValueChange={setSelectedPace}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-9 text-xs rounded-lg">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12141a] border-white/10 text-white">
                      <SelectItem value="slow">بطيء</SelectItem>
                      <SelectItem value="normal">طبيعي</SelectItem>
                      <SelectItem value="fast">سريع</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
             </div>

             {/* Dialect / Language Selection */}
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                   <Globe size={12} className="text-emerald-400"/> اللغة / اللهجة
                </label>
                <Select value={selectedDialect} onValueChange={(val) => {
                   setSelectedDialect(val);
                   if(val === "English") setSelectedLanguage("English");
                   else setSelectedLanguage("Arabic");
                }} dir="rtl">
                  <SelectTrigger className="w-full bg-white/5 border-white/10 h-10 rounded-xl text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12141a] border-white/10 text-white">
                    {DIALECTS.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-right">
                         <div className="flex items-center gap-2">
                            <span>{d.flag}</span>
                            <span>{d.label}</span>
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Voice Personality */}
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                   <Mic2 size={12} className="text-indigo-400"/> الشخصية الصوتية
                </label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice} dir="rtl">
                  <SelectTrigger className="w-full bg-white/5 border-white/10 h-10 rounded-xl text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12141a] border-white/10 text-white">
                    {VOICES.map(v => (
                      <SelectItem key={v.id} value={v.id} className="text-right">
                         <div className="flex items-center gap-2">
                            <span>{v.icon}</span>
                            <span>{v.label}</span>
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Emotion Selection */}
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                   <Heart size={12} className="text-rose-400"/> العاطفة والمشاعر
                </label>
                <Select value={selectedEmotion} onValueChange={setSelectedEmotion} dir="rtl">
                  <SelectTrigger className="w-full bg-white/5 border-white/10 h-10 rounded-xl text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12141a] border-white/10 text-white">
                    {EMOTIONS.map(e => (
                      <SelectItem key={e.id} value={e.id} className="text-right">
                         <div className="flex items-center gap-2">
                            <span>{e.icon}</span>
                            <span>{e.label}</span>
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             <div className="pt-3">
                <GradientButton
                  onClick={handleGenerate}
                  disabled={!text.trim() || isGenerating}
                  loading={isGenerating}
                  loadingText="جاري التوليد..."
                  size="lg"
                  showArrow={false}
                  className="w-full rounded-xl h-16"
                >
                  <div className="flex flex-col items-center justify-center -space-y-1">
                    <span className="text-white font-bold text-base">توليد التعليق الصوتي</span>
                    <span className="text-[12px] font-bold text-amber-400 flex items-center gap-1.5 bg-amber-400/10 px-3 py-0.5 rounded-full border border-amber-400/20">
                      {totalCost} كريديت
                      <Zap size={10} className="fill-amber-400" />
                    </span>
                  </div>
                </GradientButton>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
           <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar">
              {history.length === 0 && !isHistoryLoading ? (
                  <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                     <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Music size={40} className="text-blue-400" />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-2xl font-bold">مختبر الصوت الذكي</h2>
                        <p className="text-gray-500 max-w-md">أدخل النص واختر الإعدادات من القائمة الجانبية لإنتاج تعليق صوتي سينمائي فائق الجودة.</p>
                     </div>
                     <Button 
                       onClick={() => setShowSettings(true)}
                       className="lg:hidden bg-blue-600 hover:bg-blue-700 px-8 h-12 rounded-xl font-bold"
                     >ابدأ الآن</Button>
                  </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-bold text-lg"><History size={20} className="text-blue-400"/> مقاطعك الصوتية ({history.length})</h3>
                      {history.length > 0 && (
                        <Button variant="ghost" className="text-xs text-gray-500 hover:text-red-400" onClick={async () => {
                           if (confirm("مسح السجل بالكامل؟")) {
                             await clearAIHistory(token, 'AUDIO');
                             setHistory([]);
                             setSelectedAudio(null);
                             setIsPlaying(false);
                             showSuccess("تم مسح السجل");
                           }
                        }}>مسح الكل</Button>
                      )}
                   </div>

                   {isHistoryLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                       {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                        {history.map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layoutId={item.id}
                            onClick={() => {
                              if (item.isGenerating) return;
                              
                              if (selectedAudio?.id === item.id) {
                                togglePlay();
                              } else {
                                setSelectedAudio(item);
                                if (audioRef.current && item.url) {
                                  audioRef.current.src = item.url;
                                  audioRef.current.play();
                                  setIsPlaying(true);
                                }
                              }
                            }}
                            className={clsx(
                              "group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-3",
                              selectedAudio?.id === item.id && !item.isGenerating ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                            )}
                          >
                            {/* Animated Background for active item */}
                            {selectedAudio?.id === item.id && isPlaying && !item.isGenerating && (
                              <motion.div 
                                className="absolute inset-0 bg-blue-500/5 z-0"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}

                            {item.isGenerating ? (
                              <div className="flex items-center gap-3 relative z-10 w-full h-full my-auto">
                                 <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <Loader2 size={16} className="text-blue-400 animate-spin" />
                                 </div>
                                 <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-2.5 bg-white/10 rounded w-2/3 animate-pulse" />
                                    <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
                                 </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start gap-4 relative z-10">
                                   <div className={clsx(
                                     "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-md",
                                     selectedAudio?.id === item.id && isPlaying 
                                       ? "bg-blue-500 text-white" 
                                       : "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
                                   )}>
                                      {selectedAudio?.id === item.id && isPlaying ? (
                                        <Pause size={18} fill="currentColor" />
                                      ) : (
                                        <Play size={18} fill="currentColor" className="ml-1" />
                                      )}
                                   </div>
                                   <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium line-clamp-2 leading-relaxed" dir="rtl">&quot;{item.text}&quot;</p>
                                      <p className="text-[10px] text-white mt-1.5">{new Date(item.timestamp).toLocaleDateString('ar-EG')}</p>
                                   </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 relative z-10">
                                   <Button 
                                     size="sm"
                                     variant="ghost"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       downloadAudio(item.url, item.id);
                                     }}
                                     className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] gap-1.5"
                                   >
                                     <Download size={12} />
                                     تحميل
                                   </Button>
                                   <Button 
                                     size="sm"
                                     variant="ghost"
                                     onClick={(e) => deleteFromHistory(item.id, e)}
                                     className="h-8 w-8 p-0 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                   >
                                     <Trash2 size={12} />
                                   </Button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                        </AnimatePresence>
                     </div>
                   )}
                </div>
              )}
           </div>
        </main>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <SubscriptionRequiredModal 
        isOpen={subscriptionModalOpen} 
        onClose={() => setSubscriptionModalOpen(false)} 
      />
    </div>
  );
}

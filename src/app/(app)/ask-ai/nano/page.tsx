"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Zap,
  Loader2,
  ArrowRight,
  RefreshCw,
  Sliders,
  Palette,
  Cpu,
  Trash2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, generateAINano, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

const ASPECT_RATIOS = [
  { id: "1:1", label: "مربع", value: "1:1" },
  { id: "16:9", label: "واسع", value: "16:9" },
  { id: "9:16", label: "طولي", value: "9:16" },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  aspectRatio: string;
}

const MODEL_OPTIONS = [
  { id: "imagen-4.0", label: "Imagen 4.0 Pro", value: "imagen-4.0-generate-001", description: "الأحدث والأكثر دقة" },
  { id: "imagen-3.0", label: "Imagen 3.0", value: "imagen-3.0-generate-001", description: "كلاسيكي ومستقر" },
  { id: "imagen-3.0-fast", label: "Imagen 3.0 Fast", value: "imagen-3.0-fast-001", description: "سرعة مضاعفة" },
];

export default function NanoPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState("imagen-4.0-generate-001");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_nano_history");
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (token) loadStats();
  }, [token]);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem("ai_nano_history", JSON.stringify(history));
  }, [history]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error) { console.error("Failed to load stats:", error); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return showError("تنبيه", "اكتب وصفاً سريعاً!");
    if (!hasActiveSubscription) return showError("تنبيه", "تحتاج إلى اشتراك نشط!");
    
    setIsGenerating(true);
    try {
      const response = await generateAINano(token, {
        prompt: prompt.trim(),
        aspectRatio: selectedRatio,
        model: selectedModel
      });

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        aspectRatio: selectedRatio,
      };

      setHistory([newImage, ...history]);
      setSelectedImage(newImage);
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      
      showSuccess("تم التوليد بسرعة البرق!");
    } catch (error: any) {
      showError("خطأ", error.message || "حدث خطأ");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_nano_history", JSON.stringify(newHistory));
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

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white overflow-x-hidden selection:bg-yellow-500/30 font-sans">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-950/10 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a]/80">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/ask-ai">
              <Button variant="ghost" size="icon" className="group rounded-full bg-white/5 hover:bg-white/10 transition-all">
                <ArrowRight className="h-5 w-5 text-white" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tighter">
              <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                Nano banana Pro 🍌
              </span>
            </h1>
          </div>

          {stats && (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/5">
               <Zap size={14} className="text-yellow-400 fill-yellow-400" />
               <span className="text-sm font-bold font-mono">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-4">
           <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6">
              <div className="space-y-3">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sliders size={14} /> أبعاد سريعة
                 </label>
                 <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map(r => (
                       <button
                          key={r.id}
                          onClick={() => setSelectedRatio(r.value)}
                          className={clsx(
                             "py-2 rounded-xl text-[10px] font-bold transition-all border",
                             selectedRatio === r.value ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                          )}
                       >
                          {r.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={14} /> المحرك النشط
                 </label>
                 <div className="flex flex-col gap-2">
                    {MODEL_OPTIONS.map(m => (
                       <button
                          key={m.id}
                          onClick={() => setSelectedModel(m.value)}
                          className={clsx(
                             "p-3 rounded-xl text-right transition-all border flex items-center justify-between group",
                             selectedModel === m.value ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                          )}
                       >
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold">{m.label}</span>
                             <span className="text-[8px] opacity-60">{m.description}</span>
                          </div>
                          {selectedModel === m.value && <Zap size={10} className="fill-yellow-500" />}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div className="relative group">
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="وصف سريع..."
                   className="w-full min-h-[120px] bg-white/5 rounded-2xl p-4 pb-16 text-white placeholder:text-gray-600 outline-none border border-transparent focus:border-yellow-500/30 transition-all resize-none"
                 />
                 <div className="absolute bottom-3 right-3">
                   <GradientButton 
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      loading={isGenerating}
                      loadingIcon={<Loader2 className="animate-spin" />}
                      icon={<Zap />}
                      size="sm"
                      className="rounded-xl px-4"
                      showArrow={false}
                   >
                      {isGenerating ? "" : ""}
                   </GradientButton>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-yellow-500/5 to-transparent rounded-3xl p-6 border border-yellow-500/10 shadow-inner">
              <h3 className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-2">
                 <Sparkles size={14} /> وضع التوليد اللحظي
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                 استخدم Nano للحصول على نتائج سريعة جداً للمسودات والأفكار الأولية. يتميز هذا النموذج بالسرعة الفائقة مع الحفاظ على جودة فنية مقبولة جداً.
              </p>
           </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
           <div className="relative min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                 {selectedImage ? (
                    <motion.div
                       key="result"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="relative flex-1 rounded-[40px] bg-[#0a0c10] border border-white/10 overflow-hidden flex items-center justify-center p-8 group"
                    >
                       {/* Close Button */}
                       <div className="absolute top-4 right-4 z-30">
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => setSelectedImage(null)}
                             className="rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10"
                          >
                             <X size={18} />
                          </Button>
                       </div>

                       <img src={selectedImage.url} className="max-h-[600px] rounded-2xl shadow-2xl relative z-10" />
                       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button 
                             onClick={() => downloadImage(selectedImage.url, `nano-${selectedImage.id}.png`)}
                             className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-9 px-5"
                          >
                             <Download size={14} className="ml-2" /> حفظ
                          </Button>
                          <div className="w-px h-5 bg-white/20" />
                          <Button 
                             variant="ghost" 
                             size="icon"
                             className="rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-400 h-9 w-9"
                             onClick={(e) => deleteFromHistory(selectedImage.id, e)}
                          >
                             <Trash2 size={16} />
                          </Button>
                       </div>
                       <BorderBeam duration={3} colorFrom="#EAB308" colorTo="#EAB308" />
                    </motion.div>
                 ) : isGenerating ? (
                    <AILoader />
                 ) : (
                    <div className="flex-1 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center">
                       <Zap size={48} className="text-yellow-500/20 mb-6 animate-pulse" />
                       <h3 className="text-xl font-bold mb-2">تخيل في لحظات</h3>
                       <p className="text-gray-500">جرب وصفاً قصيراً وشاهد النتيجة تظهر بسرعة البرق.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>

           {history.length > 0 && (
             <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                {history.map(img => (
                   <motion.div 
                      layout
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={clsx(
                         "aspect-square rounded-xl cursor-pointer overflow-hidden border transition-all",
                         selectedImage?.id === img.id ? "border-yellow-500 scale-105 z-10" : "border-white/5 hover:border-white/20"
                      )}
                   >
                      <img src={img.url} className="w-full h-full object-cover" />
                   </motion.div>
                ))}
             </div>
           )}
        </section>
      </main>
    </div>
  );
}

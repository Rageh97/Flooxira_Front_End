"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  LayoutTemplate,
  Loader2,
  ArrowRight,
  History,
  Palette,
  Layers,
  Zap,
  X,
  Trash2,
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  generateAILogo, 
  listPlans, 
  getAIHistory,
  deleteAIHistoryItem,
  clearAIHistory,
  type AIStats,
  type AIHistoryItem
} from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  isGenerating?: boolean;
  progress?: number;
}

export default function LogoMakerPage() {
  const [token, setToken] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);
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
      const response = await getAIHistory(token, 'LOGO');
      const mappedHistory: GeneratedImage[] = response.history.map((item: AIHistoryItem) => ({
        id: item.id.toString(),
        url: item.outputUrl,
        prompt: item.prompt,
        timestamp: item.createdAt,
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
    if (!prompt.trim()) return showError("تنبيه", "ادخل اسم الشركة أو فكرة الشعار!");
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
      const response = await generateAILogo(token, {
        prompt: prompt.trim(),
        aspectRatio: "1:1",
      });

      clearInterval(progressInterval);

      const newImage: GeneratedImage = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        isGenerating: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم تصميم الشعار بنجاح!");
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
    if (!confirm("هل تريد حذف هذا التصميم؟")) return;
    
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
      showError("خطأ", error.message || "فشل حذف التصميم من السجل السحابي");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع التصميمات من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'LOGO');
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

  if (permissionsLoading) return <div className="h-screen  flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/10 via-blue-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="صانع الشعارات "
          modelBadge="AI LOGO"
          stats={stats}
        />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
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
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400" />
                وصف الشعار
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: شعار لشركة تقنية متطورة، يرمز للنمو والابتكار، ألوان زرقاء ملكية..."
                className="w-full min-h-[120px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={5}
              />
            </div>

            {/* Generate Button */}
            <GradientButton
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              loading={isGenerating}
              loadingText="جاري التصميم..."
              icon={<LayoutTemplate />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              صمم شعاري الآن
            </GradientButton>

          

      
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <LayoutTemplate size={80} className="text-indigo-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">ابدأ في تصميم شعارك</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    صف رؤيتك لعلامتك التجارية وسنقوم بتحويلها إلى شعار احترافي
                  </p>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold flex items-center gap-2 mx-auto transition-all"
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
                    <History size={16} className="text-indigo-400 lg:hidden" />
                    <History size={18} className="text-indigo-400 hidden lg:block" />
                    أعمالك ({history.length})
                  </h2>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 flex items-center justify-center transition-all"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((logo) => (
                    <motion.div
                      key={logo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all"
                    >
                      {logo.isGenerating ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${logo.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري التصميم...</p>
                        </div>
                      ) : (
                        <>
                          {/* Logo Image */}
                          <img
                            src={logo.url}
                            alt={logo.prompt}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedImage(logo)}
                          />

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-2">{logo.prompt}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(logo);
                                  }}
                                  className="flex-1 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs"
                                >
                                  <Eye size={12} className="ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(logo.url, `logo-${logo.id}.png`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(logo.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedImage?.id === logo.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
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

      {/* Logo Preview Modal */}
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
                    onClick={() => downloadImage(selectedImage.url, `logo-${selectedImage.id}.png`)}
                    className="rounded-xl bg-indigo-500 hover:bg-indigo-600 h-10 px-6"
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
        title="اشتراك مطلوب لتصميم الشعارات"
        description="للاستفادة من تقنية تصميم الشعارات الاحترافية وإنشاء هوية بصرية مميزة لعلامتك التجارية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

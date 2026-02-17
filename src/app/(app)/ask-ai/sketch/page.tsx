"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Upload, Download, Palette, 
  Loader2, ArrowRight, Zap, History, X, Trash2, Eye, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { 
  getAIStats, 
  processAIImage, 
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

interface ProcessedImage {
  id: string;
  url: string;
  original: string;
  prompt?: string;
  timestamp: string;
  isProcessing?: boolean;
  progress?: number;
}

export default function SketchPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedImage | null>(null);
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
      const response = await getAIHistory(token, 'IMAGE');
      // Filter for sketch operations only
      const mappedHistory: ProcessedImage[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'sketch')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          original: (item.options as any)?.originalImageUrl || "",
          prompt: item.prompt,
          timestamp: item.createdAt,
        }));
      setHistory(mappedHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  useEffect(() => { if (token) { loadStats(); checkAIPlans(); loadHistory(); } }, [token]);


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
    
    if (!previewUrl) return showError("تنبيه", "ارفع رسمتك اليدوية أولاً!");

    const placeholderId = Date.now().toString();
    const placeholder: ProcessedImage = {
      id: placeholderId,
      url: "",
      original: previewUrl,
      prompt: prompt.trim() || "Realistic detailed masterpiece",
      timestamp: new Date().toISOString(),
      isProcessing: true,
      progress: 0,
    };

    setHistory([placeholder, ...history]);
    setIsProcessing(true);

    const progressInterval = setInterval(() => {
      setHistory(prev => prev.map(img => 
        img.id === placeholderId && img.isProcessing
          ? { ...img, progress: Math.min((img.progress || 0) + Math.random() * 15, 90) }
          : img
      ));
    }, 500);

    try {
      const res = await processAIImage(token, {
        operation: 'sketch',
        imageUrl: previewUrl,
        prompt: prompt.trim() || "Realistic detailed masterpiece, high quality"
      });

      clearInterval(progressInterval);

      const newItem: ProcessedImage = {
        id: (res as any).historyId?.toString() || placeholderId,
        url: res.imageUrl,
        original: previewUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        isProcessing: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newItem : img));
      await loadStats();
      showSuccess("تم تحويل الرسمة بنجاح!");
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: res.remainingCredits,
        usedCredits: prev.usedCredits + (res as any).creditsUsed
      } : null);
    } catch (e: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      showError("خطأ", e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا التصميم؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(h => h.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedResult?.id === id) setSelectedResult(null);
      showSuccess("تم الحذف.");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف التصميم من السجل السحابي");
    }
  };

  const clearHistory = async () => {
    if (!confirm("هل تريد مسح سجل التصميمات بالكامل من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'IMAGE');
      setSelectedResult(null);
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

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-pink-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title=" حول رسمك الى واقع  "
          modelBadge="SKETCH AI"
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
            {/* Upload Image */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Upload size={14} className="text-purple-400" />
                ارفع رسمك اليدوي
              </label>
              <div 
                className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group hover:border-purple-500/30 transition-all"
                onClick={() => document.getElementById('file-s')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-contain opacity-50 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Palette className="text-purple-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <Palette className="text-gray-700 group-hover:text-purple-400 transition-colors" size={48} />
                )}
              </div>
              <input id="file-s" type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const r = new FileReader();
                  r.onload = () => setPreviewUrl(r.result as string);
                  r.readAsDataURL(file);
                }
              }} />
            </div>
            
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                وصف النتيجة النهائية
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="مثال: منظر طبيعي للجبال وقت الغروب، جودة سينمائية، تفاصيل دقيقة..."
                className="w-full min-h-[100px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={4}
              />
            </div>

            {/* Process Button */}
            <GradientButton
              onClick={handleProcess}
              disabled={!previewUrl || isProcessing}
              loading={isProcessing}
              loadingText="جاري التحويل..."
              icon={<Sparkles />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              حول الرسمة لصورة
            </GradientButton>

            {/* Info Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Palette className="text-purple-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-purple-300">من خربشة إلى إبداع</h3>
                  <p className="text-xs text-gray-400">
                    حوّل أبسط الرسومات اليدوية إلى صور واقعية مذهلة بتوجيه نصي
                  </p>
                </div>
              </div>
            </div>

     
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Palette size={80} className="text-purple-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">في انتظار لمستك الفنية</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    ارفع رسمك اليدوي وسنقوم بتحويله إلى واقع ملموس بدقة عالية
                  </p>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold flex items-center gap-2 mx-auto transition-all"
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
                    className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري التحويل...</p>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <img
                            src={item.url}
                            alt={item.prompt}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedResult(item)}
                          />

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-1">{item.prompt || "رسم محول"}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(item);
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
                                    downloadImage(item.url, `sketch-${item.id}.png`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(item.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedResult?.id === item.id && (
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

      {/* Image Preview Modal */}
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

              {/* Before/After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">الرسم الأصلي</span>
                  <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={selectedResult.original}
                      alt="Original"
                      className="w-full max-h-[70vh] object-contain opacity-50 grayscale"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">النتيجة النهائية</span>
                  <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={selectedResult.url}
                      alt="Result"
                      className="w-full max-h-[70vh] object-contain"
                    />
                    <BorderBeam />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 line-clamp-1">{selectedResult.prompt || "رسم محول"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadImage(selectedResult.url, `sketch-${selectedResult.id}.png`)}
                    className="rounded-xl bg-purple-500 hover:bg-purple-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedResult.id, e)}
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
        title="اشتراك مطلوب لتحويل الرسم"
        description="للاستفادة من تقنية تحويل الرسومات اليدوية لصور واقعية وتحويل أفكارك الإبداعية إلى واقع ملموس، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

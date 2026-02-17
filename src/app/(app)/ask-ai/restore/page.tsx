"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History, Loader2, ArrowRight, Image as ImageIcon, 
  Zap, Trash2, X, Eye, RefreshCw, Settings
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
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";
import clsx from "clsx";

interface ProcessedImage {
  id: string;
  url: string;
  originalUrl?: string;
  timestamp: string;
  operation: string;
  isProcessing?: boolean;
  progress?: number;
}

export default function RestorePage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedImage | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [hasAIPlans, setHasAIPlans] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
      // Filter for restore operations only
      const mappedHistory: ProcessedImage[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'restore')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          originalUrl: (item.options as any)?.inputUrl || "",
          timestamp: item.createdAt,
          operation: 'restore',
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
    }
  }, [token]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error) { console.error(error); }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "يرجى اختيار صورة!");
    
    // Check if user has active subscription OR remaining credits
    const hasCredits = stats && (stats.isUnlimited || stats.remainingCredits > 0);
    if (!hasActiveSubscription && !hasCredits) {
      setSubscriptionModalOpen(true);
      return;
    }

    const placeholderId = Date.now().toString();
    const placeholder: ProcessedImage = {
      id: placeholderId,
      url: "",
      originalUrl: previewUrl,
      timestamp: new Date().toISOString(),
      operation: 'restore',
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
      const response = await processAIImage(token, {
        operation: 'restore',
        imageUrl: previewUrl,
        prompt: "Restore old photo, fix damage, clean scratches, enhance face details, perfect color balance"
      });

      clearInterval(progressInterval);

      const newImage: ProcessedImage = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        operation: 'restore',
        isProcessing: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setSelectedResult(newImage);
      await loadStats();
      setStats(prev => prev ? { 
        ...prev, 
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + response.creditsUsed
      } : null);
      showSuccess("تم ترميم الصورة بنجاح!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      showError("خطأ", error.message);
    } finally { setIsProcessing(false); }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(img => img.id !== id));
    
    try {
      if (id.length < 15) {
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedResult?.id === id) setSelectedResult(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الصورة من السجل السحابي");
    }
  };

  const clearHistory = async () => {
    if (!confirm("هل تريد مسح السجل بالكامل من السحابة؟")) return;

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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-amber-900/10 via-yellow-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="ترميم الصور القديمة  "
          modelBadge="RESTORE AI"
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
                <Upload size={14} className="text-amber-400" />
                الصورة الأصلية
              </label>
              <div 
                className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload hover:border-amber-500/30 transition-all"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-amber-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-4 group-hover/upload:text-amber-400 transition-colors" size={40} />
                    <span className="text-sm">ارفع صورة قديمة هنا</span>
                  </>
                )}
                <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
            </div>

            {/* Process Button */}
            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl || isProcessing}
              loading={isProcessing}
              loadingText="جاري الترميم..."
              icon={<RefreshCw />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              ابدأ الترميم الآن
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
                  <RefreshCw size={80} className="text-amber-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">أعد إحياء ذكرياتك</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    ارفع صورتك القديمة لنعيد لها بريقها ووضوح الوجوه فيها بذكاء
                  </p>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold flex items-center gap-2 mx-auto transition-all"
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
                    <History size={16} className="text-amber-400 lg:hidden" />
                    <History size={18} className="text-amber-400 hidden lg:block" />
                    أعمالك ({history.length})
                  </h2>
                  {/* Mobile Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 flex items-center justify-center transition-all"
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
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all"
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري الترميم...</p>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <img
                            src={item.url}
                            alt="Restored"
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedResult(item)}
                          />

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(item);
                                  }}
                                  className="flex-1 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs"
                                >
                                  <Eye size={12} className="ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(item.url, `restored-${item.id}.png`);
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
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
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
              {selectedResult.originalUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">قبل الترميم</span>
                    <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                      <img
                        src={selectedResult.originalUrl}
                        alt="Original"
                        className="w-full max-h-[60vh] object-contain opacity-50 grayscale"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs text-amber-400 uppercase tracking-widest font-bold">بعد الترميم</span>
                    <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                      <img
                        src={selectedResult.url}
                        alt="Restored"
                        className="w-full max-h-[60vh] object-contain"
                      />
                      <BorderBeam />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => downloadImage(selectedResult.url, `restored-${selectedResult.id}.png`)}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 h-10 px-6"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <SubscriptionRequiredModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        title="اشتراك مطلوب لترميم الصور"
        description="للاستفادة من تقنية ترميم الصور القديمة والتالفة وإعادة إحيائها بجودة عالية مع إصلاح الخدوش والعيوب، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

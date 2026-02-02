"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History, Loader2, ArrowRight, Image as ImageIcon, 
  Zap, Trash2, X, Eye, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIImage, listPlans, type AIStats } from "@/lib/api";
import Loader from "@/components/Loader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import AskAIToolHeader from "@/components/AskAIToolHeader";

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
  
  const { showSuccess, showError } = useToast();
  const { hasActiveSubscription, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
      const savedHistory = localStorage.getItem("ai_restore_history");
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => { 
    if (token) {
      loadStats();
      checkAIPlans();
    }
  }, [token]);

  useEffect(() => { 
    if (history.length > 0) localStorage.setItem("ai_restore_history", JSON.stringify(history)); 
  }, [history]);

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
    if (!hasActiveSubscription) {
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
        id: placeholderId,
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        operation: 'restore',
        isProcessing: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setSelectedResult(newImage);
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

  const deleteFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    const newHistory = history.filter(img => img.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai_restore_history", JSON.stringify(newHistory));
    if (selectedResult?.id === id) setSelectedResult(null);
    showSuccess("تم الحذف بنجاح!");
  };

  const clearHistory = () => {
    if (!confirm("هل تريد مسح السجل بالكامل؟")) return;
    setHistory([]);
    localStorage.removeItem("ai_restore_history");
    setSelectedResult(null);
    showSuccess("تم مسح السجل بالكامل.");
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
    <div className="min-h-screen  text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-amber-900/10 via-yellow-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <AskAIToolHeader 
        title="ترميم الصور القديمة  "
        modelBadge="RESTORE AI"
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
                <Upload size={14} className="text-amber-400" />
                الصورة الأصلية
              </label>
              <div 
                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload hover:border-amber-500/30 transition-all"
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

            {/* Info Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-300">كيف تعمل تقنية الإحياء؟</h3>
                  <p className="text-xs text-gray-400">
                    ارفع صورة قديمة أو تالفة وسيقوم الذكاء الاصطناعي بإصلاح الخدوش وتحسين ملامح الوجوه
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
                  <RefreshCw size={80} className="text-amber-500/20 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">أعد إحياء ذكرياتك</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    ارفع صورتك القديمة لنعيد لها بريقها ووضوح الوجوه فيها بذكاء
                  </p>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <History size={18} className="text-amber-400" />
                    أعمالك ({history.length})
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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

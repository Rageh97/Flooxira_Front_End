"use client";

import { useState, useEffect } from "react";
import { 
  Upload, Download, Trash2, Eraser, Zap, Loader2, ArrowRight, History,
  Image as ImageIcon, X, Eye, Settings
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
  originalUrl?: string;
  timestamp: string;
  isProcessing?: boolean;
  progress?: number;
}

export default function BackgroundRemovalPage() {
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
      // Filter for bg-remove operations only
      const mappedHistory: ProcessedImage[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'bg-remove' || (item.options as any)?.operation === 'remove-bg')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          originalUrl: (item.options as any)?.originalImageUrl,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!previewUrl) return showError("تنبيه", "يرجى اختيار صورة أولاً!");
    // Check if user has active subscription OR remaining credits
    const hasCredits = stats && (stats.isUnlimited || stats.remainingCredits > 0);
    if (!hasActiveSubscription && !hasCredits) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) return showError("تنبيه", "رصيدك غير كافٍ");

    const placeholderId = Date.now().toString();
    const placeholder: ProcessedImage = {
      id: placeholderId,
      url: "",
      originalUrl: previewUrl,
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
      const response = await processAIImage(token, {
        operation: 'bg-remove',
        imageUrl: previewUrl
      });

      clearInterval(progressInterval);

      const newImage: ProcessedImage = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        isProcessing: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newImage : img));
      setStats(prev => prev ? { 
        ...prev, 
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم إزالة الخلفية بنجاح!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      showError("خطأ", error.message || "حدث خطأ أثناء المعالجة");
    } finally {
      setIsProcessing(false);
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

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    
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
      showError("خطأ", error.message || "فشل حذف الصورة من السجل السحابي");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال السابقة من السحابة؟")) return;

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

  if (permissionsLoading) return <div className="h-screen  flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-pink-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <div className="flex-shrink-0 z-50">
        <AskAIToolHeader 
          title="ازالة خلفية الصورة"
          modelBadge=" BG REMOVE"
          stats={stats}
        />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[2000px] mx-auto w-full relative">
        {/* Overlay for mobile */}
        {showSettings && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Sidebar - Settings (Fixed) */}
        <aside className={clsx(
          "w-80 border-l border-white/5 bg-[#0a0c10]/95 backdrop-blur-sm flex-shrink-0 transition-transform duration-300 z-50",
          "fixed lg:relative top-0 right-0 h-full overflow-y-auto custom-scrollbar",
          showSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="h-full overflow-y-auto scrollbar-hide p-6 space-y-5">
            {/* Mobile Close Button */}
            <button
              onClick={() => setShowSettings(false)}
              className="lg:hidden absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            
            {/* Upload Image */}
            <div className="space-y-2 mt-12 lg:mt-0">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Upload size={14} className="text-purple-400" />
                الصورة الأصلية
              </label>
              <div 
                className={clsx(
                  "relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group",
                  previewUrl ? "border-purple-500/50" : "border-white/10 hover:border-purple-500/30 bg-white/5"
                )}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-purple-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-500 mb-4 group-hover:text-purple-400 transition-colors" size={40} />
                    <span className="text-sm">اضغط لرفع صورة</span>
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
              loadingText="جاري العزل..."
              icon={<Eraser />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              إزالة الخلفية الآن
            </GradientButton>

   
          </div>
        </aside>

        {/* Main Content - Gallery (Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-10">
          <div className="p-4 lg:p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                  <Eraser size={60} className="lg:w-20 lg:h-20 text-purple-500/20 mb-4 mx-auto" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">عزل العناصر بذكاء</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    ارفع صورة وسنقوم بحذف الخلفية بدقة مذهلة خلال ثوانٍ
                  </p>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={18} />
                    <span>افتح الإعدادات</span>
                  </button>
                </div>
              </div>
            ) : (
              // Gallery Grid
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                    <History size={16} className="lg:w-[18px] lg:h-[18px] text-purple-400" />
                    أعمالك ({history.length})
                  </h2>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Settings size={16} />
                    <span>الإعدادات</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-4">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all"
                      style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Crect width=\"10\" height=\"10\" fill=\"%23ffffff\" fill-opacity=\"0.05\"/%3E%3Crect x=\"10\" y=\"10\" width=\"10\" height=\"10\" fill=\"%23ffffff\" fill-opacity=\"0.05\"/%3E%3C/svg%3E')" }}
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#0a0c10]">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري الإزالة...</p>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <img
                            src={item.url}
                            alt="No background"
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
                                    downloadImage(item.url, `no-bg-${item.id}.png`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handleDeleteItem(item.id, e)}
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

              {/* Image with Checkerboard Background */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Crect width=\"20\" height=\"20\" fill=\"%23ffffff\" fill-opacity=\"0.1\"/%3E%3Crect x=\"20\" y=\"20\" width=\"20\" height=\"20\" fill=\"%23ffffff\" fill-opacity=\"0.1\"/%3E%3C/svg%3E')" }}>
                <img
                  src={selectedResult.url}
                  alt="No background"
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">بدون خلفية</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadImage(selectedResult.url, `no-bg-${selectedResult.id}.png`)}
                    className="rounded-xl bg-purple-500 hover:bg-purple-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => handleDeleteItem(selectedResult.id, e)}
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
        title="اشتراك مطلوب لإزالة الخلفية"
        description="للاستفادة من تقنية إزالة الخلفية بدقة عالية وعزل العناصر بشكل احترافي مع الحفاظ على التفاصيل الدقيقة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

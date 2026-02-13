"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Upload, Download, Edit2, 
  Loader2, ArrowRight, Image as ImageIcon, Zap, Wand2, X, Trash2, History, Eye, Settings
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

interface EditedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  isProcessing?: boolean;
  progress?: number;
}

export default function ImageEditPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<EditedImage[]>([]);
  const [selectedResult, setSelectedResult] = useState<EditedImage | null>(null);
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
      // Filter for edit operations only
      const mappedHistory: EditedImage[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'edit')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          prompt: item.prompt,
          timestamp: item.createdAt,
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
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    
    if (!previewUrl || !prompt.trim()) return showError("تنبيه", "ارفع صورة واكتب ماذا تريد تعديله!");
    
    const placeholderId = Date.now().toString();
    const placeholder: EditedImage = {
      id: placeholderId,
      url: "",
      prompt: prompt.trim(),
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
        operation: 'edit',
        imageUrl: previewUrl,
        prompt: prompt.trim()
      });

      clearInterval(progressInterval);

      const newItem: EditedImage = {
        id: (res as any).historyId?.toString() || placeholderId,
        url: res.imageUrl,
        prompt: prompt.trim(),
        timestamp: new Date().toISOString(),
        isProcessing: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newItem : img));
      await loadStats();
      showSuccess("تم تعديل الصورة بنجاح!");
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
    <div className="min-h-screen  text-white font-sans rounded-xl" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-cyan-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
      {/* Header */}
      <AskAIToolHeader 
        title="تحرير الصور الذكي"
        modelBadge="AI EDIT"
        stats={stats}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)] max-w-[2000px] mx-auto relative">
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
          "fixed lg:relative top-0 right-0 h-full lg:h-auto",
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
                <Upload size={14} className="text-blue-400" />
                الصورة المراد تعديلها
              </label>
              <div 
                className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 group/upload hover:border-blue-500/30 transition-all"
                onClick={() => document.getElementById('file-e')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-contain opacity-50 group-hover/upload:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="text-blue-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <ImageIcon className="text-gray-600 group-hover/upload:text-blue-400 transition-colors" size={32} />
                )}
              </div>
              <input id="file-e" type="file" className="hidden" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const r = new FileReader();
                  r.onload = () => setPreviewUrl(r.result as string);
                  r.readAsDataURL(file);
                }
              }} />
            </div>
            
            {/* Edit Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                ماذا تريد أن تغير؟
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="مثال: غير لون القميص إلى أحمر، أضف نظارات شمسية، اجعل الخلفية في باريس..."
                className="w-full min-h-[100px] max-h-[200px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 resize-none transition-all overflow-y-auto scrollbar-hide"
                dir="rtl"
                rows={4}
              />
            </div>

            {/* Process Button */}
            <GradientButton
              onClick={handleProcess}
              disabled={!previewUrl || !prompt.trim() || isProcessing}
              loading={isProcessing}
              loadingText="جاري التعديل..."
              icon={<Wand2 />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              نفذ التعديل
            </GradientButton>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Edit2 className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-blue-300">تحرير ذكي</h3>
                  <p className="text-xs text-gray-400">
                    استخدم الأوامر النصية لتوجيه الذكاء الاصطناعي نحو التغييرات التي تريدها
                  </p>
                </div>
              </div>
            </div>

            {/* Clear History Button */}
            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearAll}
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
          <div className="p-4 lg:p-6">
            {history.length === 0 ? (
              // Empty State
              <div className="h-full min-h-[60vh] flex items-center justify-center">
                <div className="text-center px-4">
                  <Edit2 size={60} className="lg:w-20 lg:h-20 text-blue-500/20 mb-4 mx-auto" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">محرر الصور المتقدم</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    ارفع صورتك واكتب أوامرك لنتولى التعديل بدقة متناهية
                  </p>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold transition-transform hover:scale-105"
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
                    <History size={16} className="lg:w-[18px] lg:h-[18px] text-blue-400" />
                    أعمالك ({history.length})
                  </h2>
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold transition-transform hover:scale-105"
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
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all"
                    >
                      {item.isProcessing ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${item.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري التعديل...</p>
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
                              <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResult(item);
                                  }}
                                  className="flex-1 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs"
                                >
                                  <Eye size={12} className="ml-1" />
                                  عرض
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(item.url, `edit-${item.id}.png`);
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
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
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

              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={selectedResult.url}
                  alt={selectedResult.prompt}
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 line-clamp-2">{selectedResult.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadImage(selectedResult.url, `edit-${selectedResult.id}.png`)}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 h-10 px-6"
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
        title="اشتراك مطلوب لتحرير الصور"
        description="للاستفادة من تقنية تحرير الصور بالذكاء الاصطناعي وتطبيق التعديلات المتقدمة على صورك بدقة عالية، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

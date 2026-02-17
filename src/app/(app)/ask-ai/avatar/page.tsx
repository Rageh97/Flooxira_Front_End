"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Download, 
  Trash2,
  Loader2,
  History,
  ArrowRight,
  X,
  Zap,
  User,
  Eye,
  Upload,
  UserCircle,
  Settings
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
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { BorderBeam } from "@/components/ui/border-beam";
import AskAIToolHeader from "@/components/AskAIToolHeader";

const AVATAR_STYLES = [
  { id: "3d", label: "3D ستايل", prompt: "3D stylized character, Pixar style, highly detailed render, vibrant colors", color: "from-blue-500 to-cyan-500" },
  { id: "anime", label: "أنمي", prompt: "Modern anime style, studio ghibli aesthetic, clean line art", color: "from-pink-500 to-rose-500" },
  { id: "cyber", label: "سايبربانك", prompt: "Cyberpunk aesthetic, neon lighting, futuristic tech details, synthwave style", color: "from-purple-500 to-indigo-500" },
  { id: "oil", label: "زيتي", prompt: "Classical oil painting, museum quality art, brush strokes", color: "from-amber-500 to-orange-500" },
];

interface GeneratedAvatar {
  id: string;
  url: string;
  style: string;
  timestamp: string;
  isGenerating?: boolean;
  progress?: number;
}

export default function AvatarPage() {
  const [token, setToken] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("3d");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [history, setHistory] = useState<GeneratedAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<GeneratedAvatar | null>(null);
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
      // Filter for avatar operations only
      const mappedHistory: GeneratedAvatar[] = response.history
        .filter((item: AIHistoryItem) => (item.options as any)?.operation === 'avatar')
        .map((item: AIHistoryItem) => ({
          id: item.id.toString(),
          url: item.outputUrl,
          style: (item.options as any)?.style || "3d",
          timestamp: item.createdAt,
          isGenerating: false,
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
    if (!previewUrl) return showError("تنبيه", "ارفع صورة واضحة لوجهك!");
    if (!hasActiveSubscription) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (stats && !stats.isUnlimited && stats.remainingCredits < 15) return showError("تنبيه", "رصيدك غير كافٍ");

    const placeholderId = Date.now().toString();
    const styleConfig = AVATAR_STYLES.find(s => s.id === selectedStyle);
    const placeholder: GeneratedAvatar = {
      id: placeholderId,
      url: "",
      style: styleConfig?.label || "",
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
      const response = await processAIImage(token, {
        operation: 'avatar',
        imageUrl: previewUrl,
        prompt: `Convert this person into: ${styleConfig?.prompt}`
      });

      clearInterval(progressInterval);

      const newAvatar: GeneratedAvatar = {
        id: (response as any).historyId?.toString() || placeholderId,
        url: response.imageUrl,
        style: styleConfig?.label || "",
        timestamp: new Date().toISOString(),
        isGenerating: false,
        progress: 100,
      };

      setHistory(prev => prev.map(img => img.id === placeholderId ? newAvatar : img));
      await loadStats();
      setStats(prev => prev ? {
        ...prev,
        remainingCredits: response.remainingCredits,
        usedCredits: prev.usedCredits + (response as any).creditsUsed
      } : null);
      
      showSuccess("تم إنشاء الأفاتار بنجاح!");
    } catch (error: any) {
      clearInterval(progressInterval);
      setHistory(prev => prev.filter(img => img.id !== placeholderId));
      showError("خطأ", error.message || "حدث خطأ أثناء الإنشاء");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromHistory = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("هل تريد حذف هذا الأفاتار؟")) return;
    
    // Optimistic update
    const originalHistory = [...history];
    setHistory(history.filter(img => img.id !== id));
    
    try {
      if (id.length < 15) { // Assuming DB IDs are numeric/short
        await deleteAIHistoryItem(token, parseInt(id));
      }
      if (selectedAvatar?.id === id) setSelectedAvatar(null);
      showSuccess("تم الحذف بنجاح!");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل حذف الأفاتار من السجل السحابي");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأعمال من السحابة؟")) return;

    // Optimistic update
    const originalHistory = [...history];
    setHistory([]);

    try {
      await clearAIHistory(token, 'IMAGE');
      setSelectedAvatar(null);
      showSuccess("تم إخلاء السجل بالكامل.");
    } catch (error: any) {
      setHistory(originalHistory);
      showError("خطأ", error.message || "فشل مسح السجل السحابي");
    }
  };

  const downloadAvatar = async (url: string, filename: string) => {
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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-[#00050a] to-[#00050a]" />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-900/10 via-pink-900/5 to-transparent -z-10 blur-[100px] opacity-60" />
      
     {/* Header */}
      <div className="flex-shrink-0 z-50">
          <AskAIToolHeader 
            title="  انشاء أفاتار"
            modelBadge=" AI AVATAR"
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
                صورة الوجه
              </label>
              <div 
                className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-purple-500/50 transition-all bg-white/5 group"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Preview" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <UserCircle className="text-purple-400 mb-2" size={32} />
                      <span className="text-xs font-bold text-white">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <UserCircle className="text-gray-600 group-hover:text-purple-400 mx-auto mb-2 transition-colors" size={48} />
                    <p className="text-xs text-gray-500">اضغط لرفع صورة</p>
                  </div>
                )}
              </div>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setPreviewUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                النمط الفني
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {AVATAR_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={clsx(
                      "w-full text-center px-2 py-2 rounded-lg transition-all border text-[10px] font-medium",
                      selectedStyle === style.id
                        ? "bg-gradient-to-l border-transparent text-white shadow-lg " + style.color
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <GradientButton
              onClick={handleGenerate}
              disabled={!previewUrl || isGenerating}
              loading={isGenerating}
              loadingText="جاري الإنشاء..."
              icon={<Sparkles />}
              size="lg"
              className="w-full rounded-xl h-11"
            >
              إنشاء أفاتار
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
                  <User size={60} className="lg:w-20 lg:h-20 text-purple-500/20 mb-4 mx-auto" />
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">ابدأ في إنشاء أفاتاراتك</h3>
                  <p className="text-xs lg:text-sm text-gray-500 max-w-md mb-6">
                    ارفع صورة واختر النمط الفني وسنقوم بإنشاء أفاتار مذهل لك
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
                  {history.map((avatar) => (
                    <motion.div
                      key={avatar.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {avatar.isGenerating ? (
                        // Loading State with Progress
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: "0%" }}
                              animate={{ width: `${avatar.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">جاري الإنشاء...</p>
                        </div>
                      ) : (
                        <>
                          {/* Avatar Image */}
                          <img
                            src={avatar.url}
                            alt={avatar.style}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedAvatar(avatar)}
                          />

                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-xs text-white line-clamp-1">{avatar.style}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAvatar(avatar);
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
                                    downloadAvatar(avatar.url, `avatar-${avatar.id}.png`);
                                  }}
                                  className="h-8 w-8 p-0 rounded-lg bg-white/10 hover:bg-white/20"
                                >
                                  <Download size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => deleteFromHistory(avatar.id, e)}
                                  className="h-8 w-8 p-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedAvatar?.id === avatar.id && (
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

      {/* Avatar Preview Modal */}
      <AnimatePresence>
        {selectedAvatar && !selectedAvatar.isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedAvatar(null)}
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
                onClick={() => setSelectedAvatar(null)}
                className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={selectedAvatar.url}
                  alt={selectedAvatar.style}
                  className="w-full max-h-[80vh] object-contain"
                />
                <BorderBeam />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{selectedAvatar.style}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => downloadAvatar(selectedAvatar.url, `avatar-${selectedAvatar.id}.png`)}
                    className="rounded-xl bg-purple-500 hover:bg-purple-600 h-10 px-6"
                  >
                    <Download size={16} className="ml-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => deleteFromHistory(selectedAvatar.id, e)}
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
        title="اشتراك مطلوب لإنشاء الأفاتار"
        description="للاستفادة من تقنية إنشاء الأفاتار الشخصي بالذكاء الاصطناعي وتحويل صورتك إلى شخصيات رقمية مذهلة بأساليب فنية متنوعة، تحتاج إلى اشتراك نشط."
        hasAIPlans={hasAIPlans}
      />
    </div>
  );
}

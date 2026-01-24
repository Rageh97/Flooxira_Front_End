"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Upload, Download, History as HistoryIcon, 
  Loader2, ArrowRight, Image as ImageIcon, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { useToast } from "@/components/ui/toast-provider";
import { usePermissions } from "@/lib/permissions";
import { getAIStats, processAIImage, listPlans, type AIStats } from "@/lib/api";
import { clsx } from "clsx";
import Loader from "@/components/Loader";
import AILoader from "@/components/AILoader";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";

interface ProcessedImage {
  id: string;
  url: string;
  originalUrl?: string;
  timestamp: string;
  operation: string;
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
  useEffect(() => { if (history.length > 0) localStorage.setItem("ai_restore_history", JSON.stringify(history)); }, [history]);

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
    
    setIsProcessing(true);
    try {
      const response = await processAIImage(token, {
        operation: 'restore',
        imageUrl: previewUrl,
        prompt: "Restore old photo, fix damage, clean scratches, enhance face details, perfect color balance"
      });

      const newImage: ProcessedImage = {
        id: Date.now().toString(),
        url: response.imageUrl,
        originalUrl: previewUrl,
        timestamp: new Date().toISOString(),
        operation: 'restore'
      };

      setHistory([newImage, ...history]);
      setSelectedResult(newImage);
      setStats(prev => prev ? { ...prev, remainingCredits: response.remainingCredits } : null);
      showSuccess("تم ترميم الصورة بنجاح!");
    } catch (error: any) {
      showError("خطأ", error.message);
    } finally { setIsProcessing(false); }
  };

  if (permissionsLoading) return <div className="h-screen flex items-center justify-center bg-[#00050a]"><Loader text="جاري التحميل ..." size="lg" variant="warning" /></div>;

  return (
    <div className="min-h-screen bg-[#00050a] rounded-2xl text-white font-sans">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-[#00050a] to-[#00050a]" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/ask-ai"><Button variant="ghost" size="icon" className="group rounded-full bg-white/5"><ArrowRight className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">ترميم الصور القديمة</h1>
        </div>
        {stats && <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-2"><Zap size={14} className="text-amber-400" /> <span className="font-mono text-sm">{stats.isUnlimited ? "∞" : stats.remainingCredits}</span></div>}
      </header>

      <main className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0c10] rounded-[32px] p-6 border border-white/10 space-y-6 text-center">
            <div 
              className={clsx("aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden", previewUrl ? "border-amber-500/50" : "border-white/10 hover:border-amber-500/30")}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <><Upload size={40} className="text-gray-500 mb-4" /><span className="text-sm">ارفع صورة قديمة هنا</span></>}
            </div>
            <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            <GradientButton 
              onClick={handleProcess}
              disabled={!previewUrl}
              loading={isProcessing}
              loadingText="جاري الترميم..."
              loadingIcon={<Loader2 className="animate-spin" />}
              icon={<HistoryIcon />}
              size="lg"
            >
              ابدأ الترميم الآن
            </GradientButton>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <div className="min-h-[500px] rounded-[40px] bg-[#0a0c10] border border-white/10 flex items-center justify-center p-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedResult ? (
                <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center group">
                  <img src={selectedResult.url} className="max-h-[600px] rounded-2xl shadow-2xl transition-transform duration-500 hover:scale-[1.02]" />
                  <Button onClick={() => window.open(selectedResult.url)} className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 hover:bg-amber-600 h-10 px-8 font-bold opacity-0 group-hover:opacity-100 transition-opacity"><Download size={16} className="ml-2" /> تحميل الصورة المرممة</Button>
                  <BorderBeam />
                </motion.div>
              ) : isProcessing ? <AILoader /> : <div className="text-gray-600 flex flex-col items-center"><HistoryIcon size={64} className="mb-4 opacity-20" /><p>ارفع صورتك القديمة لنعيد لها بريقها</p></div>}
            </AnimatePresence>
          </div>

          {history.length > 0 && (
            <div className="grid grid-cols-8 gap-3">
              {history.map(h => <img key={h.id} src={h.url} onClick={() => setSelectedResult(h)} className={clsx("aspect-square rounded-xl cursor-pointer border-2 transition-all", selectedResult?.id === h.id ? "border-amber-500" : "border-transparent opacity-60 hover:opacity-100")} />)}
            </div>
          )}
        </section>
      </main>

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

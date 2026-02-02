"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ImageIcon,
  ArrowUpRight,
  Search,
  Zap,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BorderBeam } from "@/components/ui/border-beam";
import { getAIStats, listPlans, type AIStats } from "@/lib/api";
import Loader from "@/components/Loader";
import { usePermissions } from "@/lib/permissions";

export default function AskAIPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<AIStats | null>(null);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const response = await getAIStats(token);
      setStats(response.stats);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      id: 'ask-ai',
      title: 'شات GPT',
      desc: 'مساعدك الشخصي للدردشة والإجابة على الأسئلة',
      image: '/gpt فلوكسيرا.png',
      status: 'active',
      path: '/ask-ai/chat'
    },
    {
      id: 'text-to-image',
      title: 'تحويل النص لصورة',
      desc: 'حول خيالك إلى صور واقعية مذهلة بجودة فائقة',
      image: '/انشاء الصور.png',
      status: 'active',
      path: '/ask-ai/image'
    },
    {
      id: 'video-gen',
      title: 'توليد الفيديو',
      desc: 'أنشئ فيديوهات سينمائية من خلال النصوص بذكاء Veo 2.0',
      image: '/تاثيرات الفيديو.png',
      status: 'active',
      path: '/ask-ai/video'
    },
    {
      id: 'voice-gen',
      title: 'توليد الصوت',
      desc: 'حول النصوص إلى تعليق صوتي احترافي',
      image: '/انشاء تعليق صوتي.png',
      status: 'soon'
    },
    {
      id: 'image-to-text',
      title: 'تحويل الصورة الى نص',
      desc: 'تحويل الصورة الى بروميتات',
      path: '/ask-ai/image-to-text',
      image: '/الصورة لنص.png',
      status: 'active'
    },
  ];

  const imageTools = [
    { id: 't2i', title: 'حول النص الى صورة', desc: 'حول خيالك إلى صور واقعية مذهلة', path: '/ask-ai/image', image: '/انشاء الصور.png', status: 'active' },
    { id: 'upscale', title: 'تحسين الصور', desc: 'زيادة جودة ووضوح الصور بذكاء', path: '/ask-ai/upscale', image: '/رفع جودة الصور.png', status: 'active' },
    { id: 'nano', title: 'Nano banana Pro', desc: 'نموذج توليد صور فائق السرعة', path: '/ask-ai/nano', image: '/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png', status: 'active' },
    { id: 'logo', title: 'صانع الشعار', desc: 'صمم شعارات احترافية في ثوانٍ', path: '/ask-ai/logo', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000', status: 'active' },
    { id: 'edit', title: 'تحرير الصورة', desc: 'تعديل الصور بالذكاء الاصطناعي', path: '/ask-ai/edit', image: '/تعديل الصور.png', status: 'active' },
    { id: 'product', title: 'نماذج منتجات', desc: 'عرض منتجاتك في بيئات احترافية', path: '/ask-ai/product', image: '/نماذج لمنتجك.png', status: 'active' },
    { id: 'bg-remove', title: 'ازالة الخلفية', desc: 'حذف خلفية الصور بدقة عالية', path: '/ask-ai/bg-remove', image: '/ازالة الخلفية.png', status: 'active' },
    { id: 'avatar', title: 'انشاء افاتار', desc: 'اصنع شخصيتك الافتراضية الخاصة', path: '/ask-ai/avatar', image: '/انشاء افاتار.png', status: 'active' },
    { id: 'restore', title: 'ترميم الصور', desc: 'إصلاح الصور التالفة والقديمة', path: '/ask-ai/restore', image: '/ترميم الصور .jpeg', status: 'active' },
    { id: 'sketch', title: 'رسم الى صور', desc: 'حول رسوماتك اليدوية لصور واقعية', path: '/ask-ai/sketch', image: '/رسم الصور.png', status: 'active' },
    { id: 'colorize', title: 'تلوين الصورة', desc: 'تلوين الصور القديمة بالألوان الطبيعية', path: '/ask-ai/colorize', image: '/تلوين الصورة.png', status: 'active' },
  ];

  const videoTools = [
    { id: 'vgen', title: 'انشاء فيديو', desc: 'أنشئ فيديوهات سينمائية من النصوص', path: '/ask-ai/video', image: '/تاثيرات الفيديو.png', status: 'active' },
    { id: 'long-video', title: 'فيديو طويل', desc: 'دمج مشاهد متعددة في فيديو واحد طويل', path: '/ask-ai/long-video', image: '/تاثيرات الفيديو.png', status: 'active' },
    { id: 'motion', title: 'محاكاة الحركة', desc: 'إضافة حركة واقعية للعناصر', path: '/ask-ai/motion', image: '/محاكاة الحركة.png', status: 'active' },
    { id: 'ugc', title: 'فيديوهات ugc', desc: 'إنشاء محتوى فيديو تفاعلي', path: '/ask-ai/ugc', image: '/فيديوهات UGC.png', status: 'soon' },
    { id: 'effects', title: 'تأثيرات الفيديو', desc: 'إضافة تأثيرات بصرية مذهلة', path: '/ask-ai/effects', image: '/تاثيرات الفيديو.png', status: 'soon' },
    { id: 'lipsync', title: 'تحريك الشفاة', desc: 'مزامنة حركة الشفاه مع الصوت', path: '/ask-ai/lipsync', image: '/تحريك الشفاه.png', status: 'soon' },
    { id: 'resize', title: 'تغيير أبعاد الفيديو', desc: 'تغيير مقاسات الفيديو لمنصات التواصل', path: '/ask-ai/resize', image: '/تغيير الابعاد.png', status: 'soon' },
    { id: 'vupscale', title: 'تحسين الفيديو', desc: 'رفع جودة الفيديو بذكاء', path: '/ask-ai/vupscale', image: '/رفع جودة الفيديو .png', status: 'soon' },
  ];

  const filterTools = (tools: any[]) => {
    if (!toolSearchQuery.trim()) return tools;
    const query = toolSearchQuery.toLowerCase();
    return tools.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.desc.toLowerCase().includes(query)
    );
  };

  const displayFeatures = filterTools(features);
  const allTools = [...imageTools, ...videoTools];
  const displayAllTools = filterTools(allTools);

  const renderFeatureCard = (feature: any) => (
    <div
      key={feature.id}
      onClick={() => {
        if (feature.status !== 'active') return;
        if (feature.path) router.push(feature.path);
      }}
      className={`group relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer border border-white/5 bg-[#1a1c1e] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 ${
        feature.status === 'soon' ? 'opacity-80' : ''
      }`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={feature.image}
          alt={feature.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end">
        <div className="flex justify-between items-start mb-1 md:mb-2">
          <h3 className="text-sm md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {feature.title}
          </h3>
        </div>
        <p className="text-[10px] md:text-sm text-gray-400 line-clamp-2 mb-2 md:mb-4 group-hover:text-gray-300">
          {feature.desc}
        </p>
        
        <button
          disabled={feature.status === 'soon'}
          className="relative inline-flex h-6 md:h-7 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none w-20 md:w-25"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
          <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg px-3 md:px-7 text-[10px] md:text-sm font-medium backdrop-blur-3xl gap-1 md:gap-2 ${
            feature.status === 'active'
              ? 'bg-slate-950 text-white'
              : 'bg-slate-950 text-gray-500 cursor-not-allowed'
          }`}>
            {feature.status === 'active' ? 'ابدأ ' : 'قريباً'}
            {feature.status === 'active' && (
              <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />
            )}
          </span>
        </button>
      </div>
    </div>
  );

  if (permissionsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader text="جاري التحميل..." size="lg" variant="warning" showDots fullScreen={false} className="py-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-4 mt-4 md:mt-6 mb-6 md:mb-8 px-3 md:px-4">
        {/* Search Bar - Mobile First */}
        <div className="w-full md:hidden">
          <div className="relative rounded-[20px] overflow-hidden">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input 
              value={toolSearchQuery}
              onChange={(e) => setToolSearchQuery(e.target.value)}
              placeholder="ابحث عن أداة..."
              className="bg-[#1a1c1e]/50 w-full py-4 border border-white/30 text-right pr-9 h-11 rounded-[20px] text-sm focus-visible:ring-text-primary text-white placeholder:text-gray-300 shadow-xl shadow-black/5"
            /> 
            <BorderBeam duration={4} delay={9} />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="w-96 hidden xl:block shrink-0">
            <div className="relative rounded-[20px] overflow-hidden">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <input 
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                placeholder="ابحث عن أداة..."
                className="bg-[#1a1c1e]/50 w-full py-4 border border-white/30 text-right pr-9 h-11 rounded-[20px] text-sm focus-visible:ring-text-primary text-white placeholder:text-gray-300 shadow-xl shadow-black/5"
              /> 
              <BorderBeam duration={4} delay={9} />
            </div>
          </div>

          <div className="flex-1 flex justify-center gap-4">
            <Button
              onClick={() => router.push('/ask-ai')}
              className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-[20px] transition-all"
            >
              <Home className="w-5 h-5" />
              <span className="font-bold">الرئيسية</span>
            </Button>
            <Button
              onClick={() => router.push('/ask-ai/chat')}
              className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-[20px] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">شات GPT</span>
            </Button>
            <Button
              onClick={() => router.push('/ask-ai/media')}
              className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 px-6 py-3 rounded-[20px] transition-all"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-bold">أدوات الميديا</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 shrink-0 justify-end">
            {stats ? (
              <div className="hidden lg:flex items-center gap-4 bg-purple-600/10 border border-purple-500/30 px-6 py-2 rounded-[50px] backdrop-blur-md whitespace-nowrap">
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">رصيد الكريديت</span>
                  <span className="text-sm font-black text-purple-400">
                    {stats.isUnlimited ? 'غير محدود' : `${stats.remainingCredits.toLocaleString()} كريديت`}
                  </span>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/20 animate-pulse">
                  <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                </div>
              </div>
            ) : (
              <p></p>
            )}
            <button 
              className="hidden lg:flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-[20px] transition-all whitespace-nowrap"
              onClick={() => router.push('/ask-ai/plans')}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">باقات AI </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Buttons */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            onClick={() => router.push('/ask-ai')}
            className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-[20px] transition-all whitespace-nowrap text-xs"
          >
            <Home className="w-4 h-4" />
            <span className="font-bold">الرئيسية</span>
          </Button>
          <Button
            onClick={() => router.push('/ask-ai/chat')}
            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-[20px] transition-all whitespace-nowrap text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-bold">فلوكسيرا AI</span>
          </Button>
          <Button
            onClick={() => router.push('/ask-ai/media')}
            className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-[20px] transition-all whitespace-nowrap text-xs"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="font-bold">أدوات الميديا</span>
          </Button>
          <Button
            onClick={() => router.push('/ask-ai/plans')}
            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-[20px] transition-all whitespace-nowrap text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-bold">الباقات</span>
          </Button>
        </div>

        {/* Mobile Stats */}
        {stats && (
          <div className="flex md:hidden items-center justify-center gap-3 bg-purple-600/10 border border-purple-500/30 px-4 py-2 rounded-[20px] backdrop-blur-md">
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">رصيد الكريديت</span>
              <span className="text-xs font-black text-purple-400">
                {stats.isUnlimited ? 'غير محدود' : `${stats.remainingCredits.toLocaleString()} كريديت`}
              </span>
            </div>
            <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-500/20 animate-pulse">
              <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-3 md:px-4">
        <div className="w-full flex flex-col gap-8 md:gap-12">
          {/* Main Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 w-full mx-auto">
            {displayFeatures.map((feature) => renderFeatureCard(feature))}
          </div>

          {/* All Tools Section */}
          <div className="flex flex-col gap-6 md:gap-8 mb-12 md:mb-20">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-text-primary/50 to-transparent" />
              <h2 className="text-lg md:text-2xl font-bold text-white whitespace-nowrap px-2 md:px-4">
                تصفح جميع الأدوات
              </h2>
              <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-text-primary/50 to-transparent" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
              {displayAllTools.map((tool) => renderFeatureCard(tool))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

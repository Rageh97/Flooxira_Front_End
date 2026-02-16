"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Video,
  Mic,
  LayoutGrid,
  Sparkles,
  Zap,
  Package,
  Edit2,
  Eraser,
  LayoutTemplate,
  Palette,
  UserCircle,
  Droplets,
  History,
  Move,
  Users,
  Wand2,
  Maximize,
  FileVideo,
  Film,
  MessageSquare,
  ArrowUpRight,
  Search,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";

export default function MediaPage() {
  const router = useRouter();
  const [mediaSubTab, setMediaSubTab] = useState<'all' | 'images' | 'video' | 'audio'>('all');
  const [toolSearchQuery, setToolSearchQuery] = useState("");

  const imageTools = [
    { id: 't2i', permId: 'image_gen', title: 'حول النص الى صورة', desc: 'حول خيالك إلى صور واقعية مذهلة', icon: ImageIcon, path: '/ask-ai/image', image: '/انشاء الصور.webp', status: 'active' },
    { id: 'upscale', permId: 'image_upscale', title: 'تحسين الصور', desc: 'زيادة جودة ووضوح الصور بذكاء', icon: Sparkles, path: '/ask-ai/upscale', image: '/رفع جودة الصور.webp', status: 'active' },
    { id: 'nano', permId: 'image_nano', title: 'Nano banana Pro', desc: 'نموذج توليد صور فائق السرعة', icon: Zap, path: '/ask-ai/nano', image: '/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.webp', status: 'active' },
    { id: 'logo', permId: 'image_logo', title: 'صانع الشعار', desc: 'صمم شعارات احترافية في ثوانٍ', icon: LayoutTemplate, path: '/ask-ai/logo', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000', status: 'active' },
    { id: 'edit', permId: 'image_edit', title: 'تحرير الصورة', desc: 'تعديل الصور بالذكاء الاصطناعي', icon: Edit2, path: '/ask-ai/edit', image: '/تعديل الصور.webp', status: 'active' },
    { id: 'product', permId: 'image_product', title: 'نماذج منتجات', desc: 'عرض منتجاتك في بيئات احترافية', icon: Package, path: '/ask-ai/product', image: '/نماذج لمنتجك.webp', status: 'active' },
    { id: 'bg-remove', permId: 'image_bg_remove', title: 'ازالة الخلفية', desc: 'حذف خلفية الصور بدقة عالية', icon: Eraser, path: '/ask-ai/bg-remove', image: '/ازالة الخلفية.webp', status: 'active' },
    { id: 'avatar', permId: 'image_avatar', title: 'انشاء افاتار', desc: 'اصنع شخصيتك الافتراضية الخاصة', icon: UserCircle, path: '/ask-ai/avatar', image: '/انشاء افاتار.webp', status: 'active' },
    { id: 'restore', permId: 'image_restore', title: 'ترميم الصور', desc: 'إصلاح الصور التالفة والقديمة', icon: History, path: '/ask-ai/restore', image: '/ترميم الصور .webp', status: 'active' },
    { id: 'sketch', permId: 'image_sketch', title: 'رسم الى صور', desc: 'حول رسوماتك اليدوية لصور واقعية', icon: Palette, path: '/ask-ai/sketch', image: '/رسم الصور.png', status: 'active' },
    { id: 'colorize', permId: 'image_colorize', title: 'تلوين الصورة', desc: 'تلوين الصور القديمة بالألوان الطبيعية', icon: Droplets, path: '/ask-ai/colorize', image: '/تلوين الصورة.webp', status: 'active' },
    { id: 'image-to-text', permId: 'image_describe', title: 'تحويل الصورة الى نص', desc: 'تحويل الصورة الى بروميتات', path: '/ask-ai/image-to-text', image: '/الصورة لنص.png', status: 'active' },
  ];

  const videoTools = [
    { id: 'vgen', permId: 'video_gen', title: 'انشاء فيديو', desc: 'أنشئ فيديوهات سينمائية من النصوص', icon: Video, path: '/ask-ai/video', image: '/تاثيرات الفيديو.webp', status: 'soon' },
    { id: 'motion', permId: 'video_motion', title: 'محاكاة الحركة', desc: 'إضافة حركة واقعية للعناصر', icon: Move, path: '/ask-ai/motion', image: '/محاكاة الحركة.webp', status: 'active' },
    { id: 'ugc', permId: 'video_ugc', title: 'فيديوهات ugc', desc: 'إنشاء محتوى فيديو تفاعلي', icon: Users, path: '/ask-ai/ugc', image: '/فيديوهات UGC.webp', status: 'soon' },
    { id: 'effects', permId: 'video_effects', title: 'تأثيرات الفيديو', desc: 'إضافة تأثيرات بصرية مذهلة', icon: Wand2, path: '/ask-ai/effects', image: '/تاثيرات الفيديو.webp', status: 'soon' },
    { id: 'lipsync', permId: 'video_lipsync', title: 'تحريك الشفاة', desc: 'مزامنة حركة الشفاه مع الصوت', icon: MessageSquare, path: '/ask-ai/lipsync', image: '/تحريك الشفاه.webp', status: 'soon' },
    { id: 'resize', permId: 'video_resize', title: 'تغيير أبعاد الفيديو', desc: 'تغيير مقاسات الفيديو لمنصات التواصل', icon: Maximize, path: '/ask-ai/resize', image: '/تغيير الابعاد.png', status: 'soon' },
    { id: 'vupscale', permId: 'video_upscale', title: 'تحسين الفيديو', desc: 'رفع جودة الفيديو بذكاء', icon: FileVideo, path: '/ask-ai/vupscale', image: '/رفع جودة الفيديو .webp', status: 'soon' },
    { id: 'long-video', permId: 'video_gen', title: 'فيديو طويل', desc: 'دمج مشاهد متعددة في فيديو واحد طويل', icon: Film, path: '/ask-ai/long-video', image: '/تاثيرات الفيديو.webp', status: 'soon' },
  ];

  const renderMediaNav = () => (
    <div className="flex flex-wrap justify-center mb-5 gap-3 px-4">
      {[
        { id: 'all', label: 'الكل', icon: LayoutGrid },
        { id: 'images', label: 'الصور', icon: ImageIcon },
        { id: 'video', label: 'الفيديو', icon: Video },
        { id: 'audio', label: 'الصوت', icon: Mic }
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = mediaSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setMediaSubTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 mt-5 rounded-2xl transition-all duration-500 border backdrop-blur-md",
              isActive 
                ? "bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/20 scale-105" 
                : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={18} className={isActive ? "text-blue-400" : ""} />
            <span className="text-sm font-bold tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  const filterTools = (tools: any[]) => {
    let filtered = tools;
    
    if (toolSearchQuery.trim()) {
      const query = toolSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.desc.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  let displayTools: any[] = [];
  if (mediaSubTab === 'all') {
    displayTools = filterTools([...imageTools, ...videoTools]);
  } else if (mediaSubTab === 'images') {
    displayTools = filterTools(imageTools);
  } else if (mediaSubTab === 'video') {
    displayTools = filterTools(videoTools);
  }

  const renderFeatureCard = (feature: any) => (
    <div
      key={feature.id}
      onClick={() => {
        if (feature.status !== 'active') return;
        if (feature.path) router.push(feature.path);
      }}
      className={`group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-white/5 bg-[#1a1c1e] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 ${
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
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {feature.title}
          </h3>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4 group-hover:text-gray-300">
          {feature.desc}
        </p>
        
        <button
          disabled={feature.status === 'soon'}
          className="relative inline-flex h-7 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none w-25"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
          <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg px-7 text-sm font-medium backdrop-blur-3xl gap-2 ${
            feature.status === 'active'
              ? 'bg-slate-950 text-white'
              : 'bg-slate-950 text-gray-500 cursor-not-allowed'
          }`}>
            {feature.status === 'active' ? 'ابدأ ' : 'قريباً'}
            {feature.status === 'active' && (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 mt-0 mb-8 px-4">
        <div className="w-96 hidden xl:block shrink-0">
          <div className="relative rounded-[20px] overflow-hidden">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input 
              value={toolSearchQuery}
              onChange={(e) => setToolSearchQuery(e.target.value)}
              placeholder="ابحث عن أداة..."
              className="bg-[#1a1c1e]/50 w-full py-4 border-white/10 text-right pr-9 h-11 rounded-[20px] text-sm focus-visible:ring-blue-500 text-white placeholder:text-gray-300 shadow-xl shadow-black/5"
            /> 
            <BorderBeam duration={4} delay={9} />
          </div>
        </div>

  {/* Media Navigation */}
      {renderMediaNav()}

        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/ask-ai')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowRight className="h-5 w-5" />
            <span>العودة للرئيسية</span>
          </Button>
        </div>

    
        {/* <div className="w-96 shrink-0" /> */}
      </div>


      {/* Content */}
      <div className="flex-1 px-4">
        {mediaSubTab === 'audio' ? (
          <div className="flex flex-col items-center justify-center py-32 w-full animate-in fade-in duration-700">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <Mic size={80} className="relative text-primary animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">سيتوفر قريباً</h3>
            <p className="text-gray-400 text-lg">نحن نعمل على إضافة ميزات توليد الصوت الاحترافية</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-12 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full mx-auto">
              {displayTools.map((tool) => renderFeatureCard(tool))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

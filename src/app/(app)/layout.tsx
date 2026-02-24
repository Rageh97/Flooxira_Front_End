"use client";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import React, { PropsWithChildren, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { getPostUsageStats, getMySubscription, getAIStats, apiFetch, type AIStats } from "@/lib/api";
import { getAllNewsTickers, type NewsTicker } from "@/lib/settingsApi";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import RippleGrid from '@/components/RippleGrid';
import { X, Megaphone, Menu, Home, MessageCircle, Send, LogOut, MessageSquare, Link as LinkIcon, Users as UsersIcon, Settings as SettingsIcon, Bot, LayoutGrid, TagIcon, ChartNoAxesColumn, User, Stars, Webhook, PanelRightOpen, PanelRightClose, MessageCircleCode, MessageCircleCodeIcon, Zap, ArrowUpCircle, Calendar, Crown, CrownIcon, Coins } from "lucide-react";
import { toast } from "sonner";
import { getActiveIslamicQuotes, IslamicQuote } from "@/lib/islamicQuoteApi";




const navItems = [
  { href: "/dashboard", label: " الرئيسية", img: "/الرئيسية.webp" },
  // { href: "/inbox", label: "الدردشات", img: "/الدردشات.webp" },
  { href: "/ask-ai", label: "  أدوات Ai", img: "/اداوات ai.webp" },
  { href: "/whatsapp", label: "ادارة واتساب", img: "/واتساب.webp" },
  { href: "/tickets", label: "لايف شات", img: "/لايف شات.webp" },
  { href: "/telegram", label: "ادارة تلغرام", img: "/تليغرام.webp" },
  { href: "/customers", label: "العملاء والمحاسبة", img: "/العملاء ولمحاسبة.webp" },
  { href: "/schedule", label: "المحتوى المجدول", img: "/الجدولة.webp" },
  { href: "/events-plugin", label: " Webhook + Api ", img: "/الربط api.webp" },
  { href: "/create-post", label: " إنشاء منشور", img: "/انشاء منشور.webp" },
  { href: "/content", label: "ادارة المحتوى", img: "/ادارة المحتوى.webp" },
  { href: "/services", label: "تسويق للموردين", img: "/تسويق للموردين.webp" },
  { href: "/settings", label: "إدارة الحسابات", img: "/اعدادات.png" },
  { href: "/employees", label: "إدارة الموظفين", img: "/الموظفين.webp" },
  { href: "/plans", label: "باقات الاشتراك", img: "/الباقات.webp" },
  { href: "/my-subscription", label: "الاشتراك الفعال", img: "/الاشتراك الفعال.webp" },
  { href: "/tutorials", label: "شروحات المنصة", img: "/الشروحات.webp" },
  { href: "/reviews", label: "تقييمات المنصة ", img: "/التقييمات.webp" },
  { href: "/policy", label: "السياسة والشروط", img: "/السياسات.webp" },
  { href: "/admin", label: "إدارة المنصة", img: "/setting.gif" },

  // { href: "/my-subscription-requests", label: "طلبات الاشتراك", img: "/order.png" },
  // { href: "/billing", label: "الفواتير" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { permissions } = usePermissions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [planName, setPlanName] = useState<string>("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ daysRemaining: number | null, colorClass: string }>({ daysRemaining: null, colorClass: '' });
  const [newsBarClosed, setNewsBarClosed] = useState(false);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);
  const [whatsappPendingCount, setWhatsappPendingCount] = useState<number>(0);
  const [telegramPendingCount, setTelegramPendingCount] = useState<number>(0);
  const [newsItems, setNewsItems] = useState<NewsTicker[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const showRandomQuote = async () => {
      // Prevent stacking: if tab is hidden, don't show toast, check again in 5s
      if (document.hidden) {
        timeoutId = setTimeout(showRandomQuote, 5000);
        return;
      }

      try {
        console.log("Fetching islamic quotes...");
        const res = await getActiveIslamicQuotes();
        console.log("Islamic quotes response:", res);
        
        let nextInterval = 30 * 1000; // Default fallback

        if (res.success && res.quotes.length > 0) {
          const randomQuote = res.quotes[Math.floor(Math.random() * res.quotes.length)];
          console.log("Displaying quote:", randomQuote);
          
          if (randomQuote.displayInterval) {
            nextInterval = randomQuote.displayInterval * 1000;
          }

          toast(randomQuote.content, {
            icon: <Stars className="w-5 h-5 text-primary" />,
            duration: 10000,
            style: { direction: 'rtl' }
          });
        } else {
            console.log("No active quotes found or request failed");
        }

        // Schedule next call dynamically
        timeoutId = setTimeout(showRandomQuote, nextInterval);

      } catch (error) {
        console.error("Failed to fetch islamic quotes", error);
        timeoutId = setTimeout(showRandomQuote, 30 * 1000);
      }
    };

    // Initial delay of 2 seconds
    timeoutId = setTimeout(showRandomQuote, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await getAllNewsTickers();
        if (res.success) {
          setNewsItems(res.tickers.filter(t => t.isActive));
        }
      } catch (e) {
        console.error("Failed to load news", e);
      }
    };
    loadNews();
  }, []);

  // حماية المسارات (Route Protection) للموظفين
  useEffect(() => {
    // ننتظر تحميل البيانات
    if (loading || !user || !permissions) return;

    // إذا كان المستخدم موظفاً، نتحقق من الصلاحيات
    if (user.role === 'employee') {
      const restrictedRoutes = [
        // الصفحات المحجوبة تماماً عن الموظفين
        { path: '/employees', allowed: false },
        { path: '/plans', allowed: false },
        { path: '/my-subscription', allowed: false },
        { path: '/my-subscription-requests', allowed: false },
        { path: '/settings', allowed: false },
        
        // الصفحات المرتبطة بصلاحيات محددة
        { path: '/ask-ai', allowed: permissions.canUseAI },
        { path: '/tickets', allowed: permissions.canManageTickets },
        { path: '/whatsapp', allowed: permissions.canManageWhatsApp },
        { path: '/telegram', allowed: permissions.canManageTelegram },
        { path: '/customers', allowed: permissions.canManageCustomers },
        { path: '/content', allowed: permissions.canManageContent },
        { path: '/create-post', allowed: permissions.canManageContent },
        { path: '/schedule', allowed: permissions.canManageContent },
        { path: '/services', allowed: permissions.canMarketServices },
        { path: '/salla', allowed: permissions.canSallaIntegration },
        { path: '/events-plugin', allowed: permissions.canUseEventsPlugin },
      ];

      // البحث عن المسار الحالي في القائمة
      const currentRoute = restrictedRoutes.find(r => pathname === r.path || pathname.startsWith(`${r.path}/`));
      
      if (currentRoute && !currentRoute.allowed) {
        console.warn(`[Route Protection] Access denied to ${pathname}`);
        toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        router.push('/dashboard');
      }
    }
  }, [pathname, user, permissions, loading, router]);

  // تحديد العناصر المتاحة حسب نوع المستخدم
  const visibleNavItems = useMemo(() => {
    // التحقق من أن البيانات محملة
    if (!user) {
      return navItems;
    }
    
    // تصفية العناصر حسب نوع المستخدم
    let filteredItems = navItems;

    // إخفاء إدارة المنصة عن غير الأدمن
    if (user.role !== 'admin') {
      filteredItems = filteredItems.filter(item => item.href !== '/admin');
    }

    // إذا كان موظف (role === 'employee')
    if (user.role === 'employee') {
      console.log('[Sidebar] User is EMPLOYEE, filtering nav items');
      return filteredItems.filter(item => {
        if (!item) return false;
        // إخفاء العناصر الإدارية الإضافية للمالك
        if (item.href === '/employees' || 
            item.href === '/plans' || 
            item.href === '/my-subscription' ||
            item.href === '/my-subscription-requests' ||
            item.href === '/settings') {
        
          return false;
        }
        
        // إظهار العناصر حسب الصلاحيات
        if (item.href === '/ask-ai' && !permissions?.canUseAI) return false;
        if (item.href === '/tickets' && !permissions?.canManageTickets) return false;
        if (item.href === '/whatsapp' && !permissions?.canManageWhatsApp) return false;
        if (item.href === '/telegram' && !permissions?.canManageTelegram) return false;
        if (item.href === '/customers' && !permissions?.canManageCustomers) return false;
        if ((item.href === '/content' || item.href === '/create-post' || item.href === '/schedule') && !permissions?.canManageContent) return false;
        if (item.href === '/services' && !permissions?.canMarketServices) return false;
        if (item.href === '/salla' && !permissions?.canSallaIntegration) return false;
        if (item.href === '/events-plugin' && !permissions?.canUseEventsPlugin) return false;
        
        return true;
      });
    }
    
    return filteredItems;
  }, [user, permissions]);

  useEffect(() => {
    setSidebarOpen(false);
    setWhatsappMenuOpen(false);
  }, [pathname]);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed]);

  // Tooltip functions
  const handleMouseEnter = (event: React.MouseEvent, content: string) => {
    if (!sidebarCollapsed) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipContent(content);
    setTooltipPosition({
      x: rect.left - 12, // يسار العنصر بدلاً من يمينه
      y: rect.top + rect.height / 2
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Load plan name
  useEffect(() => {
    const loadPlanName = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;
        
        // Try getting full subscription details first for accurate dates
        try {
          const subRes = await getMySubscription(token);
          if (subRes.success && subRes.subscription) {
            const name = subRes.subscription.plan.name;
            if (name && name !== 'No Plan' && name !== 'Error' && name.toLowerCase() !== 'noplan') {
              setPlanName(name);
            } else {
              setPlanName('غير محدد');
            }
            
            if (subRes.subscription.expiresAt) {
              const start = new Date(subRes.subscription.startedAt).getTime();
              const end = new Date(subRes.subscription.expiresAt).getTime();
              const now = new Date().getTime();

              const totalDuration = end - start;
              const remainingTime = end - now;
              const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

              let colorClass = 'text-green-500';

              if (remainingTime <= (totalDuration / 2)) {
                colorClass = 'text-yellow-500';
              }

              if (daysRemaining <= 5) {
                colorClass = 'text-red-500';
              }

              setSubscriptionStatus({ daysRemaining, colorClass });
              return; // Successfully loaded from subscription endpoint
            }
          }
        } catch (subError) {
          console.log('Failed to load subscription details, falling back to usage stats');
        }

        // Fallback to usage stats if my-subscription fails or returns no data
        const res = await getPostUsageStats(token);
        if (res.success && res.data) {
          const name = res.data.planName;
          if (name && name !== 'No Plan' && name !== 'Error' && name.toLowerCase() !== 'noplan') {
            setPlanName(name);
          } else {
            setPlanName('غير محدد');
          }
          // Old logic for dates from usage-stats (if available) - likely not needed if we want to rely on the above
        }
      } catch (error) {
        console.error('Failed to load plan name:', error);
      }
    };

    if (user && !loading) {
      loadPlanName();
    }
  }, [user, loading]);

  // Load pending counts (Tickets and WhatsApp Escalations)
  useEffect(() => {
    const loadPendingCounts = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;

        // Load AI stats
        try {
          const statsRes = await getAIStats(token);
          if (statsRes.success) setAiStats(statsRes.stats);
        } catch (e) {
          console.error("Failed to load AI stats", e);
        }

        // Load pending tickets count (Live Chat)
        try {
          const ticketData = await apiFetch<{ success: boolean; stats: any }>('/api/dashboard/tickets/stats', { authToken: token });
          if (ticketData.success) {
            const totalPending = (ticketData.stats?.pending || 0);
            setPendingTicketsCount(totalPending);
          }
        } catch (e) {
          console.error("Failed to load ticket stats", e);
        }

        // Load whatsapp stats for unread count
        try {
          const whatsappData = await apiFetch<{ success: boolean; stats: any }>('/api/whatsapp/stats', { authToken: token });
          if (whatsappData.success) {
            setWhatsappPendingCount(whatsappData.stats?.unreadCount || 0);
          }
        } catch (e) {
          console.error("Failed to load whatsapp stats", e);
        }
      } catch (error) {
        console.error('Failed to load pending counts:', error);
      }
    };

    if (user && !loading) {
      loadPendingCounts();
      
      // Refresh counts every 30 seconds
      const interval = setInterval(loadPendingCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  return (
    <AuthGuard>
    <div className="flex flex-col h-dvh overflow-hidden ">
      {/* Header - Fixed at top for both Desktop and Mobile */}
      <header className="flex items-center justify-between  px-3 md:px-6 py-2 bg-secondry border-b border-gray-600/50 z-30  h-16">
      
 {/* Right side: User Info */}
        <div className="flex items-center justify-end  gap-2 md:gap-4">
          
          <Link href="/profile" className="flex items-center gap-2 md:gap-3 hover:bg-white/5 p-1.5 md:p-2 rounded-xl transition-colors shrink-0">
            <img 
              src={!loading && user ? (user.avatar || (typeof window !== 'undefined' ? localStorage.getItem(`user_avatar_${user.id}`) : null) || "/user.gif") : "/user.gif"} 
              alt="User" 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-600/50" 
            />
            <div className="hidden md:flex flex-col items-start">
              {!loading && user && <span className="font-medium text-sm text-white">{user.name || user.email || "مستخدم"}</span>}
              {planName && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-primary gradient-border px-1.5 py-0.5 rounded">{planName}</span>
                  {subscriptionStatus.daysRemaining !== null && (
                    <span className={`text-[10px] font-bold ${subscriptionStatus.colorClass}  rounded px-1`}>
                      {subscriptionStatus.daysRemaining}يوم
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="md:hidden flex flex-col items-start">
               {planName && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-primary gradient-border text-center px-1.5 py-0.5 rounded-md">{planName}</span>
                  {subscriptionStatus.daysRemaining !== null && (
                    <span className={`text-[9px] font-bold ${subscriptionStatus.colorClass} mr-1`}>
                      {subscriptionStatus.daysRemaining}D
                    </span>
                  )} 
                </div>
              )}
            </div>

             
           
          </Link>
             
          {/* Divider and Quick Access Icons */}
          <div className="hidden md:flex items-center gap-1.5 h-10">
            
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 hover:bg-white/5 rounded-xl transition-all"
            title={sidebarCollapsed ? "فتح السايدبار" : "إغلاق السايدبار"}
          >
            {sidebarCollapsed ? <PanelRightOpen className="w-6 h-6 text-primary" /> : <PanelRightClose className="w-6 h-6 text-primary" />}
          </button>
            <Link href="/profile" className="p-2 text-gray-400 hover:text-primary hover:bg-white/5 rounded-xl transition-all group" title="الملف الشخصي">
                <Image src={'/اعدادات.png'} width={25} height={25} alt="الملف الشخصي"/>
            </Link>
            
            <Link href="/tickets" className="p-2 text-gray-400 hover:text-primary hover:bg-white/5 rounded-xl transition-all relative" title="لايف شات">
             <Image src={'/لايف شات.webp'} width={25} height={25} alt="لايف شات"/>
             {pendingTicketsCount > 0 && (
               <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                 {pendingTicketsCount}
               </span>
             )}
            </Link>
            
            <Link href="/schedule" className="p-2 text-gray-400 hover:text-primary hover:bg-white/5 rounded-xl transition-all" title="الجدولة">
             <Image src={'/الجدولة.webp'} width={25} height={25} alt="الجدولة"/>
            </Link>
            
            <Link href="/whatsapp/chats" className="p-2 text-gray-400 hover:text-green-500 hover:bg-white/5 rounded-xl transition-all relative" title="واتساب">
              <Image src={'/واتساب.webp'} width={25} height={25} alt="واتساب"/>
              {whatsappPendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  {whatsappPendingCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        {/* Center: Logo */}
        <div className="flex items-center justify-center ">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/Logo.gif" alt="logo" width={130} height={80} className="w-[100px] md:w-[130px] object-contain" />
          </Link>
        </div>
  {/* Left side: Mobile Menu Button (only mobile) */}
        <div className="flex items-center ">
          <div className="md:hidden">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="text-primary" size={24}/>
            </button>
          </div>
          
          {/* Desktop Left Spacer or something if needed */}
          <div className="hidden md:flex items-center gap-3">
             {aiStats && (
                <div className="flex items-center gradient-border border-0.5 border-primary gap-2 px-4 py-1  rounded-2xl  transition-all ">
                  <div className="flex items-center justify-center w-5 h-5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Coins size={16} className="text-yellow-500 " />
                  </div>
                 
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-white font-medium uppercase tracking-wider">الكريديت</span>
                  <span className="text-[10px] font-bold text-white">
                    {aiStats.isUnlimited ? 'بلا حدود' : aiStats.remainingCredits.toLocaleString()}
                  </span>
                </div>
                 
                </div>
             )}
             
             <Link 
                href="/plans" 
                className="flex items-center gradient-border gap-2 px-5 py-1.5 border-0.5 border-primary text-white rounded-2xl text-sm font-bold  transition-all"
             >
               <CrownIcon className="text-yellow-500 mb-1" size={16} />
                <span className="text-[10px]">ترقية الباقة</span>
             </Link>

             {(!loading && user && (subscriptionStatus.colorClass.includes('yellow') || subscriptionStatus.colorClass.includes('red'))) && (
                <Link href="/plans" className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-500 px-3 py-1.5 rounded-xl transition-colors font-bold border border-red-500/20">
                  تجديد الاشتراك
                </Link>
             )}
          </div>
        </div>
       
      </header>

      <div className="flex flex-1 overflow-hidden">
      <style jsx global>{`
        .tooltip-container {
          position: relative;
        }
        
        .tooltip-content {
          position: fixed;
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          white-space: nowrap;
          z-index: 9999;
          border: 1px solid #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
          pointer-events: none;
        }
        
        .tooltip-container:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
        }
        
        .tooltip-arrow {
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-right: 6px solid #1f2937;
        }
      `}</style>
  
      {/* Mobile sidebar + overlay */}
      <div className={clsx("fixed inset-0 z-40 md:hidden", sidebarOpen ? "block" : "hidden")}> 
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative bg-secondry z-50 h-full w-72  border-r border-[#08c47d50] text-white  shadow-xl flex flex-col">
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-600">
            <div className="font-bold text-primary mr-2 text-lg">القائمة</div>
            <button
              className="flex h-9 w-9 rounded-full cursor-pointer items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">إغلاق</span>
              ✕
            </button>
          </div>
          <nav className="px-2 py-2 space-y-1 overflow-y-auto scrollbar-hide flex-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname === item.href ? "gradient-border" : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.href === "/tickets" && pendingTicketsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingTicketsCount}
                    </span>
                  )}
                  {item.href === "/whatsapp" && whatsappPendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {whatsappPendingCount}
                    </span>
                  )}
                  {item.href === "/telegram" && telegramPendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {telegramPendingCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {/* <div className="pt-3">
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">القانونية</div>
              <Link
                href="/privacy-policy"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname === '/privacy-policy' ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                )}
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/terms"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname === '/terms' ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                )}
              >
                شروط الخدمة
              </Link>
            </div> */}
          </nav>
          {/* Logout at bottom */}
          <div className="border-t border-gray-600 p-4">
            {!loading && user && (
              <Button 
                size="sm" 
                onClick={() => { signOut(); router.push('/sign-in'); }}
                className="primary-button after:bg-red-500 text-white w-full"
              >
                تسجيل الخروج
              </Button>
            )}
          </div>
        </aside>
      </div>

      {/* Desktop sidebar - fixed position */}
      <div className={clsx(
        "hidden md:flex h-full flex-shrink-0 transition-all duration-300 relative",
        sidebarCollapsed ? "w-16" : "w-[240px]"
      )}>
        <aside className="w-full p-2  bg-secondry border-l border-gray-600/50 text-white flex flex-col overflow-hidden">
        <nav className={clsx("px-2 py-2 space-y-1 flex-1 overflow-y-auto scrollbar-hide", sidebarCollapsed && "px-1")}>
          {visibleNavItems.map((item) => (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 relative",
                  sidebarCollapsed ? "justify-center px-2" : "",
                  pathname === item.href ? "bg-light-custom text-white text-lg gradient-border" : "hover:bg-light-custom text-sm"
                )}
                onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(e, item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative flex-shrink-0">
                  <img src={item.img} className="w-5 h-5" alt="" />
                  {item.href === "/tickets" && pendingTicketsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {pendingTicketsCount}
                    </span>
                  )}
                  {item.href === "/whatsapp" && whatsappPendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {whatsappPendingCount}
                    </span>
                  )}
                  {item.href === "/telegram" && telegramPendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {telegramPendingCount}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            </div>
          ))}
          
          {!sidebarCollapsed ? (
            <>
              {!loading && user && (
                <Button 
                  size="sm" 
                  onClick={() => { signOut(); router.push('/sign-in'); }}
                  className="w-full primary-button after:bg-red-500 text-white "
                >
                  تسجيل خروج
                </Button>
              )}
            </>
          ) : (
            <>
              {!loading && user && (
                <div className="relative">
                  <button
                    onClick={() => { signOut(); router.push('/sign-in'); }}
                    className="w-full flex justify-center p-2 hover:bg-red-600/20 rounded-md transition-colors"
                    onMouseEnter={(e) => handleMouseEnter(e, 'تسجيل خروج')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
            </>
          )}
        </nav>
        </aside>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col flex-1 w-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto scrollbar-hide p-1 md:p-3 pb-24 md:pb-3">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 px-4 pb-2 ">
            {/* WhatsApp Popup Menu */}
            <div className={clsx(
              "absolute bottom-full left-0 right-0 bg-[#0f111a]/95 rounded-[30px] backdrop-blur-lg  transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.3)]",
              whatsappMenuOpen ? "max-h-[400px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
            )}>
              <div className="grid grid-cols-3 gap-4 px-4">
                 {[
                   { name: "الاتصال", href: "/whatsapp", icon: <LinkIcon size={20} /> },
                   { name: "المحادثات", href: "/whatsapp/chats", icon: <MessageCircle size={20} /> },
                   { name: "المجموعات", href: "/whatsapp/groups", icon: <UsersIcon size={20} /> },
                   { name: "الحملات", href: "/whatsapp/campaigns", icon: <Megaphone size={20} /> },
                   { name: "محتوى البوت", href: "/whatsapp/bot-content", icon: <Bot size={20} /> },
                   { name: "اعدادات الذكاء الاصطناعي", href: "/whatsapp/ai-settings", icon: <MessageCircle size={20} /> },
                   { name: "اوقات العمل", href: "/whatsapp/settings", icon: <SettingsIcon size={20} /> },
                   { name: "الاحصائيات", href: "/whatsapp/stats", icon: <ChartNoAxesColumn size={20} /> },
                   { name: "التصنيفات", href: "/whatsapp/tags", icon: <TagIcon size={20} /> },
                 ].map((item) => (
                   <Link 
                     key={item.href} 
                     href={item.href} 
                     onClick={() => setWhatsappMenuOpen(false)}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 active:scale-95 transition-all"
                   >
                     <div className="w-10 h-10 rounded-full inner-shadow flex items-center justify-center text-white shadow-lg">
                       {item.icon}
                     </div>
                     <span className="text-[10px] font-medium text-gray-300 mx-auto">{item.name}</span>
                   </Link>
                 ))}
              </div>
            </div>

            {/* Bottom Tabs with Shine Effect */}
            <div className="bg-fixed-40 backdrop-blur-lg inner-shadow rounded-[30px] nav-shine-effect">
                <div className="flex justify-around items-center h-16 px-2">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setWhatsappMenuOpen(false)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/dashboard' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {/* <Home size={22} className={pathname === '/dashboard' ? "fill-[#08c47d]/20" : ""} /> */}
                    <Image src="data:image/webp;base64,UklGRnwEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSNAAAAABgGLb2rLl+XF3t+TSvlEwCx8EkcU4PLklaK7VST/J3Z33It//ysVJETEB8k2uXlqsoqpVgGoiaoZvC00bQvZwBMagORuQIN5vOQhfhvZmJPztxW7D8MBV6gVs2yq6B5f3BK4aBa56Ba5WuLXQDcejJoEJOF8I04rYAGEwUiN+H5THSSEyr0B6m+tT8gjapyoR8Z5B/OyJXIP6SgIgD8glgGeOZwCXIuWn6qCYo/hQnZaJP4do//+4ZbjWG2cY0Cu7dHdWoCeFo7durgcL5KcIVlA4IIYDAAAQFgCdASowADAAPhkKg0EhBcd/mQQAYS2AF2cxv8A4hR+XVfMEpH9A+337SZSVyN/oPs57SfiYf2P8kP5z3K/Mv+w3Un/Ub2AP7h/Oet4/gHqAfrt6Xn68fB3+0/okZoB/APor7+XRHemjgH5AcjH/nwUP9H9oHx7/6nmJ+e/YG6M37HNBoOA0Fw3o+POTzusqEMWXAva+UTLRsXLfob96jPCOcaSXPsBfdvgVS604l/+Pqublb8lPgAD+/dgXD/hMDYuuYUnZn0A6j8UZN+jbiPa5t7ZsUo1YSQx8bRIew3hz0v4mYaIKqotiXzhfY4XhUqV/JWhTtTJay9N3dv5GFE5E96y1uaHoe0Aw3/rtKKWbST171mzyA83fGyv1U8jkYGXrBTUnFh6Ew5IZ76HD5Dt9hsQzS2bRJIpaLpwy1/w1lXTUhwR99w4OiaziA2+Tomzk7+OA2Y2YH//aeHe1lBgnOxff8+CZDN4dc2a0R/dwHdXPhb8e5LP6DFoshlrvUAxKAD/hyfjod/DQan69tNHdlWK/fDehY3oGFH9H/4lGR8R1MF4f+I1TZwxceYn5ng83hl79G7zZZJrVbZ44w24veUyWcqrXl90/0nIX6z8fZgW/pyaG5eivPL9pbI1YuoMeQHNOyfiBtBV+dk3mo6W4KWTQLCAOmgFjbu/GqQYMqA/BfvqM/kly3SYpiI56EGfg5ad4S+xYJSQc5NzI1mZkmcjxxmmAUC5zDg25p/y5jUaae/AUnqkEsTDMqUCtqO+kqDTrSnf7IzV5FL3M2uH9dXNalAV8x450jG5jU7jWCBBH/a0Ugp/3Zdud0f8Gsrbf90JGL5n+n/+eLq6XViKR+HFqCciWqH3vYGNE+Ge6gPaP7BEerD7FtG9qigf61/aom8PKEpU1tCD/gpfTxJcPoKVHoRGyeYpViz7z6Vj1UnC1GV1G0HFFJ7S7mmMXSO0Dzbfj7EwSq7EbdMxuMW2fSa6XBuPAOdh87A4ZmEYgkd0i0/19FWgZ5bv9oNmpucI+BYLQOYktRLMBmnOa2KCsAUbI5fqUb96aQ99YG1yerlERHvdijNiX//GDbDfCXWT/3A+CayrRBi1Q9WLZ++v3TKbPrd0/DF8Dk0cxBGA48n5VTKNTaMyhkA63DxFiTbrX61olr63fZUuKYR99SiMqQICUItqKNJPfXQxcHjzCBgAAAA==" alt="Home" width={40} height={40} className={pathname === '/dashboard' ? "fill-[#08c47d]/20" : ""} />
                      {pathname === '/dashboard' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" />}
                    </div>
                    {/* <span className="text-[10px] font-medium">الرئيسية</span> */}
                  </Link>

                  <button 
                    onClick={() => setWhatsappMenuOpen(!whatsappMenuOpen)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      whatsappMenuOpen || pathname.startsWith('/whatsapp') ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {/* <MessageCircle size={30} className={whatsappMenuOpen || pathname.startsWith('/whatsapp') ? "fill-[#08c47d]/20" : ""} /> */}
                      <Image src="data:image/webp;base64,UklGRlgEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSDEBAAABkGvb1rE957dt276Cv7Nt27bZOk6Z0raNS7Bt/T7RoxO1ETEB8D+qHZbZMjTSlhWhQ8Kk9PISMpevV5ipsptfRMGlTfYqNFsWUeJip6Y0m0so+ZqdJI+nKP2VnxSv96jwk48Em2eo9KWtkMZpVHxTS6QJlbcK2HxVt2jDN40EZ7mMFiksmvAUIclinnM0LnJofaXxVYsVgEQDWClUklk1VOpY3VR6We1UelhlVGpYiVQSWW5UfFnwmcZnTY4jNE4BZxqNLB6DzxS+6PPAKIUp4LYm8MmML5JAKfDPqDsOgreU3TcVsFpX9doZBHNQ8QMXEN2p6Lg5CL9V8qEAxAPxl+t3t8cOfxD5PGoCElsQ8dmONEsAAL3U/R9ZH46k6ILUul3FzsDtFFvU1FwW5Q7/pQBWUDggAAMAABARAJ0BKjAAMAA+FQiDQSEGq1WqBABRLUATplhH4vL/MEqv9m+8HFplo5G9Lv8zbynzRdDv/TeaB1kvoAeWp+zPwjYfv4Y/gGizn626juItwczP/oead6as9FGOPcmI9Ljmjee5txLeQKUIaY/qJkMrsPQ0FLjaAW9GaCglJ+VhfJTh8htJ9R9zxszqqBmrwIAA/v9Cmb/5uANcFreUIV/8phr8ESOxIdmNcZ8Krf3aVm5h7XCnAzc5VkKZn/M8FVc++/NV4fZVTW5diKiYUzerL2ZSBrJCbN6WamAiSDSkfRDK74xp/Njf8cgjsdr/M+vkCgF7RVGNUwpFik2s3/PXvSL7n5MYyGBVC/+JRTMamw8j4BftS6t847V16f//wcS9WBg2bYEpVDgKd3R3JM4h7l/X+TDkP35a9TDKUpR77Sty8qpHgXlMk4qQAchsKR81n/lfsEkiV9apaKQ8ONNSl4KeRWfoW+aTYvv75yT3yEXzsspzF68m8rTbqTSP+sodqIO1UeMyhGuy9ztJOu15FfoyeIv+FZ/tugjg+a8ehhP9fOeBSGFvZhUZBDEP3vN32by90hgQkHO/H0XDinzzwp5b6CEv90vPgTmwfKLSMAfxWXu+9FaCp5r++lHsYKykGIECSU2GPEtzf5wtmW+fXwG/EMNC8FgT/Fm1jMJbvQqlmy3n3rXoGgsfzqSnnMDsjpWCKPplslUisCHh8QTECXTFunWcvqf5SAdg2OKpHNqiqBEMA3bB1njoh53zOgzNOKXuJsOIA8qKzbD9BnWmqHAhnFkN6FHpo3Us5Z3NBXxToyfuaPXYQ6hVnHNA9gIceB1exx1fM1bZY2Wlt602Kczu9KCXS1Qsga8cRsGhqQJdkpivXulf6kUjKhGzkGtms0viTaEhp37cDi3rFMiivKWQOeBbDXNFugGxRJJYWdgb1r0mAeAQPoIEzhod+MJSNr6J2LFNx377IaXIr/+RnDXxXC94Nt3rvpMI9pt8Hp1LWgWFglFkTVsPw/gAAA==" alt="WhatsApp" width={40} height={40} className={whatsappMenuOpen || pathname.startsWith('/whatsapp') ? "fill-[#08c47d]/20" : ""} />
                      {whatsappPendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                          {whatsappPendingCount}
                        </span>
                      )}
                      {/* {(whatsappMenuOpen || pathname.startsWith('/whatsapp')) && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" /> } */}
                    </div>
                    {/* <span className="text-[10px] font-medium">واتساب</span> */}
                  </button>

                  <Link 
                    href="/telegram" 
                    onClick={() => setWhatsappMenuOpen(false)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/telegram' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {/* <Send size={30} className={pathname === '/telegram' ? "fill-[#08c47d]/20" : ""} /> */}
                      <Image src="data:image/webp;base64,UklGRsQEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSP8AAAABgBsAbBpJx1BSRVvgNM+/y9EENADDFExz5FM9OsnJFUlPbURMAPw/I43uzvUQvZdttx6mKw3fpfb7oEiTX6E0xnmO4NmTVr0HW7GVtD6PWUkfJeEpbSF2lKSXuNlKEs+MniX5g0HWo/NyeivJcKpVRA5Y1hlKlgON8DuP94iqIZlWVV0uTdWOy1rlcnFUHhehQi74fTwuQuVycVQ7LhtVl0tTVedSUYXfeLyGVTDg0QPNInLAgg7MOYxBOyPoRE4P7unuwHRGNQLjyIZmHzWD9IFilwabsZm9URQs3ws74gbsZ6dohuMMkBb6b3pvvQKQh6utjeMhes66WQnD/xMAVlA4IJ4DAAAwFQCdASowADAAPhkIg0GhBxpIBABhLYATplCQIfXPMEpX8z+4/7T5Szxf4nfUB5gH6XdJbzAft9+oHsV+rP0AP3M6yz0FvLe9j39uP2G9mzRWfAH8A/EDv2/qv0gdRcfr4gLbpCAavf589gD+Q/0L/fdfL9mfYr/U1tIF3QvRyt3SwATvp1vRW1x38qrDbEd2lF2oH5VZ/FE5cKMjHE3K1S2fDAoAF08ZoN/bCuJQXelAAP79Cmb/HLDFhmaPM/4H8yj/n+3xhvdRrZNT/ZKuF/JYNMUECXT0ZBPZ79GA7kxDEZhKYKZCbXpDxnslKZjTGVVqhaYmerUqUwhxXnKa7oINqqLEF7Lylpb+JNb3xllvON2gPj9pPExJGJ54mnbOCfSFs6l/gtIGsdbQ1H2I1zPLsn/282OBiO6OmlHsWoPszz0YWScTfGhaDqv52v0j9dglratldg5duIW541LDWowYNopqUM4WBgJycb7w/D48L8I5tL9eCxNvSCwy/J1+h9d//lSrrBfy4l6IKhJu+o0Wfu0ckZcw0tAoOp2YZKnN5sBXoh7uc3zV+MD522aQgPBiFKzFToPlY/2Zn6f8vY3pyfnxN8avgpdMbpVvca7fe9qB1YAQNBN32YMNq0t+0xNfdk3ERRP8X+ZpwPAGKBu/MgDKV9Q6q4TLLwkbEedEFtjmsih2eDdpF7Yfvd8ex48fQQTib7YwYZ6hWTAYWpPaB+D/I3ZTlJtin9oi9zGW8xD6ZdCf+UPd/zJA9fvNMa/EXXmUYFo317GwKe2TNdQeTLzjclcXmLTMyhTWzCRsF/fBGWO0p8fseZ8xkG6w+YlR8zhRESODfpCIhp1N9h7bFP9fEkCKQvuFzeNqfSUpDvn6lSRdQfcIICry+5MY+fNRv3OEUCb1dmcd5yKdcNSS5dlCgWKc/79/qPoeGirkKyAynganpb/tuM3p/LYjUZeceCZNcT8ddN8SAqyBEh8qI2b5tPfQ5qiLNoNd4sLI0f2ysNN+H2zy8t3uZv1MJu/4NU/3Wk+3zqxElU9VCrWz3a65FI9fbp8Fkfglbirt63hinYdyzB1sm7nkS4WZy600j9vpvPcvP0yrPXtQiJ/PkWxCo/vn8j1ZJRiKhygAClJdlfRt6WHIH7kHXzEeg95VOkO5J1Mm1dl1DYv0gLGR6z++fTANRo+JvAp/gZSeYrQa+/qQJvFbiwwVobPo6XT2UFiQsT/dkAAAAA==" alt="Telegram" width={40} height={40} className={pathname === '/telegram' ? "fill-[#08c47d]/20" : ""} />
                      {pathname === '/telegram' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" />}
                    </div>
                    {/* <span className="text-[10px] font-medium">تليجرام</span> */}
                  </Link>

                  <Link 
                    href="/tickets" 
                    onClick={() => setWhatsappMenuOpen(false)}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/tickets' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      <div className="relative">
                        <div className="relative">
                            {/* <MessageSquare size={30} className={pathname === '/tickets' ? "fill-[#08c47d]/20" : ""} /> */}
                           <Image src="data:image/webp;base64,UklGRrwEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSCgBAAABgGttm2nnP1YZuzLag1xDOusi7M52Z9usnFZ3YNvOzppoZvb8URsREwD/T1VI9uTmrSTdbkxm2VTiPMvOCPNpqYcYh2aJcEuNDgLib4isN7FyaVuJ7M0aWUxzROCsSQbNDBG6qONrJYKbuOKJ8FgOu2txNw5szQRhPZOHhEHyYiklKEsZlCc4TlW0EILURsvGkk2bwjJF28SyQbvBckt7wfJKe0Z3juWWto5lgzaMZYqWgiWLZsVipSkOcJyqaFCIoxQYXZ4xSF4sUIuhHpjDEFzbsfUhiAb2C3H1wO5HhE+rOdKEzRiBc1VUvQY4DS9irqOA2498uZvqXf3C91JnB/yqJUIeO4MBANxz9tlOit1BVkNcqBaoCnPC0NrZ88vN+kSGWQn/T1ZQOCBuAwAA0BIAnQEqMAAwAD4VBoJBIQePPgQAUS2AFiPQjnaRFRn6B99P2cypUZPxQOln5oP2N6pO8o+hB5cX65fBph1XhT+q/gB4B/0vn7fQWQEz1/n84i8oD1J9Cbzn/z/cH/jX8z/2XA4frk6SBdP1jmQiW1LWJVrWavMjzRKVhjzC4gyyh540ldmaneOcDISI/qC9k3/7kK7Z/+ipSs3vQEAAAP792Fz/a0g//6PkA9mff8KEzi/Mj90HjpTF2dooK4faaMfg/+DEWOALq7U3x/XOTR9WQ3yO/P6Ut6Ina9+3/5qdO1uSg9VBrpBiSr/F/jOGBNoerdyd+lHdjIwBqEWrV7DvGDe7Tdj83Vk5Tj7kujBc8JgntPsv/KD5/Fsmn1kh7SQZJ83y5KAsL2B0D/73h03c9dHnosjcxUgdh9EhASPi4h137netnP7RjM39bw63COPZPsRQde5Ib+FFph9X9n3ZozFonhHfOiu6DqW/098cl/xZ3JFZfBoIZJDi+QE4joAyhGJavSMO/3uIJ6vTbIJ85GHoFFtT7YforAaBmNtHN08dGaqmqJO+OblJhclHDBwNThBR/0O23xGsotsZxlyabqYvlIeRO9z/iOrh8h7nixqbSouT/P/XD1Ek+DCv+ltbXLRGYL/q5X0AbPNAiy70W/i7f/HN5IVZhpTHX0f5R+6N3Q/8zZi/LH83HDzT1HzU+pbs8AwdbJx6j/wYNAx6kz4aEeXPtc2PpzCYgogv8RRKTtA8fZGqZ1HdslCPImVvHH2m8Fl7CxjeiH/9nyIGQv1UGtwhiJdxVM9H1/FVxnWYF0bQowlZ0oUIzgq98EUeJu7V0He07vvCrg5wOJS6rWXU1A72hqtSE9UPut/PqdLkSVDJS3UPdIhanxYms/Gw779QqWkTKWJZOQ1ahyeuD1il4Rsxnt4/bE46Zr7XqPg58YcZ86MfmL/I8n6cEMRRqXP/Ozz1FWXLMcyw2sT0oHHz5g8u80k9y5izhXd71now3vOusB5gK7zOkfGE+WMWW57NnGpT496e8SlqoipCfDv6n452YrbcLidSOmzAhzRBjJ43QG/XJrqfRrn4qVIEzQhbqj+H1K3w5UbmVCnLIS2D1b8p/P+NgoX/+5AijOxjHG1tSk/0tor59X4sX9LaK+fySqFaUBI0oAA=" alt="Tickets" width={40} height={40} className={pathname === '/tickets' ? "fill-[#08c47d]/20" : ""} />
                            {pendingTicketsCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                                {pendingTicketsCount}
                              </span>
                            )}
                        </div>
                      </div>
                      {pathname === '/tickets' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" />}
                    </div>
                    {/* <span className="text-[10px] font-medium">لايف شات</span> */}
                  </Link>

                  <button 
                    onClick={() => { signOut(); router.push('/sign-in'); }}
                    className="flex flex-col items-center justify-center gap-1 w-14 h-full text-red-500 hover:text-red-400 transition-colors"
                  >
                    {/* <LogOut size={30} /> */}
                    <Image src="data:image/webp;base64,UklGRlIDAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSIgAAAABcFtr25P8hiprz18bt0k1I9imxaiNMzCG2Q8Or9mXjF1ETIBKlXorIMquRdM3kEWztqCvWcITFnz8g5X3zjxYJgC7EaQJALjj4HjeC2AVg/LluR80SNSd+wGziiogzemLO1A/+qFMAHZDBai0dxbqd1/I/xfhCWvHW7JawroZLKVXwpCloVIlVlA4IKQCAAAQEQCdASowADAAPhkMhUGhBHEABABhLYAQJUgX27zJ7I/ZPuTxcxeusiMB/VfUx/tO6A/W79QOEA/tfURc+R7NH7C/sZ7QGaAdMfkpD8j8BmTaMA9mvzd4AH+j5p3zX/t/cI/hv9C/2PAAILi2rjwJqZizwpQRHnpVgc8Jd8VWEYkycP8LINCeqiSwZ6z8wj2AAP7/+hTN//1DRlu3R64BvCXdTxD2nvSQEOPr28LbMPeDx8sMFq73pft19MaoIuj//hRxyL+jwh/XkZzejRLRzuhAFI+V1qDTe6ThISf/+MTujv6O2pf4AQhv00iYL4TAd5t85/zRlQe8CHzzEttDr4+in9H//EGdA8/7RNylOR7qhwTh1sbPogyRi6IfsQ9HFK/mvUzlcl2ilvcwoeg39//0P3PzmPnu9zZL5ZRS9vjv1wVgF118OPjl9/DsX/edu/PxwcVXm6X9uH/N8lVIyxy2jkyYtKQlz9nsVnDjfyjLN2n95+3mHpVdGgxT+h2jhZ4Kk8tU4DKLw4vMiuaSA9QTt9Jnd05aAXU99ebP/+eNi/31v99nx42K7tJhyvWgX/DX9eqeK9MsYDes0LbdCcxsG0GABiN5uBPAhWHG/iPVScvpsIzkc9OP301W+EwpZ/ts/gdBk5sR987FqKJ/9D/78VVcV1gcKw/T6/7Ud8ctxXuJ2TisfvhVjdTzvniIdyj8h4e3jxrOv4ih3wmO/xhv3Z87s6hyXg2n715crlF+QOKv8LPhY5CY/NTPIiem9lCFnOx6Djd9/Hj/uui/Aobcl6QIJWixWR3nZWS2YqgOuX7OlHgn+/VMyvuTif/0mC5ORK/b+xDRllRoKjo9/uypBUdM7IoWrsNMwttxcv7XvY/FC4Kl0RVnRKJbza9qSoAA" alt="Logout" width={40} height={40} />
                    {/* <span className="text-[10px] font-medium">خروج</span> */}
                  </button>
                </div>
            </div>
        </div>
        </div>
      </div>
      
      {/* Global Tooltip */}
      {showTooltip && (
        <div
          className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap z-[9999] border border-gray-700 pointer-events-none"
          style={{
            right: `calc(100vw - ${tooltipPosition.x}px)`,
            top: tooltipPosition.y,
            transform: 'translateY(-50%)'
          }}
        >
          {tooltipContent}
          <div 
            className="absolute top-1/2 left-full transform -translate-y-1/2 border-[6px] border-transparent border-r-gray-900"
          ></div>
        </div>
      )}
      </div>
    </div>
    
  <Script >
      {`window.WIDGET_API_URL = 'https://api.flooxira.com';
      window.WIDGET_SOCKET_URL = 'https://api.flooxira.com';`}
    </Script>
    <Script  src="https://api.flooxira.com/widget.js" data-store-id="728a0211-a7ae-4279-b045-39dc52e8599b"></Script>
     {/* <Script >
      {`window.WIDGET_API_URL = 'http://localhost:4000';
      window.WIDGET_SOCKET_URL = 'http://localhost:4000';`}
    </Script>
    <Script  src="http://localhost:4000/widget.js" data-store-id="9b78752d-4935-4a05-bc10-f283a3602c4b"></Script>  */}
    </AuthGuard>
  );
}



"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { getPostUsageStats, getMySubscription } from "@/lib/api";
import { getAllNewsTickers, type NewsTicker } from "@/lib/settingsApi";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import RippleGrid from '@/components/RippleGrid';
import { X, Megaphone, Menu, Home, MessageCircle, Send, LogOut, MessageSquare, Link as LinkIcon, Users as UsersIcon, Settings as SettingsIcon, Bot, LayoutGrid, TagIcon, ChartNoAxesColumn } from "lucide-react";



const navItems = [
  { href: "/dashboard", label: " الرئيسية", img: "/home.png" },
  { href: "/ask-ai", label: "  اسأل Ai", img: "/ai.png" },
  { href: "/tickets", label: "لايف شات", img: "/live.png" },
  { href: "/whatsapp", label: "إدارة واتساب", img: "/whats.png" },
  { href: "/telegram", label: "إدارة تليجرام", img: "/tele.png" },
  { href: "/create-post", label: "إنشاء منشور", img:"/plus.png" },
  { href: "/content", label: "ادارة المحتوى", img: "/folder.png" },
  { href: "/services", label: " خدمات التجار  ", img: "/rocket.png" },
  { href: "/salla", label: "  الربط مع سلة", img: "/salla.png" },
  { href: "/schedule", label: "المحتوى المجدول", img: "/hour-2.png" },
  { href: "/customers", label: "  العملاء والمحاسبة", img: "/customers.png" },
  { href: "/settings", label: "إدارة الحسابات", img: "/share.png" },
  { href: "/employees", label: "إدارة الموظفين", img: "/employee.png" },
  { href: "/plans", label: "باقات الاشتراك", img: "/crown.png" },
  { href: "/my-subscription", label: "الاشتراك الفعال", img: "/true.png" },
  // { href: "/my-subscription-requests", label: "طلبات الاشتراك", img: "/order.png" },
  { href: "/tutorials", label: "شروحات المنصة", img: "/video.png" },
  { href: "/reviews", label: "تقييمات المنصة", img: "/review.png" },
  { href: "/my-review", label: "قيمنا", img: "/review.png" },
  // { href: "/billing", label: "الفواتير" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { permissions } = usePermissions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [planName, setPlanName] = useState<string>("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ daysRemaining: number | null, colorClass: string }>({ daysRemaining: null, colorClass: '' });
  const [newsBarClosed, setNewsBarClosed] = useState(false);
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);
  const [newsItems, setNewsItems] = useState<NewsTicker[]>([]);

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

  // تحديد العناصر المتاحة حسب نوع المستخدم
  const visibleNavItems = useMemo(() => {
    
    
    // التحقق من أن البيانات محملة
    if (!user) {
      return navItems;
    }
    
    // إذا كان موظف (role === 'employee')
    if (user.role === 'employee') {
      console.log('[Sidebar] User is EMPLOYEE, filtering nav items');
      return navItems.filter(item => {
        // إخفاء العناصر الإدارية
        if (item.href === '/employees' || 
            item.href === '/plans' || 
            item.href === '/my-subscription' ||
            item.href === '/my-subscription-requests' ||
            item.href === '/settings') {
        
          return false;
        }
        
        // إظهار العناصر حسب الصلاحيات
        if (item.href === '/ask-ai' && !permissions?.canUseAI) return false;
        if (item.href === '/whatsapp' && !permissions?.canManageWhatsApp) return false;
        if (item.href === '/telegram' && !permissions?.canManageTelegram) return false;
        if (item.href === '/customers' && !permissions?.canManageCustomers) return false;
        if (item.href === '/content' && !permissions?.canManageContent) return false;
        if (item.href === '/services' && !permissions?.canMarketServices) return false;
        if (item.href === '/salla' && !permissions?.canSallaIntegration) return false;
        
        return true;
      });
    }
    
    console.log('[Sidebar] User is OWNER, showing all items');
    // المالك يرى كل شيء
    return navItems;
  }, [user, permissions]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
            setPlanName(subRes.subscription.plan.name || 'غير محدد');
            
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
          setPlanName(res.data.planName || 'غير محدد');
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

  // Load pending tickets count
  useEffect(() => {
    const loadPendingTicketsCount = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/tickets/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPendingTicketsCount(data.stats?.pending || 0);
        }
      } catch (error) {
        console.error('Failed to load pending tickets count:', error);
      }
    };

    if (user && !loading) {
      loadPendingTicketsCount();
      
      // Refresh count every 30 seconds
      const interval = setInterval(loadPendingTicketsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  return (
    <AuthGuard>
    <div className="flex  h-screen overflow-hidden">
  
      {/* Mobile sidebar + overlay */}
      <div className={clsx("fixed inset-0 z-40 md:hidden", sidebarOpen ? "block" : "hidden")}> 
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative bg-secondry z-50 h-full w-72  border-r border-[#08c47d50] text-white  shadow-xl flex flex-col">
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-600">
            <div className="w-full ">
              <Image src="/Logo.gif" alt="logo" width={150} height={100} />
            </div>
            <button
              className="inline-flex h-9 w-9  cursor-pointer items-center justify-center rounded-md  "
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
                </div>
              </Link>
            ))}
            {user?.role === 'admin' && (
              <div className="pt-3">
                <Link
                  href="/admin"
                  className={clsx(
                    "block rounded-md px-3 py-2 text-sm ",
                    pathname.startsWith('/admin') ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                  )}
                >
                  إدارة المنصة
                </Link>
              </div>
            )}
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
          {/* User info at bottom */}
          <div className="border-t border-gray-600 p-4">
            <Link href="/profile" className="block mb-3 hover:bg-light-custom/50 rounded-lg p-2 transition-colors">
              <div className="text-sm flex items-center gap-2">
                <img 
                  src={!loading && user ? (user.avatar || (typeof window !== 'undefined' ? localStorage.getItem(`user_avatar_${user.id}`) : null) || "/user.gif") : "/user.gif"} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover cursor-pointer" 
                />
                <div className="flex flex-col">
                  {!loading && user && <span className="font-medium cursor-pointer">{user.name || user.email}</span>}
                  {planName && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-primary"> {planName}</span>
                      {subscriptionStatus.daysRemaining !== null && (
                        <span className={`text-[10px] font-bold ${subscriptionStatus.colorClass} border border-current rounded px-1`}>
                          {subscriptionStatus.daysRemaining}D
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
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
      <aside className="hidden  md:flex w-[240px] h-screen bg- border-l  border-gray-600 text-white flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-1 w-full flex justify-center">
          <Image src="/Logo.gif" alt="logo" width={180} height={110} />
        </div>
        <div className="border-t border-gray-600 px-2 py-0 flex-shrink-0 w-full">
          <Link href="/profile" className="flex items-center justify-between hover:bg-light-custom/50 rounded-lg p-2 transition-colors">
            <div className="text-sm flex items-center gap-2">
              <img 
                src={!loading && user ? (user.avatar || (typeof window !== 'undefined' ? localStorage.getItem(`user_avatar_${user.id}`) : null) || "/user.gif") : "/user.gif"} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover cursor-pointer" 
              />
              <div className="flex items-center gap-2  ">
                {!loading && user && <span className="font-medium text-xs cursor-pointer">{user.name }</span>}
                {planName && (
                  <div className="flex flex-col items-start ml-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-primary gradient-border text-center p-1">{planName} {subscriptionStatus.daysRemaining !== null && (
                        <span className={`text-[9px] font-bold ${subscriptionStatus.colorClass}  `}>
                          {subscriptionStatus.daysRemaining}D
                        </span>
                      )} </span>
                    </div>
                  
                  </div>
                )}
              </div>
            </div>
           
          </Link>
            <div className="flex justify-start mx-5">
              {(subscriptionStatus.colorClass.includes('yellow') || subscriptionStatus.colorClass.includes('red')) && (
                      <Link href="/plans" className="text-xs bg-primary/20 hover:bg-primary/40 text-primary px-2 py-0.5 rounded mt-1 transition-colors">
                        تجديد الاشتراك
                      </Link>
                    )}
            </div>
        </div>
        <nav className="px-2 py-2 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2  ",
                pathname === item.href ? "bg-light-custom text-white text-lg gradient-border" : "hover:bg-light-custom text-sm"
              )}
            >
              <img src={item.img} className="w-5 h-5" alt="" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/tickets" && pendingTicketsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingTicketsCount}
                </span>
              )}
            </Link>
          ))}
          {!loading && user && (
              <Button 
                size="sm" 
                
                onClick={() => { signOut(); router.push('/sign-in'); }}
                className="w-full primary-button after:bg-red-500 text-white "
              >
                تسجيل خروج
              </Button>
            )}
          {user?.role === 'admin' && (
            <div className="pt-3">
              <Link
                href="/admin"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname.startsWith('/admin') ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                )}
              >
             ادارة المنصة
              </Link>
            </div>
          )}
          {/* <div className="pt-3">
            <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Legal</div>
            <Link
              href="/privacy-policy"
              className={clsx(
                "block rounded-md px-3 py-2 text-sm ",
                pathname === '/privacy-policy' ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
              )}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className={clsx(
                "block rounded-md px-3 py-2 text-sm ",
                pathname === '/terms' ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
              )}
            >
              Terms of Service
            </Link>
          </div> */}
        </nav>
        {/* User info at bottom */}
        {/* <div className="border-t border-gray-600 p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm ">
              {!loading && user && <span className="font-medium">{user.name || user.email}</span>}
            </div>
            {!loading && user && (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => { signOut(); router.push('/sign-in'); }}
                className="bg-red-600 text-white "
              >
                Logout
              </Button>
            )}
          </div>
        </div> */}
          
      </aside>
      {/* Content area - independent scrolling */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-0 left-4 z-30">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md "
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="text-primary" size={24}/>
          </button>
        </div>
        
        {/* News Bar - Fixed at top */}
        {!newsBarClosed && (
          <div className="w-full bg-card text-white px-4 py-2 shadow-lg z-20 flex items-center justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Megaphone className="w-5 h-5 flex-shrink-0 animate-pulse text-yellow-200" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden relative">
              <div 
                className="whitespace-nowrap"
                style={{
                  animation: 'scroll-text 30s linear infinite',
                  display: 'inline-block',
                  willChange: 'transform'
                }}
              >
                {newsItems.length > 0 ? (
                  <>
                    {newsItems.map((item, index) => (
                      <span key={`news-${item.id}-${index}`} className="text-sm font-semibold inline-block mr-12">
                        {item.content}
                      </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {newsItems.map((item, index) => (
                      <span key={`news-dup-${item.id}-${index}`} className="text-sm font-semibold inline-block mr-12">
                        {item.content}
                      </span>
                    ))}
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold inline-block mr-12">
                      مرحباً بك في منصة Flooxira - ابدأ الآن في إدارة حساباتك الاجتماعية بسهولة
                    </span>
                    <span className="text-sm font-semibold inline-block mr-12">
                      • احصل على أفضل تجربة إدارة لوسائل التواصل الاجتماعي
                    </span>
                    <span className="text-sm font-semibold inline-block mr-12">
                      • أنشئ ونشر المحتوى بسهولة • إدارة العملاء والمواعيد بكفاءة
                    </span>
                    {/* Duplicate for seamless loop */}
                    <span className="text-sm font-semibold inline-block mr-12">
                      مرحباً بك في منصة Flooxira - ابدأ الآن في إدارة حساباتك الاجتماعية بسهولة
                    </span>
                    <span className="text-sm font-semibold inline-block mr-12">
                      • احصل على أفضل تجربة إدارة لوسائل التواصل الاجتماعي
                    </span>
                    <span className="text-sm font-semibold inline-block mr-12">
                      • أنشئ ونشر المحتوى بسهولة • إدارة العملاء والمواعيد بكفاءة
                    </span>
                  </>
                )}
              </div>
            </div>
            {/* <button
              onClick={() => setNewsBarClosed(true)}
              className=" cursor-pointer  rounded-full p-1.5 transition-colors active:scale-95 "
              aria-label="إغلاق الشريط الإخباري"
            >
              <X className="w-4 h-4 text-red-400" />
            </button> */}
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-3 pb-24 md:pb-3">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* WhatsApp Popup Menu */}
            <div className={clsx(
              "absolute bottom-full left-0 right-0 bg-[#0f111a]/95 rounded-t-[30px] backdrop-blur-lg  transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.3)]",
              whatsappMenuOpen ? "max-h-[400px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
            )}>
              <div className="grid grid-cols-3 gap-4 px-4">
                 {[
                   { name: "الاتصال", href: "/whatsapp/connection", icon: <LinkIcon size={20} /> },
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
            <div className="bg-fixed-40 backdrop-blur-lg inner-shadow pb-safe rounded-t-[30px] nav-shine-effect">
                <div className="flex justify-around items-center h-16 px-2">
                  <Link 
                    href="/dashboard" 
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/dashboard' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {/* <Home size={22} className={pathname === '/dashboard' ? "fill-[#08c47d]/20" : ""} /> */}
                    <Image src="/home-mobile.png" alt="Home" width={40} height={40} className={pathname === '/dashboard' ? "fill-[#08c47d]/20" : ""} />
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
                      <Image src="/wts-mobile.png" alt="WhatsApp" width={40} height={40} className={whatsappMenuOpen || pathname.startsWith('/whatsapp') ? "fill-[#08c47d]/20" : ""} />
                      {/* {(whatsappMenuOpen || pathname.startsWith('/whatsapp')) && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" /> } */}
                    </div>
                    {/* <span className="text-[10px] font-medium">واتساب</span> */}
                  </button>

                  <Link 
                    href="/telegram" 
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/telegram' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      {/* <Send size={30} className={pathname === '/telegram' ? "fill-[#08c47d]/20" : ""} /> */}
                      <Image src="/tele-mobile.png" alt="Telegram" width={40} height={40} className={pathname === '/telegram' ? "fill-[#08c47d]/20" : ""} />
                      {pathname === '/telegram' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#08c47d] rounded-full" />}
                    </div>
                    {/* <span className="text-[10px] font-medium">تليجرام</span> */}
                  </Link>

                  <Link 
                    href="/tickets" 
                    className={clsx(
                      "flex flex-col items-center justify-center gap-1 w-14 h-full transition-colors",
                      pathname === '/tickets' ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="relative">
                      <div className="relative">
                        <div className="relative">
                            {/* <MessageSquare size={30} className={pathname === '/tickets' ? "fill-[#08c47d]/20" : ""} /> */}
                           <Image src="/live-mobile.png" alt="Tickets" width={40} height={40} className={pathname === '/tickets' ? "fill-[#08c47d]/20" : ""} />
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
                    <Image src="/logout-mobile.png" alt="Logout" width={40} height={40} />
                    {/* <span className="text-[10px] font-medium">خروج</span> */}
                  </button>
                </div>
            </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}



"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { getPostUsageStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import RippleGrid from '@/components/RippleGrid';
import { X, Megaphone, Menu } from "lucide-react";


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
  { href: "/my-subscription-requests", label: "طلبات الاشتراك", img: "/order.png" },
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
  const [planName, setPlanName] = useState<string>("");
  const [newsBarClosed, setNewsBarClosed] = useState(false);

  // تحديد العناصر المتاحة حسب نوع المستخدم
  const visibleNavItems = useMemo(() => {
    console.log('[Sidebar] User:', user);
    console.log('[Sidebar] User role:', user?.role);
    console.log('[Sidebar] Permissions:', permissions);
    
    // التحقق من أن البيانات محملة
    if (!user) {
      console.log('[Sidebar] User not loaded yet, showing all items');
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
        
        const res = await getPostUsageStats(token);
        if (res.success && res.data) {
          setPlanName(res.data.planName || 'غير محدد');
        }
      } catch (error) {
        console.error('Failed to load plan name:', error);
      }
    };

    if (user && !loading) {
      loadPlanName();
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
              <Image src="/Logo.png" alt="logo" width={150} height={100} />
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
                {item.label}
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
            <div className="flex items-center justify-between">
              <div className="text-sm flex flex-col">
                {!loading && user && <span className="font-medium">{user.name || user.email}</span>}
                {planName && (
                  <span className="text-xs text-primary mt-1"> {planName}</span>
                )}
              </div>
              {!loading && user && (
                <Button 
                  size="sm" 
                 
                  onClick={() => { signOut(); router.push('/sign-in'); }}
                  className="primary-button after:bg-red-500 text-white"
                >
                  تسجيل الخروج
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop sidebar - fixed position */}
      <aside className="hidden  md:flex w-[240px] h-screen bg- border-l  border-gray-600 text-white flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-1 w-full flex justify-center">
          <Image src="/Logo.png" alt="logo" width={180} height={110} />
        </div>
        <div className="border-t border-gray-600 p-2 flex-shrink-0 w-full">
          <div className="flex items-center justify-between">
            <div className="text-sm flex items-center gap-2">
              <img src="/user.gif" alt="" className="w-10 h-10 rounded-full" />
              <div className="flex items-center gap-2  ">
                {!loading && user && <span className="font-medium text-md">{user.name }</span>}
                {planName && (
                  <span className="text-xs text-primary gradient-border  p-1"> {planName}</span>
                )}
              </div>
            </div>
           
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
              {item.label}
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
        <div className="md:hidden fixed top-10 left-4 z-30">
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
              </div>
            </div>
            <button
              onClick={() => setNewsBarClosed(true)}
              className=" cursor-pointer  rounded-full p-1.5 transition-colors active:scale-95 "
              aria-label="إغلاق الشريط الإخباري"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-3">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}



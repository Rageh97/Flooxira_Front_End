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

const navItems = [
  { href: "/dashboard", label: " الرئيسية", img: "/home.png" },
  { href: "/whatsapp", label: "إدارة واتساب", img: "/whats.png" },
  { href: "/telegram", label: "إدارة تليجرام", img: "/tele.png" },
  { href: "/create-post", label: "إنشاء منشور", img:"/plus.png" },
  { href: "/content", label: "ادارة المحتوى", img: "/folder.png" },
  { href: "/salla", label: "  الربط مع سلة", img: "/salla.png" },
  { href: "/schedule", label: "المحتوى المجدول", img: "/hour-2.png" },
  { href: "/customers", label: " ادارة العملاء والمحاسبة", img: "/customers.png" },
  { href: "/settings", label: "إدارة الحسابات", img: "/share.png" },
  { href: "/services", label: " سوق لخدمتك", img: "/rocket.png" },
  { href: "/employees", label: "إدارة الموظفين", img: "/user.gif" },
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
        if (res.success) {
          setPlanName(res.data.planName);
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
    <div className="min-h-screen bg-gradient-custom ">
      {/* Mobile sidebar + overlay */}
      <div className={clsx("fixed inset-0 z-40 md:hidden", sidebarOpen ? "block" : "hidden")}> 
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative z-50 h-full w-72 bg-gradient-custom border-r border-[#08c47d50] text-white  shadow-xl flex flex-col">
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-600">
            <div className="w-full ">
              <Image src="/Flooxira Logoo.png.gif" alt="logo" width={100} height={100} />
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-semidark-custom "
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">إغلاق</span>
              ✕
            </button>
          </div>
          <nav className="px-2 py-2 space-y-1 overflow-y-auto flex-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname === item.href ? "bg-light-custom text-white" : "hover:bg-semidark-custom"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <div className="pt-3">
                <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">ادارة المنصة</div>
                <Link
                  href="/admin"
                  className={clsx(
                    "block rounded-md px-3 py-2 text-sm ",
                    pathname.startsWith('/admin') ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                  )}
                >
                  الصفحة الرئيسية للإدارة
                </Link>
              </div>
            )}
            <div className="pt-3">
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
            </div>
          </nav>
          {/* User info at bottom */}
          <div className="border-t border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm flex flex-col">
                {!loading && user && <span className="font-medium">{user.name || user.email}</span>}
                {planName && (
                  <span className="text-xs text-gray-400 mt-1">📦 {planName}</span>
                )}
              </div>
              {!loading && user && (
                <Button 
                  size="sm" 
                 
                  onClick={() => { signOut(); router.push('/sign-in'); }}
                  className="bg-red-200 text-white"
                >
                  تسجيل الخروج
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop fixed sidebar */}
      <aside className="hidden overflow-y-auto scrollbar-hide md:block fixed inset-y-0 right-0 z-20 w-[240px]  bg-secondry  border-r border-[#08c47d50] text-white flex flex-col">
        <div className="px-4 py-4 w-full ">
          <Image src="/Flooxira Logoo.png.gif" alt="logo" width={200} height={150} />
        </div>
        <div className="border-t border-gray-600 p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm flex items-center gap-2">
              <img src="/user.gif" alt="" className="w-10 h-10 rounded-full" />
              <div className="flex items-center flex-col">
                {!loading && user && <span className="font-medium">{user.name }</span>}
                {planName && (
                  <span className="text-xs text-yellow-400"> {planName}</span>
                )}
              </div>
            </div>
           
          </div>
        </div>
        <nav className="px-2 py-2 space-y-1 flex-1 ">
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
                className="w-full text-white bg-red-900/50 inner-shadow "
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
      {/* Content area with left padding to account for fixed sidebar on md+ */}
      <div className="flex flex-col min-h-screen md:pr-[240px]">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-30">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-dark-custom hover:bg-semidark-custom  border border-gray-600"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">فتح الشريط الجانبي</span>
            ☰
          </button>
        </div>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}



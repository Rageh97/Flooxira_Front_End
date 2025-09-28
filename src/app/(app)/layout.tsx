"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plans", label: "Plans" },
  { href: "/create-post", label: "Create Post" },
  { href: "/schedule", label: "Schedules" },
  { href: "/whatsapp", label: "WhatsApp Bot" },
  { href: "/telegram", label: "Telegram Bot" },
  { href: "/salla", label: "Salla Store" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Accounts Management" },
  { href: "/billing", label: "Billing" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
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
              <Image src="/Flooxira Logo.png" alt="logo" width={100} height={100} />
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-semidark-custom "
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
          <nav className="px-2 py-2 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => (
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
                <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Admin</div>
                <Link
                  href="/admin"
                  className={clsx(
                    "block rounded-md px-3 py-2 text-sm ",
                    pathname.startsWith('/admin') ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                  )}
                >
                  Admin Home
                </Link>
              </div>
            )}
            <div className="pt-3">
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
            </div>
          </nav>
          {/* User info at bottom */}
          <div className="border-t border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm ">
                {!loading && user && <span className="font-medium">{user.name || user.email}</span>}
              </div>
              {!loading && user && (
                <Button 
                  size="sm" 
                 
                  onClick={() => { signOut(); router.push('/sign-in'); }}
                  className="bg-red-200 text-white"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block fixed inset-y-0 right-0 z-20 w-[240px]  bg-gradient-custom  border-r border-[#08c47d50] text-white flex flex-col">
        <div className="px-4 py-4 w-full ">
          <Image src="/Flooxira Logo.png" alt="logo" width={150} height={100} />
        </div>
        <nav className="px-2 py-2 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block rounded-md px-3 py-2 text-sm ",
                pathname === item.href ? "bg-light-custom text-white" : "hover:bg-light-custom"
              )}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <div className="pt-3">
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Admin</div>
              <Link
                href="/admin"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm ",
                  pathname.startsWith('/admin') ? "bg-semidark-custom text-white" : "hover:bg-semidark-custom"
                )}
              >
                Admin Home
              </Link>
            </div>
          )}
          <div className="pt-3">
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
          </div>
        </nav>
        {/* User info at bottom */}
        <div className="border-t border-gray-600 p-2">
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
        </div>
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
            <span className="sr-only">Open sidebar</span>
            ☰
          </button>
        </div>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}



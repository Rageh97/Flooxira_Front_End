"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plans", label: "Plans" },
  { href: "/create-post", label: "Create Post" },
  { href: "/schedule", label: "Schedules" },
  { href: "/whatsapp", label: "WhatsApp Bot" },
  { href: "/pinterest", label: "Pinterest" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile sidebar + overlay */}
      <div className={clsx("fixed inset-0 z-40 md:hidden", sidebarOpen ? "block" : "hidden")}> 
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <aside className="relative z-50 h-full w-72 bg-white border-r border-gray-200 shadow-xl">
          <div className="px-4 py-4 flex items-center justify-between border-b">
            <div className="text-lg font-semibold">Social Manage</div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
          <nav className="px-2 py-2 space-y-1 overflow-y-auto h-[calc(100%-56px)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === item.href ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <div className="pt-3">
                <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Admin</div>
                <Link
                  href="/admin"
                  className={clsx(
                    "block rounded-md px-3 py-2 text-sm",
                    pathname.startsWith('/admin') ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                  )}
                >
                  Admin Home
                </Link>
              </div>
            )}
            <div className="pt-3">
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Legal</div>
              <Link
                href="/privacy-policy"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === '/privacy-policy' ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                )}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === '/terms' ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                )}
              >
                Terms of Service
              </Link>
            </div>
          </nav>
        </aside>
      </div>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-20 w-[240px] border-r border-gray-200 bg-white">
        <div className="px-4 py-4 text-lg font-semibold">Social Manage</div>
        <nav className="px-2 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block rounded-md px-3 py-2 text-sm",
                pathname === item.href ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <div className="pt-3">
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Admin</div>
              <Link
                href="/admin"
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname.startsWith('/admin') ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                )}
              >
                Admin Home
              </Link>
            </div>
          )}
          <div className="pt-3">
            <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Legal</div>
            <Link
              href="/privacy-policy"
              className={clsx(
                "block rounded-md px-3 py-2 text-sm",
                pathname === '/privacy-policy' ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              )}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className={clsx(
                "block rounded-md px-3 py-2 text-sm",
                pathname === '/terms' ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              )}
            >
              Terms of Service
            </Link>
          </div>
        </nav>
      </aside>
      {/* Content area with left padding to account for fixed sidebar on md+ */}
      <div className="flex flex-col min-h-screen md:pl-[240px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              ☰
            </button>
          <div className="md:hidden font-semibold">Social Manage</div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            {!loading && user && <span className="font-medium hidden sm:inline">{user.name || user.email}</span>}
            {!loading && user && (
              <Button size="sm" variant="secondary" onClick={() => { signOut(); router.push('/sign-in'); }}>
                Logout
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}



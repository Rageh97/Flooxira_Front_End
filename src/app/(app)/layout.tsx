"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create-post", label: "Create Post" },
  { href: "/schedule", label: "Schedule" },
  { href: "/whatsapp", label: "WhatsApp Bot" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-gray-50 text-gray-900">
      <aside className="hidden md:block border-r border-gray-200 bg-white">
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
        </nav>
      </aside>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="md:hidden font-semibold">Social Manage</div>
          <div className="text-sm text-gray-500">MVP</div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}



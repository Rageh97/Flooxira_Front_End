"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const telegramTabs = [
  { href: "/telegram", label: "🤖 Connection", exact: true },
  { href: "/telegram/chat-management", label: "👥 Chat Management" },
  { href: "/telegram/admin-tools", label: "⚙️ Admin Tools" },
  { href: "/telegram/groups", label: "🏢 Groups" },
  { href: "/telegram/chats", label: "💬 Chat History" },
  { href: "/telegram/campaigns", label: "📣 Campaigns" },
  { href: "/telegram/tags", label: "🏷️ Tags" },
  { href: "/telegram-templates", label: "📝 Templates" },
];

export default function TelegramLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">📱 Telegram Management</h1>
        <p className="text-gray-300">إدارة البوتات والقوالب التفاعلية للتيليجرام</p>
      </div>

      {/* Telegram Tabs */}
      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        <div className="flex flex-wrap gap-3">
          {telegramTabs.map((tab) => {
            const isActive = tab.exact 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href);
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-300 hover:text-white hover:bg-gray-700 hover:transform hover:scale-105"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}



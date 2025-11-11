"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const telegramTabs = [
  { href: "/telegram", label: "الاتصال", exact: true },
  // { href: "/telegram/chat-management", label: "إدارة المحادثات" },
  // { href: "/telegram/admin-tools", label: "أدوات الإدارة" },
  // { href: "/telegram/groups", label: "المجموعات" },
  { href: "/telegram/chats", label: "سجل المحادثات" },
  { href: "/telegram/campaigns", label: "الحملات" },
  // { href: "/telegram/tags", label: "العلامات" },
  { href: "/telegram-templates", label: "القوالب" },
];

export default function TelegramLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">إدارة التليجرام</h1>
        <p className="text-gray-300">إدارة البوتات والقوالب التفاعلية للتيليجرام</p>
      </div> */}

      {/* Telegram Tabs */}
      <div className="bg-secondry inner-shadow rounded-lg p-2">
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
                    ? "gradient-border text-white"
                    : "text-gray-300 hover:text-white hover:bg-blue-500 hover:transform hover:scale-105"
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



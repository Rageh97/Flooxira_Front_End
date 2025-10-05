"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const telegramTabs = [
  { href: "/telegram", label: "Bot Settings", exact: true },
  { href: "/telegram-templates", label: "Templates", exact: true },
];

export default function TelegramTemplatesLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Telegram Tabs */}
      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {telegramTabs.map((tab) => {
            const isActive = tab.exact 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href);
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-light-custom text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
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

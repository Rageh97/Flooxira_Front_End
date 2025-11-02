"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

const telegramTabs = [
  { href: "/telegram", label: "ادارة البوت", exact: true },
  { href: "/telegram-templates", label: "ادارة القوالب", exact: true },
];

export default function TelegramTemplatesLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Telegram Tabs */}
      <div className="bg-secondry inner-shadow rounded-lg p-4">
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
                    ? "gradient-border text-white"
                    : "text-gray-300 "
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

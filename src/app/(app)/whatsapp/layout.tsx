"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const tabs = [
    { id: 'connection', name: 'Connection', path: '/whatsapp/connection', icon: '🔗' },
    { id: 'bot', name: 'Bot Settings', path: '/whatsapp/bot', icon: '🤖' },
    { id: 'chats', name: 'Chat History', path: '/whatsapp/chats', icon: '💬' },
    { id: 'stats', name: 'Statistics', path: '/whatsapp/stats', icon: '📊' },
    { id: 'groups', name: 'Groups', path: '/whatsapp/groups', icon: '👥' },
    { id: 'campaigns', name: 'Campaigns', path: '/whatsapp/campaigns', icon: '📢' },
    { id: 'admin', name: 'Admin', path: '/whatsapp/admin', icon: '⚙️' },
  ];

  const getActiveTab = () => {
    if (pathname === '/whatsapp') return 'connection';
    return tabs.find(tab => pathname === tab.path)?.id || 'connection';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">WhatsApp Bot Management</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = getActiveTab() === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
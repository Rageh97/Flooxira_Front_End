"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const PlansAdmin = dynamic(() => import("./plans/page"), { ssr: false });

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState<'plans'>('plans');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm text-gray-600">Administrative tools and settings.</p>
      <div className="pt-2">
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeTab === 'plans' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('plans')}
          >
            Plans
          </button>
        </div>
        {activeTab === 'plans' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">Manage Plans</h2>
            <PlansAdmin />
          </div>
        )}
      </div>
    </div>
  );
}



"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const PlansAdmin = dynamic(() => import("./plans/page"), { ssr: false });
const UsersAdmin = dynamic(() => import("./users/page"), { ssr: false });
const AnalyticsAdmin = dynamic(() => import("./analytics/page"), { ssr: false });

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'analytics'>('users');
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-gray-600">Administrative tools and settings.</p>
      
      <div className="pt-2">
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeTab === 'users' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeTab === 'plans' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('plans')}
          >
            Plans
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm ${activeTab === 'analytics' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
        
        {activeTab === 'users' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">User Management</h2>
            <UsersAdmin />
          </div>
        )}
        
        {activeTab === 'plans' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">Plan Management</h2>
            <PlansAdmin />
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">System Analytics</h2>
            <AnalyticsAdmin />
          </div>
        )}
      </div>
    </div>
  );
}



"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLinkedInAccount, testLinkedIn, disconnectLinkedIn, startLinkedInOAuth } from "@/lib/api";
import LinkedInPosts from "./components/LinkedInPosts";
import LinkedInAnalytics from "./components/LinkedInAnalytics";
import LinkedInCompanies from "./components/LinkedInCompanies";

export default function LinkedInPage() {
  const [account, setAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'companies'>('posts');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    if (!token) return;
    try {
      const res = await getLinkedInAccount(token);
      setAccount(res.connected ? res.account : null);
      if (res.connected) {
        setMessage(`Connected as: ${res.account.name || 'LinkedIn User'}`);
      }
    } catch {}
  }

  async function handleTest() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const res = await testLinkedIn(token);
    setMessage(res.message + (res.user ? `: ${res.user}` : ''));
  }

  async function handleDisconnect() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    await disconnectLinkedIn(token);
    setAccount(null);
    setMessage('Disconnected LinkedIn');
  }

  const tabs = [
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'companies', label: 'Companies', icon: '🏢' }
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">LinkedIn Management</h1>
      
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Connection</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Not connected</p>
              <Button 
                onClick={() => startLinkedInOAuth()} 
                disabled={loading} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Connect LinkedIn
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{account.name || 'LinkedIn User'}</p>
                  {account.email && <p className="text-sm text-green-700">Email: {account.email}</p>}
                  {account.linkedinUserId && <p className="text-sm text-green-700">LinkedIn ID: {account.linkedinUserId}</p>}
                  {account.scope && <p className="text-xs text-green-700 break-all">Scopes: {account.scope}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleTest}>Test</Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleDisconnect} 
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {account && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posts' && <LinkedInPosts onMessage={setMessage} />}
            {activeTab === 'analytics' && <LinkedInAnalytics onMessage={setMessage} />}
            {activeTab === 'companies' && <LinkedInCompanies onMessage={setMessage} />}
          </div>
        </>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Failed') || message.includes('Error') 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}









"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSallaAccount, testSalla, disconnectSalla, startSallaOAuth, getSallaStore } from "@/lib/api";
import SallaProducts from "./components/SallaProducts";
import SallaOrders from "./components/SallaOrders";
import SallaCustomers from "./components/SallaCustomers";
import SallaCategories from "./components/SallaCategories";
import SallaBrands from "./components/SallaBrands";
import SallaBranches from "./components/SallaBranches";
import SallaPayments from "./components/SallaPayments";
import SallaSettings from "./components/SallaSettings";
import SallaReviewsQuestions from "./components/SallaReviewsQuestions";

export default function SallaPage() {
  const [account, setAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'categories' | 'brands' | 'branches' | 'payments' | 'settings' | 'reviews-questions'>('products');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    if (!token) return;
    try {
      const res = await getSallaAccount(token);
      setAccount(res.connected ? res.account : null);
      if (res.connected) {
        const s = await getSallaStore(token);
        if (s?.store) {
          setMessage(`Store: ${s.store.name || s.store.id || ''}`);
        } else if (s?.message) {
          setMessage(s.message);
        } else {
          setMessage('Could not load store info.');
        }
      }
    } catch {}
  }

  async function handleTest() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const res = await testSalla(token);
    setMessage(res.message + (res.storeName ? `: ${res.storeName}` : ''));
  }

  async function handleDisconnect() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    await disconnectSalla(token);
    setAccount(null);
    setMessage('Disconnected Salla');
  }

  const tabs = [
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'brands', label: 'Brands', icon: '🏪' },
    { id: 'branches', label: 'Branches', icon: '🏢' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'reviews-questions', label: 'Reviews & Questions', icon: '⭐' }
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Salla Store Management</h1>
      
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Connection</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Not connected</p>
              <Button onClick={() => startSallaOAuth()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">Connect Salla</Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-green-50 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-green-800">{account.storeName || 'Salla Store'}</p>
                  {account.sallaStoreId && <p className="text-sm text-green-700">Store ID: {account.sallaStoreId}</p>}
                  {account.scope && <p className="text-xs text-green-700 break-all">Scopes: {account.scope}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleTest}>Test</Button>
                  <Button variant="secondary" size="sm" onClick={handleDisconnect} className="text-red-600 border-red-300 hover:bg-red-50">Disconnect</Button>
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
                      ? 'border-indigo-500 text-indigo-600'
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
            {activeTab === 'products' && <SallaProducts onMessage={setMessage} />}
            {activeTab === 'orders' && <SallaOrders onMessage={setMessage} />}
            {activeTab === 'customers' && <SallaCustomers onMessage={setMessage} />}
            {activeTab === 'categories' && <SallaCategories onMessage={setMessage} />}
            {activeTab === 'brands' && <SallaBrands onMessage={setMessage} />}
            {activeTab === 'branches' && <SallaBranches onMessage={setMessage} />}
            {activeTab === 'payments' && <SallaPayments onMessage={setMessage} />}
            {activeTab === 'settings' && <SallaSettings onMessage={setMessage} />}
            {activeTab === 'reviews-questions' && <SallaReviewsQuestions onMessage={setMessage} />}
          </div>
        </>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Failed') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
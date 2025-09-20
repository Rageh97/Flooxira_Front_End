'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PinterestBoards from './components/PinterestBoards';
import PinterestPins from './components/PinterestPins';
import PinterestAnalytics from './components/PinterestAnalytics';

interface PinterestAccount {
  connected: boolean;
  username?: string;
  fullName?: string;
  email?: string;
  profileImageUrl?: string;
  accountType?: string;
  isActive?: boolean;
}

export default function PinterestPage() {
  const [account, setAccount] = useState<PinterestAccount>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'boards' | 'pins' | 'analytics'>('boards');

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await fetch('/api/pinterest/account');
      const data = await response.json();
      setAccount(data);
    } catch (error) {
      console.error('Failed to fetch Pinterest account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to backend Pinterest OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/pinterest`;
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/pinterest/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setAccount({ connected: false });
      }
    } catch (error) {
      console.error('Failed to disconnect Pinterest account:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!account.connected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <h2 className="text-xl font-semibold">Connect Pinterest</h2>
            <p className="text-sm text-muted-foreground">Connect your Pinterest account to start managing your pins and boards</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnect} className="w-full">
              Connect Pinterest Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pinterest</h1>
            <p className="text-muted-foreground">
              Welcome back, {account.fullName || account.username}!
            </p>
          </div>
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'boards' ? 'default' : 'outline'}
          onClick={() => setActiveTab('boards')}
        >
          Boards
        </Button>
        <Button
          variant={activeTab === 'pins' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pins')}
        >
          Pins
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'boards' && <PinterestBoards />}
      {activeTab === 'pins' && <PinterestPins />}
      {activeTab === 'analytics' && <PinterestAnalytics />}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { getConnectedAccounts } from '@/lib/api';

interface ConnectedAccount {
  name: string;
  id: string;
  type: string;
}

interface ConnectedAccountsData {
  facebook?: ConnectedAccount;
  linkedin?: ConnectedAccount;
  twitter?: ConnectedAccount;
  youtube?: ConnectedAccount;
  pinterest?: ConnectedAccount;
}

export default function ConnectedAccountsSimple() {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalConnected, setTotalConnected] = useState(0);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const data = await getConnectedAccounts(token);
      setConnectedAccounts(data.connectedAccounts || {});
      setTotalConnected(data.totalConnected || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'linkedin': return '💼';
      case 'twitter': return '🐦';
      case 'youtube': return '📺';
      case 'pinterest': return '📌';
      default: return '✅';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'Facebook';
      case 'linkedin': return 'LinkedIn';
      case 'twitter': return 'Twitter';
      case 'youtube': return 'YouTube';
      case 'pinterest': return 'Pinterest';
      default: return platform;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'page': return 'Page';
      case 'profile': return 'Profile';
      case 'channel': return 'Channel';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading connected accounts...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchConnectedAccounts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Connected Accounts
          </div>
          <Badge variant="secondary">
            {totalConnected} Connected
          </Badge>
        </CardTitle>
        <CardDescription>
          Your connected social media accounts and pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalConnected === 0 ? (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Connected Accounts</h3>
            <p className="text-gray-500 mb-4">
              Connect your social media accounts to start managing your content.
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(connectedAccounts).map(([platform, account]) => (
              <div key={platform} className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="flex-shrink-0 text-2xl">
                  {getPlatformIcon(platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {account.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(account.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {getPlatformName(platform)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    ID: {account.id}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-between items-center">
          <Button onClick={fetchConnectedAccounts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/settings'} size="sm">
            Manage Accounts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

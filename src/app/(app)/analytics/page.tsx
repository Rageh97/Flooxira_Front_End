'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { getAllAnalytics } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ConnectedAccountsSimple from '@/components/ConnectedAccountsSimple';

interface AnalyticsData {
  facebook?: {
    insights: any[];
    pageId: string;
    hasInstagram: boolean;
  };
  linkedin?: {
    network: any;
    name: string;
  };
  twitter?: {
    metrics: any;
    username: string;
  };
  youtube?: {
    title: string;
    statistics: any;
  };
  pinterest?: {
    user: any;
    boards: any[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const data = await getAllAnalytics(token);
      if (data && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        setAnalytics({});
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalytics({}); // Set empty analytics on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    fetchAnalytics();
  }, [user, authLoading, router]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-700" />;
      case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      case 'pinterest': return <TrendingUp className="h-5 w-5 text-red-500" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>{authLoading ? 'Checking authentication...' : 'Loading analytics...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            {error.includes('authentication') ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Please sign in to access analytics.</p>
                <Button onClick={() => router.push('/sign-in')} className="w-full">
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <Button onClick={fetchAnalytics} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your social media performance across all platforms</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connected Accounts Section */}
      <ConnectedAccountsSimple />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="pinterest">Pinterest</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Facebook Card */}
            {analytics.facebook && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Facebook</CardTitle>
                  <Facebook className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.facebook?.insights?.[0]?.values?.[0]?.value ? 
                      formatNumber(analytics.facebook.insights[0].values[0].value) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Page Fans
                  </p>
                  {analytics.facebook.hasInstagram && (
                    <Badge variant="secondary" className="mt-2">
                      <Instagram className="h-3 w-3 mr-1" />
                      Instagram Connected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* LinkedIn Card */}
            {analytics.linkedin && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">LinkedIn</CardTitle>
                  <Linkedin className="h-4 w-4 text-blue-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.linkedin?.profile?.firstName ? 
                      analytics.linkedin.profile.firstName : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profile
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.linkedin?.name || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Twitter Card */}
            {analytics.twitter && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Twitter</CardTitle>
                  <Twitter className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.twitter?.metrics?.followers_count ? 
                      formatNumber(analytics.twitter.metrics.followers_count) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Followers
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{analytics.twitter?.username || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* YouTube Card */}
            {analytics.youtube && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YouTube</CardTitle>
                  <Youtube className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.youtube?.statistics?.subscriberCount ? 
                      formatNumber(parseInt(analytics.youtube.statistics.subscriberCount)) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subscribers
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.youtube?.title || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pinterest Card */}
            {analytics.pinterest && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pinterest</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.pinterest?.boards?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Boards
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* No Analytics Message */}
          {Object.keys(analytics).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Available</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Connect your social media accounts to see detailed analytics and insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="facebook" className="space-y-6">
          {analytics.facebook ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                    Facebook Analytics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Page ID: {analytics.facebook.pageId}
                  </p>
                </CardHeader>
                <CardContent>
                  {analytics.facebook.insights && analytics.facebook.insights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analytics.facebook.insights.map((insight, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-semibold">{insight.name}</h4>
                          <div className="text-2xl font-bold">
                            {insight.values?.[0]?.value ? 
                              formatNumber(insight.values[0].value) : 'N/A'}
                          </div>
                          <p className="text-sm text-gray-600">{insight.period}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No insights data available</p>
                      {analytics.facebook.error && (
                        <p className="text-sm text-red-500 mt-2">{analytics.facebook.error}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Facebook className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Facebook Analytics</h3>
                <p className="text-gray-500 text-center">
                  Connect your Facebook account to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="twitter" className="space-y-6">
          {analytics.twitter ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Twitter className="h-5 w-5 mr-2 text-blue-400" />
                    Twitter Analytics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    @{analytics.twitter.username}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Followers</h4>
                      <div className="text-2xl font-bold">
                        {analytics.twitter.metrics?.followers_count ? 
                          formatNumber(analytics.twitter.metrics.followers_count) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Following</h4>
                      <div className="text-2xl font-bold">
                        {analytics.twitter.metrics?.following_count ? 
                          formatNumber(analytics.twitter.metrics.following_count) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Tweets</h4>
                      <div className="text-2xl font-bold">
                        {analytics.twitter.metrics?.tweet_count ? 
                          formatNumber(analytics.twitter.metrics.tweet_count) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Listed</h4>
                      <div className="text-2xl font-bold">
                        {analytics.twitter.metrics?.listed_count ? 
                          formatNumber(analytics.twitter.metrics.listed_count) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Twitter className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Twitter Analytics</h3>
                <p className="text-gray-500 text-center">
                  Connect your Twitter account to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-6">
          {analytics.linkedin ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Linkedin className="h-5 w-5 mr-2 text-blue-700" />
                    LinkedIn Analytics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {analytics.linkedin.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">First Name</h4>
                      <div className="text-2xl font-bold">
                        {analytics.linkedin?.profile?.firstName || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Last Name</h4>
                      <div className="text-2xl font-bold">
                        {analytics.linkedin?.profile?.lastName || 'N/A'}
                      </div>
                    </div>
                  </div>
                  {analytics.linkedin?.error && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        Note: {analytics.linkedin.error}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Linkedin className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No LinkedIn Analytics</h3>
                <p className="text-gray-500 text-center">
                  Connect your LinkedIn account to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="youtube" className="space-y-6">
          {analytics.youtube ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="h-5 w-5 mr-2 text-red-600" />
                    YouTube Analytics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {analytics.youtube.title}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Subscribers</h4>
                      <div className="text-2xl font-bold">
                        {analytics.youtube.statistics?.subscriberCount ? 
                          formatNumber(parseInt(analytics.youtube.statistics.subscriberCount)) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Videos</h4>
                      <div className="text-2xl font-bold">
                        {analytics.youtube.statistics?.videoCount ? 
                          formatNumber(parseInt(analytics.youtube.statistics.videoCount)) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Views</h4>
                      <div className="text-2xl font-bold">
                        {analytics.youtube.statistics?.viewCount ? 
                          formatNumber(parseInt(analytics.youtube.statistics.viewCount)) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Comments</h4>
                      <div className="text-2xl font-bold">
                        {analytics.youtube.statistics?.commentCount ? 
                          formatNumber(parseInt(analytics.youtube.statistics.commentCount)) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Youtube className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No YouTube Analytics</h3>
                <p className="text-gray-500 text-center">
                  Connect your YouTube account to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pinterest" className="space-y-6">
          {analytics.pinterest ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
                    Pinterest Analytics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {analytics.pinterest.boards?.length || 0} Boards
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Boards</h4>
                        <div className="text-2xl font-bold">
                          {analytics.pinterest.boards?.length || 0}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Username</h4>
                        <div className="text-lg">
                          {analytics.pinterest.user?.username || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {analytics.pinterest.boards && analytics.pinterest.boards.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Recent Boards</h4>
                        <div className="space-y-2">
                          {analytics.pinterest.boards.slice(0, 5).map((board, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="font-medium">{board.name}</span>
                              <Badge variant="outline">{board.pin_count || 0} pins</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pinterest Analytics</h3>
                <p className="text-gray-500 text-center">
                  Connect your Pinterest account to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AuthGuard>
  );
}
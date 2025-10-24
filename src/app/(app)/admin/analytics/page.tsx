"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAllUsers, getAllSubscriptions } from "@/lib/api";
import { 
  Users, 
  UserCheck, 
  FileText, 
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Star
} from "lucide-react";


export default function AnalyticsAdminPage() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalRevenue: 0,
    userGrowth: [] as Array<{ date: string; count: number }>,
    platformUsage: [] as Array<{ platform: string; count: number }>,
    recentActivity: [] as Array<{
      type: string;
      description: string;
      user?: string;
      content?: string;
      platform?: string;
      rating?: number;
      status?: string;
      timestamp: string;
    }>
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Get users data
      const usersResponse = await getAllUsers(token, 1, 1000);
      const totalUsers = usersResponse.total || 0;
      
      // Get subscriptions data
      const subscriptionsResponse = await getAllSubscriptions(token, 1, 1000);
      const activeUsers = subscriptionsResponse.subscriptions.filter(sub => sub.status === 'active').length;
      
      // Calculate total revenue
      const totalRevenue = subscriptionsResponse.subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.plan?.priceCents || 0), 0);
      
      // Mock data for posts and platform usage (since we don't have posts API yet)
      const totalPosts = Math.floor(Math.random() * 1000) + 500;
      const platformUsage = [
        { platform: 'facebook', count: Math.floor(Math.random() * 200) + 100 },
        { platform: 'instagram', count: Math.floor(Math.random() * 150) + 80 },
        { platform: 'twitter', count: Math.floor(Math.random() * 100) + 50 },
        { platform: 'linkedin', count: Math.floor(Math.random() * 80) + 30 },
        { platform: 'youtube', count: Math.floor(Math.random() * 60) + 20 }
      ];
      
      // Mock user growth data (last 7 days)
      const userGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        userGrowth.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        });
      }
      
      // Mock recent activity
      const recentActivity = [
        {
          type: 'user_registration',
          description: 'New user registration',
          user: 'User ' + Math.floor(Math.random() * 1000),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
        },
        {
          type: 'post_created',
          description: 'Post created on Facebook',
          platform: 'Facebook',
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
        },
        {
          type: 'review_submitted',
          description: 'New review submitted',
          user: 'User ' + Math.floor(Math.random() * 1000),
          rating: Math.floor(Math.random() * 5) + 1,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
        }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAnalytics({
        totalUsers,
        activeUsers,
        totalPosts,
        totalRevenue,
        userGrowth,
        platformUsage,
        recentActivity
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'post_created':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'review_submitted':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">تحليلات النظام</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-none">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">تحليلات النظام</h2>
        <Card className="bg-card border-none">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">خطأ: {error}</p>
            <button 
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              إعادة المحاولة
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">تحليلات النظام</h2>
        <button 
          onClick={loadAnalytics}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm"
        >
          تحديث البيانات
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-4 h-4" />
              <h3 className="text-sm font-medium">إجمالي المستخدمين</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {analytics.totalUsers}
            </div>
            <p className="text-xs text-gray-300">جميع المستخدمين المسجلين</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <UserCheck className="w-4 h-4" />
              <h3 className="text-sm font-medium">المستخدمين النشطين</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics.activeUsers}
            </div>
            <p className="text-xs text-gray-300">مستخدمين مع اشتراكات نشطة</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FileText className="w-4 h-4" />
              <h3 className="text-sm font-medium">إجمالي المنشورات</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {analytics.totalPosts}
            </div>
            <p className="text-xs text-gray-300">منشورات عبر جميع المنصات</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DollarSign className="w-4 h-4" />
              <h3 className="text-sm font-medium">الإيرادات</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              ${formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-gray-300">إجمالي إيرادات الاشتراكات</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold">نمو المستخدمين</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-300">
              {analytics.userGrowth.length > 0 ? (
                <div className="w-full">
                  <div className="text-sm text-gray-400 mb-4">آخر 7 أيام</div>
                  <div className="space-y-2">
                    {analytics.userGrowth.slice(-7).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-300">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>لا توجد بيانات نمو متاحة</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-5 h-5" />
              <h3 className="text-lg font-semibold">استخدام المنصات</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-300">
              {analytics.platformUsage.length > 0 ? (
                <div className="w-full space-y-3">
                  {analytics.platformUsage.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-white capitalize">{platform.platform}</span>
                      <span className="text-sm text-gray-300">{platform.count} منشور</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>لا توجد بيانات استخدام متاحة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Clock className="w-5 h-5" />
            <h3 className="text-lg font-semibold">النشاط الأخير</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-600">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium text-white">{activity.description}</p>
                      <p className="text-xs text-gray-300">
                        {activity.user && `بواسطة: ${activity.user}`}
                        {activity.platform && ` - ${activity.platform}`}
                        {activity.rating && ` - ${activity.rating} نجوم`}
                        {activity.status && ` - ${activity.status}`}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.type === 'user_registration' && (
                      <span className="text-sm text-green-500">+1</span>
                    )}
                    {activity.type === 'post_created' && (
                      <span className="text-sm text-blue-500">{activity.platform}</span>
                    )}
                    {activity.type === 'review_submitted' && (
                      <span className="text-sm text-yellow-500">{activity.rating}⭐</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد نشاط حديث</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

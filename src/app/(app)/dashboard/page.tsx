"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PostStats {
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
  facebookPosts: number;
  instagramPosts: number;
  linkedinPosts: number;
  pinterestPosts: number;
  twitterPosts?: number;
  youtubePosts?: number;
  tiktokPosts?: number;
  telegramPosts?: number;
  whatsappPosts?: number;
}

interface UserStats {
  totalPosts: number;
  totalAccounts: number;
  totalEngagement: number;
  lastActivity: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PostStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const [postsResponse, userResponse] = await Promise.all([
        apiFetch<PostStats>("/api/posts/stats", { authToken: token }),
        apiFetch<UserStats>("/api/user/stats", { authToken: token }).catch(() => ({
          totalPosts: 0,
          totalAccounts: 0,
          totalEngagement: 0,
          lastActivity: new Date().toISOString()
        }))
      ]);
      setStats(postsResponse);
      setUserStats(userResponse);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك في لوحة التحكم</h1>
            <p className="text-gray-300 text-lg">
              {user?.name || user?.email} - إدارة شاملة لوسائل التواصل الاجتماعي
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">آخر نشاط</div>
            <div className="text-white font-medium">
              {userStats?.lastActivity ? new Date(userStats.lastActivity).toLocaleDateString('ar-SA') : 'اليوم'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient-green card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white">المنشورات المنشورة</h3>
            </div>
            <div className="text-green-400">📈</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats?.published || 0}</div>
            <p className="text-xs text-gray-300 mt-1">
              تم نشر المحتوى بنجاح
            </p>
            <div className="mt-2 text-xs text-green-300">
              +12% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-green-light card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white">المنشورات المجدولة</h3>
            </div>
            <div className="text-green-300">⏰</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-300">{stats?.scheduled || 0}</div>
            <p className="text-xs text-gray-300 mt-1">
              منشورات في انتظار النشر
            </p>
            <div className="mt-2 text-xs text-green-200">
              جاهزة للنشر
            </div>
          </CardContent>
        </Card>

        {/* <Card className="card-gradient-green-emerald card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-medium text-white">المسودات</h3>
            </div>
            <div className="text-emerald-400">📝</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{stats?.draft || 0}</div>
            <p className="text-xs text-gray-300 mt-1">
              مسودات قيد الإعداد
            </p>
            <div className="mt-2 text-xs text-emerald-300">
              تحتاج مراجعة
            </div>
          </CardContent>
        </Card> */}

        <Card className="card-gradient-green-dark card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-700 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white"> لم ينجح النشر</h3>
            </div>
            <div className="text-green-600">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.failed || 0}</div>
            <p className="text-xs text-gray-300 mt-1">
              منشورات فشل في نشرها
            </p>
            <div className="mt-2 text-xs text-green-500">
              تحتاج إعادة نشر
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-gradient-green-teal card-hover-effect">
          <CardHeader className="border-b border-teal-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">تحليلات المنصات</h3>
              <div className="text-teal-400">📊</div>
            </div>
            <p className="text-sm text-gray-300">إحصائيات مفصلة لكل منصة</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Facebook</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-400">{stats?.facebookPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-pink-600/20 rounded-lg border border-pink-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Instagram</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-pink-400">{stats?.instagramPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-white">LinkedIn</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-400">{stats?.linkedinPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
{/*             
            <div className="flex items-center justify-between p-3 bg-red-600/20 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Pinterest</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-400">{stats?.pinterestPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div> */}

            {/* Twitter */}
            <div className="flex items-center justify-between p-3 bg-sky-600/20 rounded-lg border border-sky-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-sky-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Twitter</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-sky-400">{stats?.twitterPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
            
            {/* YouTube */}
            <div className="flex items-center justify-between p-3 bg-red-600/20 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">YouTube</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-400">{stats?.youtubePosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
            
            {/* TikTok */}
            {/* <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-black rounded-full"></div>
                <span className="text-sm font-medium text-white">TikTok</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{stats?.tiktokPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div> */}
            
            {/* Telegram */}
            <div className="flex items-center justify-between p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Telegram</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-400">{stats?.telegramPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
            
            {/* WhatsApp */}
            <div className="flex items-center justify-between p-3 bg-green-600/20 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">WhatsApp</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-400">{stats?.whatsappPosts || 0}</span>
                <div className="text-xs text-gray-400">منشورات</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-green-mint card-hover-effect">
          <CardHeader className="border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">الإجراءات السريعة</h3>
              <div className="text-green-400">⚡</div>
            </div>
            <p className="text-sm text-gray-300">أدوات سريعة للبدء</p>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col gap-5 pt-4">
            <Link href="/create-post">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 h-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span>📝</span>
                  <span className="font-medium">إنشاء منشور جديد</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/schedule">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-4 h-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span>⏰</span>
                  <span className="font-medium">عرض المنشورات المجدولة</span>
                </div>
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 h-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span>⚙️</span>
                  <span className="font-medium">إدارة التكاملات</span>
                </div>
              </Button>
            </Link>

            <Link href="/analytics">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 h-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span>📊</span>
                  <span className="font-medium">عرض التحليلات</span>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Company Info Section */}
      {/*       <Card className="card-gradient-green-forest card-hover-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">معلومات الشركة</h3>
            <div className="text-green-400">🏢</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-3xl font-bold text-indigo-400 mb-2">500+</div>
              <div className="text-white font-medium">عميل راضي</div>
              <div className="text-sm text-gray-300">من جميع أنحاء العالم</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-white font-medium">وقت التشغيل</div>
              <div className="text-sm text-gray-300">ضمان الخدمة</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-white font-medium">دعم فني</div>
              <div className="text-sm text-gray-300">متاح على مدار الساعة</div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}








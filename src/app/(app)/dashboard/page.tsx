"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch, getCustomerStats, getUsageStats } from "@/lib/api";
import { getAllBanners, type Banner } from "@/lib/settingsApi";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ServicesSlider from "@/components/ServicesSlider";
import AnimatedBanner from "@/components/AnimatedBanner";
import PremiumLoader from "@/components/PremiumLoader";

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
  totalSuccessfulPublications?: number;
}

interface UserStats {
  totalPosts: number;
  totalAccounts: number;
  totalEngagement: number;
  lastActivity: string;
}

interface WhatsAppStats {
  messagesLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  customersByType: Array<{ subscriptionType: string; count: number }>;
  customersByStatus: Array<{ subscriptionStatus: string; count: number }>;
  recentCustomers: any[];
  financial: {
    totalCapital: string;
    totalRevenue: string;
    netProfit: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PostStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [whatsappStats, setWhatsappStats] = useState<WhatsAppStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [waUsage, setWaUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [tgUsage, setTgUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const currentMonthName = new Date().toLocaleString('ar-EG', { month: 'long' });
  const [pendingTicketsCount, setPendingTicketsCount] = useState<number>(0);

  // Animated banners data
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await getAllBanners();
        if (res.success) {
          setBanners(res.banners.filter(b => b.isActive));
        }
      } catch (e) {
        console.error("Failed to load banners", e);
      }
    };
    loadBanners();
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const startTime = Date.now();
    try {
      const token = localStorage.getItem("auth_token") || "";
      const [postsResponse, userResponse, customerResponse] = await Promise.all([
        apiFetch<PostStats>("/api/posts/stats", { authToken: token }),
        apiFetch<UserStats>("/api/usage/stats", { authToken: token }).catch(() => ({
          totalPosts: 0,
          totalAccounts: 0,
          totalEngagement: 0,
          lastActivity: new Date().toISOString()
        })),
        getCustomerStats(token).catch(() => ({
          success: true,
          data: {
            totalCustomers: 0,
            activeCustomers: 0,
            vipCustomers: 0,
            customersByType: [],
            customersByStatus: [],
            recentCustomers: [],
            financial: { 
              totalCapital: "0",
              totalRevenue: "0",
              netProfit: "0"
            }
          }
        }))
      ]);
      setStats(postsResponse);
      setUserStats(userResponse);
      if (customerResponse.success) {
        setCustomerStats(customerResponse.data);
      }

      // Usage stats for WhatsApp and Telegram (successful sends)
      try {
        const [wa, tg] = await Promise.all([
          getUsageStats(token, 'whatsapp'),
          getUsageStats(token, 'telegram').catch(() => null)
        ]);
        if (wa?.success) {
          setWaUsage({
            used: wa.data.usage?.used ?? (wa.data.usage as any)?.count ?? 0,
            limit: wa.data.limits?.whatsappMessagesPerMonth ?? 0,
            remaining: wa.data.usage?.remaining ?? 0,
          });
        }
        if (tg && tg.success) {
          setTgUsage({
            used: tg.data.usage?.used ?? (tg.data.usage as any)?.count ?? 0,
            limit: tg.data.limits?.telegramMessagesPerMonth ?? 0,
            remaining: tg.data.usage?.remaining ?? 0,
          });
        }
      } catch (e) {
        // ignore usage errors
      }
      
      // Calculate remaining time to ensure 5 seconds minimum loading
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 3000; 
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      // Fetch WhatsApp message stats from billing API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const billingData = await response.json();
          console.log('[Dashboard] Full billing response:', billingData);
          
          // Extract WhatsApp stats from the response structure
          const whatsappStats = billingData.data?.messageUsage?.find((m: any) => m.platform === 'whatsapp');
          const limit = billingData.data?.limits?.whatsappMessagesPerMonth || 0;
          const used = whatsappStats?.count || 0;
          const remaining = Math.max(0, limit - used);
          
        
          
          setWhatsappStats({
            messagesLimit: limit,
            messagesUsed: used,
            messagesRemaining: remaining
          });
        } else {
          console.error('[Dashboard] Billing API response not OK:', response.status);
          setWhatsappStats({
            messagesLimit: 0,
            messagesUsed: 0,
            messagesRemaining: 0
          });
        }
      } catch (billingError) {
        console.error('[Dashboard] Error fetching WhatsApp stats:', billingError);
        setWhatsappStats({
          messagesLimit: 0,
          messagesUsed: 0,
          messagesRemaining: 0
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };
  // Load pending tickets count
  useEffect(() => {
    const loadPendingTicketsCount = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) return;
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/tickets/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPendingTicketsCount(data.stats?.pending || 0);
        }
      } catch (error) {
        console.error('Failed to load pending tickets count:', error);
      }
    };

    if (user && !loading) {
      loadPendingTicketsCount();
      
      // Refresh count every 30 seconds
      const interval = setInterval(loadPendingTicketsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);
  if (loading) {
    return (
      <PremiumLoader />
      // <div className="flex items-center justify-center h-64">
      //   <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      // </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Animated Banner */}
      <AnimatedBanner 
        banners={banners}
        autoPlay={true}
        showControls={true}
        className="mb-3"
      />

      {/* Header Section */}
      {/* <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
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
              {userStats?.lastActivity ? new Date(userStats.lastActivity).toLocaleDateString('en-US') : 'اليوم'}
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Stats Grid */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ">
        <Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white"> مرات النشر</h3>
            </div>
            <img src="/check.gif" className="w-6 h-6"/>
          </CardHeader>
          <CardContent className="px-4">
          
          <div className="flex items-center justify-center gap-5 md:gap-10 h-10">


          <div className="flex flex-col items-center justify-center gap-1 font-bold">
            <div className="text-xs md:text-md text-gray-300 mt-1">
              المحتوى المنشور
            </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-4xl   font-bold text-primary">{stats?.totalSuccessfulPublications ?? stats?.published ?? 0}</div>
           
           </div>

        
          </div>
          
          </CardContent>
        </Card>

        <Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-xs md:text-sm font-medium text-white"> المنشورات المجدولة</h3>
            </div>
            <img src="/hour.gif" className="w-6 h-6"/>
          </CardHeader>
          <CardContent className="px-4">
          
          <div className="flex items-center justify-center gap-5 md:gap-5 md:gap-10 h-10">


          <div className="flex flex-col items-center justify-center gap-1 font-bold">
            <div className="text-xs md:text-md text-gray-300 mt-1">
              العدد المجدول
            </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-xs md:text-xl  font-bold text-primary">{stats?.scheduled || 0}</div>
            <div className=" text-[9px] md:text-xs text-primary">
              شهر ({currentMonthName})
            </div>
           </div>

        
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

<Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white"> عدد العملاء </h3>
            </div>
            <div className="text-primary">📈</div>
          </CardHeader>
          <CardContent className="px-4">
          
          <div className="flex items-center justify-center gap-5 md:gap-10 h-10">


          <div className="flex  items-center justify-center gap-1 font-bold">
          <div className="text-xs md:text-md text-gray-300 mt-1">
             الاشتراكات الفعالة
          </div>
          <div>
            {/* <div className="text-sm text-gray-300 mt-1">
              
            </div> */}
          </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-xl font-bold text-primary">{customerStats?.totalCustomers }</div>
            {/* <div className=" text-xs text-green-300">
              +12% معدل النمو
            </div> */}
           </div>

        
          </div>
          
          </CardContent>
   </Card>

        {/* WhatsApp Messages Card */}
        <Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-xs md:text-sm font-medium text-white"> عدد رسائل الواتساب </h3>
            </div>
            <div className="text-primary">{whatsappStats?.messagesLimit || 0}</div>
          </CardHeader>
          <CardContent className="px-4 flex flex-col">
          
          <div className="flex items-center justify-center gap-5 md:gap-10 h-10">


          <div className="flex items-center justify-center gap-1 font-bold">
          <div className="text-xs md:text-md text-gray-300 mt-1">
             الرسائل    المتبقية
          </div>
          <div>
            {/* <div className="text-xl text-gray-300 mt-1">
            
            </div> */}
          </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-xl   font-bold text-primary">{whatsappStats?.messagesRemaining || 0}</div>
            
           </div>

        
          </div>


          {/* <div className=" flex items-center gap-1">
              <div className="flex-1 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-light-custom h-full transition-all duration-500"
                  style={{ 
                    width: whatsappStats?.messagesLimit 
                      ? `${Math.min(100, (whatsappStats.messagesRemaining / whatsappStats.messagesLimit) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <span className="text-xs text-emerald-300 font-semibold">
                {whatsappStats?.messagesLimit 
                  ? Math.round((whatsappStats.messagesRemaining / whatsappStats.messagesLimit) * 100) 
                  : 0}%
              </span>
            </div> */}
            {/* {whatsappStats && whatsappStats.messagesRemaining < 10 && whatsappStats.messagesLimit > 0 && (
              <div className=" text-xs text-yellow-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>وشكت تخلص الرسائل!</span>
              </div>
            )} */}
          </CardContent>
   </Card>
        {/* new  Card */}
        <Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white">  الربح الصافي </h3>
            </div>
            <img src="/money.gif" className="w-6 h-6"/>
          </CardHeader>
          <CardContent className="px-4">
          
          <div className="flex items-center justify-center gap-5 md:gap-10 h-10">


          <div className="flex flex-col items-center justify-center gap-1 font-bold">
          <div className="text-xs md:text-md text-gray-300 mt-1">
             اجمالي الربح
          </div>
          <div>
            {/* <div className="text-xl text-gray-300 mt-1">
              
            </div> */}
          </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-xs md:text-xl  font-bold text-primary">{customerStats?.financial?.netProfit || 0} ر.س</div>
            {/* <div className=" text-xs text-green-300">
              +12% معدل النمو
            </div> */}
           </div>

        
          </div>
          
          </CardContent>
        </Card>
        {/* .................... */}

         <Card className="gradient-border card-hover-effect">
          <CardHeader className="flex flex-row items-center justify-between  pb-2">
            <div className="flex items-center  gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-white"> المحادثات المعلقة </h3>
            </div>
            <img src="/live.png" className="w-6 h-6"/>
          </CardHeader>
          <CardContent className="px-4">
          
          <div className="flex items-center justify-center gap-5 md:gap-10 h-10">


          <div className="flex flex-col items-center justify-center gap-1 font-bold">
          <div className="text-xs md:text-md text-gray-300 mt-1">
              المحادثات 
          </div>
          <div>
            {/* <div className="text-xl text-gray-300 mt-1">
              
            </div> */}
          </div>
          </div>


          <div className="w-0.5 h-18 bg-gradient-to-b from-transparent via-white/50 to-transparent"/>

          
          <div className="flex flex-col items-center justify-center ">
           <div className="text-xs md:text-xl  font-bold text-primary">{pendingTicketsCount}</div>
            {/* <div className=" text-xs text-green-300">
              +12% معدل النمو
            </div> */}
           </div>

        
          </div>
          
          </CardContent>
        </Card>
      </div>
      {/* ............... */}
      <div className="lg:hidden">
      <ServicesSlider />
      </div>


      {/* Platform Analytics */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Card className="gradient-border h-fit card-hover-effect">
          <CardHeader className="border-b border-teal-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">تحليلات المنصات</h3>
            </div>
            <p className="text-sm text-gray-300">إحصائيات مفصلة لكل منصة</p>
          </CardHeader>
          <CardContent className="space-y-1 pt-4">
            {/* الصف الأول - 3 منصات */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-1">
              <div  className="flex items-center justify-between px-3 h-10 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <img src="/facebook.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">فيسبوك</span>
              </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-400">{stats?.facebookPosts || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-3 h-10 bg-pink-600/20 rounded-lg border border-pink-500/30">
                  <div className="flex items-center gap-2">
                <div className="w-6 h-6  ">
                  <img src="/insta.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">انستقرام</span>
                  </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-pink-400">{stats?.instagramPosts || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-3 h-10 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/linkedin.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">لينكدان</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-400">{stats?.linkedinPosts || 0}</span>
                </div>
              </div>

               <div className="lg:hidden flex items-center justify-between px-3 h-10 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/telegram.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">تليجرام</span>
              </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-400">{tgUsage?.used ?? 0}</span>
                </div>
              </div>
            </div>

            {/* الصف الثاني - 3 منصات */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-1">
              <div className="flex items-center justify-between px-3 h-10 bg-black/50 rounded-lg border border-sky-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/x.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">تويتر</span>
              </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white">{stats?.twitterPosts || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-3 h-10 bg-red-600/20 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/youtube.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">يوتيوب</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-400">{stats?.youtubePosts || 0}</span>
                </div>
              </div>
              
              <div className="lg:flex hidden items-center justify-between px-3 h-10 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/telegram.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">تليجرام</span>
              </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-400">{tgUsage?.used ?? 0}</span>
                </div>
              </div>

            </div>

            {/* الصف الأخير - منصة واحدة تأخذ العرض الكامل */}
            <div className="flex items-center justify-between px-3 h-10 bg-secondry rounded-lg border border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6  ">
                  <img src="/wtsapp.gif" alt="" />
                </div>
                <span className="text-sm font-medium text-white">واتساب</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-400">{waUsage?.used ?? 0}</span>
                {/* <div className="text-xs text-gray-400">منشورات</div> */}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border h-fit card-hover-effect">
          <CardHeader className="border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">الإجراءات السريعة</h3>
            </div>
            <p className="text-sm text-gray-300">أدوات سريعة للبدء</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-4">

            <div className="flex w-full items-center gap-2">
            <Link className="w-full h-15.5  rounded-lg" href="/create-post">
              <Button className="w-full relative h-full gradient-border border border-text-primary text-white p-4 h-auto">


                <div className="flex items-center flex-col md:flex-row  w-full ">
                 
                  <img className="w-6 h-6 lg:w-10 lg:h-10" src="/plus.gif" alt="" />
                
                  <div className="font-medium text-sm lg:text-lg ">إنشاء منشور جديد</div>
                </div>
              </Button>
            </Link>
            
            <Link className="w-full h-15.5" href="/schedule">
              <Button className="w-full h-full gradient-border border border-text-primary text-white p-4 h-auto">
                <div className="flex items-center flex-col md:flex-row  w-full">
                <img className="w-6 h-6 lg:w-10 lg:h-10" src="/hour.gif" alt="" />
                  <div className="font-medium text-xs lg:text-lg"> المنشورات المجدولة</div>
                </div>
              </Button>
            </Link>
            </div>
            
           <div className="flex w-full items-center gap-2">
           <Link className="w-full h-15.5" href="/settings">
                <Button className="w-full h-full gradient-border border border-text-primary text-white p-4 h-auto">
                  <div className="flex items-center flex-col md:flex-row  w-full">
                <img className="w-6 h-6 lg:w-10 lg:h-10" src="/setting.gif" alt="" />
                  <div className="font-medium text-sm lg:text-lg">إدارة الحسابات</div>
                </div>
              </Button>
            </Link>

            <Link className="w-full h-15.5" href="/customers">
              <Button className="w-full h-full gradient-border border border-text-primary text-white p-4 h-auto">
                <div className="flex items-center flex-col md:flex-row  w-full">
                <img className="w-6 h-6 lg:w-10 lg:h-10" src="/clients.gif" alt="" />
                  <div className="font-medium text-sm lg:text-lg">ادارة العملاء </div>
                </div>
              </Button>
            </Link>
           </div>


          </CardContent>
        </Card>
      </div>


      {/* Services Slider */}
      <div className="hidden lg:block">
      <ServicesSlider />
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








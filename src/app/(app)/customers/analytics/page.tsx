'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  Crown, 
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Package,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerStats } from '@/lib/api';

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  customersByType: Array<{ subscriptionType: string; count: number }>;
  customersByStatus: Array<{ subscriptionStatus: string; count: number }>;
  recentCustomers: Array<{
    id: number;
    name: string;
    subscriptionType: string;
    subscriptionStatus: string;
    isVip: boolean;
    createdAt: string;
    plan?: {
      name: string;
    };
  }>;
}

export default function CustomerAnalyticsPage() {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await getCustomerStats(token);
      if (response.success) {
        setStats(response.data);
        setHasAccess(true);
      } else {
        if ((response as any).code === 'CUSTOMER_MANAGEMENT_DENIED') {
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      toast.error('فشل في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      case 'expired': return 'text-red-600';
      case 'suspended': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'text-blue-600';
      case 'premium': return 'text-purple-600';
      case 'enterprise': return 'text-red-600';
      case 'custom': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'expired': return 'منتهي';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'أساسي';
      case 'premium': return 'مميز';
      case 'enterprise': return 'مؤسسي';
      case 'custom': return 'مخصص';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // إذا لم يكن لديه صلاحية، اعرض رسالة عدم الصلاحية
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ليس لديك اشتراك نشط</h2>
              <p className="text-gray-600 mb-6">
                تحتاج إلى اشتراك نشط في باقة تدعم ميزة إدارة العملاء للوصول إلى هذه الصفحة
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/plans'}
                className="w-full"
              >
                عرض الباقات المتاحة
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = '/customers'}
                className="w-full"
              >
                العودة لإدارة العملاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">لا توجد بيانات متاحة</h1>
          <Button onClick={fetchStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-2 p-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-fixed-40 p-2 rounded-xl border border-white/5 backdrop-blur-sm gap-2">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/customers'}
            className="flex items-center gap-2 primary-button after:bg-[#011910] text-white font-bold h-8 px-4 text-sm"
          >
            العودة لإدارة العملاء
          </Button>
          <div className="hidden md:block h-6 w-[1px] bg-fixed-40 mx-1"></div>
          <p className="text-white font-medium hidden md:block text-sm">لوحة تحليل أداء العملاء</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-gray-400 text-xs whitespace-nowrap">نطاق الوقت:</span>
          <Combobox
            options={[
              { value: '7d', label: 'آخر 7 أيام' },
              { value: '30d', label: 'آخر 30 يوم' },
              { value: '90d', label: 'آخر 90 يوم' },
              { value: '1y', label: 'آخر سنة' }
            ]}
            value={timeRange}
            onValueChange={setTimeRange}
            placeholder="اختر الفترة"
            className="w-full md:w-[140px] h-8 text-white text-sm"
          />
        </div>
      </div>

     {/* Main Stats Grid */}
     {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          <Card className="gradient-border border-none w-full">
            <CardContent className="!p-2 flex flex-col justify-between h-full min-h-[80px]">
              <div className="flex justify-between items-start">
                <p className="text-gray-400 text-xs font-medium">إجمالي العملاء</p>
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalCustomers}</p>
                <p className="text-[10px] text-green-500 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% نمو
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none w-full">
            <CardContent className="!p-2 flex flex-col justify-between h-full min-h-[80px]">
              <div className="flex justify-between items-start">
                <p className="text-gray-400 text-xs font-medium">العملاء النشطين</p>
                <div className="p-1.5 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mt-1">{stats.activeCustomers}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}% من الإجمالي
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none w-full">
            <CardContent className="!p-2 flex flex-col justify-between h-full min-h-[80px]">
              <div className="flex justify-between items-start">
                <p className="text-gray-400 text-xs font-medium">عملاء VIP</p>
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Crown className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mt-1">{stats.vipCustomers}</p>
                <p className="text-[10px] text-purple-400 mt-0.5">اشتراكات مميزة</p>
              </div>
            </CardContent>
          </Card>

          {stats.financial && (
            <Card className="gradient-border border-none w-full">
              <CardContent className="!p-2 flex flex-col justify-between h-full min-h-[80px]">
                <div className="flex justify-between items-start">
                  <p className="text-gray-400 text-xs font-medium">صافي الربح</p>
                  <div className="p-1.5 bg-orange-500/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mt-1">{(stats as any).financial.netProfit} <span className="text-xs font-normal">ر.س</span></p>
                  <p className="text-[10px] text-green-500 mt-0.5">ربح صافي</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Financial Details Row */}
      {stats && (stats as any).financial && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
          <Card className="gradient-border border-none w-full bg-white/5">
            <CardContent className="!p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">رأس المال الكلي</p>
                  <p className="text-lg font-bold text-white">{(stats as any).financial.totalCapital} ر.س</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">الإيرادات الكلية</p>
                  <p className="text-lg font-bold text-white">{(stats as any).financial.totalRevenue} ر.س</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none w-full bg-white/5">
             <CardHeader className="!p-2 py-1 border-b border-white/5">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-sm text-white">ملخص سريع</CardTitle>
                   <BarChart3 className="w-3 h-3 text-gray-400" />
                </div>
             </CardHeader>
             <CardContent className="!p-2 flex items-center justify-around">
                <div className="text-center">
                   <p className="text-[10px] text-gray-400 mb-0.5">معدل التحويل</p>
                   <p className="text-base font-bold text-white">24%</p>
                </div>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div className="text-center">
                   <p className="text-[10px] text-gray-400 mb-0.5">متوسط الاشتراك</p>
                   <p className="text-base font-bold text-white">450</p>
                </div>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div className="text-center">
                   <p className="text-[10px] text-gray-400 mb-0.5">نسبة الاحتفاظ</p>
                   <p className="text-base font-bold text-green-500">88%</p>
                </div>
             </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs Section */}
      <div className="w-full">
        <Tabs defaultValue="overview" className="space-y-2 w-full">
          <div className="flex justify-between items-center">
            <TabsList className='bg-secondry text-white inner-shadow p-0.5 h-auto'>
              <TabsTrigger value="overview" className="px-3 py-1 text-xs">نظرة عامة</TabsTrigger>
              <TabsTrigger value="types" className="px-3 py-1 text-xs">أنواع الاشتراكات</TabsTrigger>
              <TabsTrigger value="status" className="px-3 py-1 text-xs">حالات الاشتراكات</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-2 w-full mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
              {/* Types Overview */}
              <Card className='gradient-border border-none text-white h-full'>
                <CardHeader className="!p-2 pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChart className="h-4 w-4 text-blue-400" />
                    توزيع الأنواع
                  </CardTitle>
                </CardHeader>
                <CardContent className="!p-2">
                  <div className="space-y-1">
                    {stats.customersByType.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-6 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                          <span className="font-bold text-white text-xs">{getTypeLabel(item.subscriptionType)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.count}</span>
                          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-gray-300">
                            {stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Overview */}
              <Card className='gradient-border text-white h-full'>
                <CardHeader className="!p-2 pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-green-400" />
                    توزيع الحالات
                  </CardTitle>
                </CardHeader>
                <CardContent className="!p-2">
                  <div className="space-y-1">
                    {stats.customersByStatus.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.subscriptionStatus).replace('text-', 'bg-')}`}></div>
                          <span className="font-bold text-white text-xs">{getStatusLabel(item.subscriptionStatus)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.count}</span>
                          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-gray-300">
                            {stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="types" className="w-full mt-0">
            <Card className='gradient-border w-full'>
              <CardHeader className="!p-2">
                <CardTitle className="text-white text-sm">تفاصيل أنواع الاشتراكات</CardTitle>
              </CardHeader>
              <CardContent className="!p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stats.customersByType.map((item, index) => {
                    const percentage = stats.totalCustomers > 0 ? (item.count / stats.totalCustomers) * 100 : 0;
                    return (
                      <div key={index} className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">{getTypeLabel(item.subscriptionType)}</span>
                          <span className="text-lg font-bold text-blue-400">{item.count}</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-right text-gray-400">{Math.round(percentage)}% من الإجمالي</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="w-full mt-0">
            <Card className='gradient-border w-full'>
              <CardHeader className="!p-2">
                <CardTitle className="text-white text-sm">تفاصيل حالات الاشتراكات</CardTitle>
              </CardHeader>
              <CardContent className="!p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stats.customersByStatus.map((item, index) => {
                    const percentage = stats.totalCustomers > 0 ? (item.count / stats.totalCustomers) * 100 : 0;
                    const colorClass = getStatusColor(item.subscriptionStatus).replace('text-', 'bg-');
                    return (
                      <div key={index} className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">{getStatusLabel(item.subscriptionStatus)}</span>
                          <span className={`text-lg font-bold ${getStatusColor(item.subscriptionStatus)}`}>{item.count}</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-right text-gray-400">{Math.round(percentage)}% من الإجمالي</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

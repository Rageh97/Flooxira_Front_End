'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/customers'}
            className="flex items-center gap-2 primary-button after:bg-[#011910] text-white font-bold text-lg"
          >
            {/* <ArrowRight className="w-4 h-4" /> */}
            العودة لإدارة العملاء
          </Button>
          <div>
            {/* <h1 className="text-3xl font-bold">إحصائيات العملاء</h1> */}
            <p className="text-white">تحليل شامل لأداء إدارة العملاء</p>
          </div>
        </div>
        <div className="flex gap-2">
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
            className="w-[180px] text-white"
          />
         
        </div>
      </div>

     {/* Stats Cards */}
     {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">إجمالي العملاء</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">العملاء النشطين</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.activeCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">عملاء VIP</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.vipCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">معدل النمو</p>
                </div>
                <p className="text-4xl font-bold text-white">+12%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Stats Cards */}
      {(stats as any).financial && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">رأس المال الكلي</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.totalCapital} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">الإيرادات الكلية</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.totalRevenue} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg font-bold">صافي الربح</p>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any).financial.netProfit} ر.س</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4 ">
        <TabsList className='bg-[#011910] text-white inner-shadow'>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="types">أنواع الاشتراكات</TabsTrigger>
          <TabsTrigger value="status">حالات الاشتراكات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Types Chart */}
            <Card className='gradient-border border-none text-white'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع أنواع الاشتراكات
                </CardTitle>
                <CardDescription className='text-white'>
                  توزيع العملاء حسب نوع الاشتراك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.customersByType.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(item.subscriptionType).replace('text-', 'bg-')}`}></div>
                        <span className="text-sm font-medium text-gray-200">{getTypeLabel(item.subscriptionType)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white" >
                        <span className="text-sm font-bold">{item.count}</span>
                        <span className="text-xs text-green-500">
                          ({stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Status Chart */}
            <Card className='gradient-border'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  توزيع حالات الاشتراكات
                </CardTitle>
                <CardDescription className='text-white'>
                  توزيع العملاء حسب حالة الاشتراك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.customersByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white" >
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.subscriptionStatus).replace('text-', 'bg-')}`}></div>
                        <span className="text-sm font-medium">{getStatusLabel(item.subscriptionStatus)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white" >
                        <span className="text-sm font-bold">{item.count}</span>
                        <span className="text-xs text-green-500">
                          ({stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card className='gradient-border'>
            <CardHeader className='text-white'>
              <CardTitle>تحليل أنواع الاشتراكات</CardTitle>
              <CardDescription className='text-white'>
                تفصيل شامل لتوزيع العملاء حسب نوع الاشتراك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.customersByType.map((item, index) => {
                  const percentage = stats.totalCustomers > 0 ? (item.count / stats.totalCustomers) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-white" >
                        <span className="font-medium">{getTypeLabel(item.subscriptionType)}</span>
                        <span className="text-sm text-green-500">{item.count} عميل ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-green-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card className='gradient-border'>
            <CardHeader className='text-white'>
              <CardTitle>تحليل حالات الاشتراكات</CardTitle>
              <CardDescription className='text-white'>
                تفصيل شامل لتوزيع العملاء حسب حالة الاشتراك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.customersByStatus.map((item, index) => {
                  const percentage = stats.totalCustomers > 0 ? (item.count / stats.totalCustomers) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-white" >
                        <span className="font-medium">{getStatusLabel(item.subscriptionStatus)}</span>
                        <span className="text-sm text-green-500">{item.count} عميل ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(item.subscriptionStatus).replace('text-', 'bg-')}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>العملاء الجدد</CardTitle>
              <CardDescription>
                أحدث العملاء المسجلين في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{customer.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {customer.plan?.name || getTypeLabel(customer.subscriptionType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(customer.subscriptionStatus)}`}>
                        {getStatusLabel(customer.subscriptionStatus)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}




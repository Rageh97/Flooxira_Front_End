"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Loader2
} from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";
import PieChart from "@/components/charts/PieChart";
import Timeline from "@/components/Timeline";
import { 
  getBillingAnalytics, 
  getInvoices, 
  getRevenueChartData, 
  getPlanDistribution, 
  getPaymentMethodDistribution, 
  getSubscriptionTimeline,
  type BillingAnalytics,
  type Invoice,
  type ChartData,
  type DistributionData,
  type TimelineEvent
} from "@/lib/billingApi";

// Remove duplicate interfaces - they're now imported from billingApi

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Real data from API
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<DistributionData[]>([]);
  const [paymentMethodDistribution, setPaymentMethodDistribution] = useState<DistributionData[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadBillingData();
    }
  }, [token, selectedPeriod]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        analyticsResult,
        invoicesResult,
        chartDataResult,
        planDistributionResult,
        paymentMethodDistributionResult,
        timelineResult
      ] = await Promise.all([
        getBillingAnalytics(token, selectedPeriod),
        getInvoices(token, { status: filterStatus, search: searchTerm }),
        getRevenueChartData(token, 6),
        getPlanDistribution(token),
        getPaymentMethodDistribution(token),
        getSubscriptionTimeline(token)
      ]);

      if (analyticsResult.success && analyticsResult.analytics) {
        setAnalytics(analyticsResult.analytics);
      }

      if (invoicesResult.success && invoicesResult.invoices) {
        setInvoices(invoicesResult.invoices);
      }

      if (chartDataResult.success && chartDataResult.chartData) {
        setChartData(chartDataResult.chartData);
      }

      if (planDistributionResult.success && planDistributionResult.distribution) {
        setPlanDistribution(planDistributionResult.distribution);
      }

      if (paymentMethodDistributionResult.success && paymentMethodDistributionResult.distribution) {
        setPaymentMethodDistribution(paymentMethodDistributionResult.distribution);
      }

      if (timelineResult.success && timelineResult.timeline) {
        setTimeline(timelineResult.timeline);
      }

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.plan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle search and filter changes
  useEffect(() => {
    if (token) {
      loadBillingData();
    }
  }, [searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">مدفوعة</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">معلقة</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">متأخرة</Badge>;
      default:
        return <Badge>غير محدد</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="min-h-screen bg-gradient-custom">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">الفواتير والتحليلات</h1>
            <p className="text-gray-300">إدارة الفواتير ومراقبة الأداء المالي</p>
          </div>
          <div className="flex gap-3">
            <Button className="button-primary">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
            <Button variant="outline" className="border-text-primary/50 text-text-primary hover:bg-text-primary/10">
              <Eye className="w-4 h-4 ml-2" />
              عرض مفصل
            </Button>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>تنبيه</AlertTitle>
            <AlertDescription>
              لديك فاتورة متأخرة بقيمة {formatCurrency(99.99)} من الخطة الأساسية. يرجى السداد في أقرب وقت ممكن.
            </AlertDescription>
          </Alert>
          
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>تم بنجاح</AlertTitle>
            <AlertDescription>
              تم تجديد اشتراكك بنجاح. ستبقى خدماتك متاحة حتى 15 أبريل 2024.
            </AlertDescription>
          </Alert>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-text-primary" />
            <span className="text-white mr-2">جاري تحميل البيانات...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(analytics.totalRevenue)}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-400 ml-1" />
                      <span className="text-sm text-green-400">+{analytics.growthRate}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-text-primary/10 rounded-full">
                    <DollarSign className="w-6 h-6 text-text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">إيرادات هذا الشهر</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(analytics.monthlyRevenue)}</p>
                    <div className="flex items-center mt-2">
                      <Activity className="w-4 h-4 text-blue-400 ml-1" />
                      <span className="text-sm text-blue-400">نشط</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">المستخدمون النشطون</p>
                    <p className="text-2xl font-bold text-text-primary">{analytics.activeUsers.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Users className="w-4 h-4 text-purple-400 ml-1" />
                      <span className="text-sm text-purple-400">+15%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                    <p className="text-sm text-gray-400 mb-1">الرسائل المرسلة</p>
                    <p className="text-2xl font-bold text-text-primary">{analytics.messagesSent.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <MessageSquare className="w-4 h-4 text-orange-400 ml-1" />
                      <span className="text-sm text-orange-400">+8%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <MessageSquare className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Chart */}
        <RevenueChart data={chartData} />

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {planDistribution.length > 0 && (
            <PieChart 
              data={planDistribution.map((item, index) => ({
                name: item.name,
                value: item.value,
                color: index === 0 ? '#08c47d' : index === 1 ? '#134a2b' : '#122f29'
              }))}
              title="توزيع الخطط"
            />
          )}
          {paymentMethodDistribution.length > 0 && (
            <PieChart 
              data={paymentMethodDistribution.map((item, index) => ({
                name: item.name,
                value: item.value,
                color: index === 0 ? '#08c47d' : index === 1 ? '#134a2b' : '#122f29'
              }))}
              title="طرق الدفع"
            />
          )}
        </div>

        {/* Invoices Section */}
        <Card className="bg-card border-none content-card">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-text-primary flex items-center">
                <Receipt className="w-5 h-5 ml-2" />
                الفواتير
              </CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="البحث في الفواتير..."
                    className="pl-10 pr-4 py-2 bg-bg-semidark-custom border border-text-primary/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-text-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 bg-bg-semidark-custom border border-text-primary/30 rounded-lg text-white focus:outline-none focus:border-text-primary"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">جميع الحالات</option>
                  <option value="paid">مدفوعة</option>
                  <option value="pending">معلقة</option>
                  <option value="overdue">متأخرة</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-text-primary/20">
                    <th className="text-right py-3 px-4 text-text-primary font-medium">رقم الفاتورة</th>
                    <th className="text-right py-3 px-4 text-text-primary font-medium">التاريخ</th>
                    <th className="text-right py-3 px-4 text-text-primary font-medium">المبلغ</th>
                    <th className="text-right py-3 px-4 text-text-primary font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 text-text-primary font-medium">الخطة</th>
                    <th className="text-right py-3 px-4 text-text-primary font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-text-primary/10 hover:bg-bg-semidark-custom/50 transition-colors">
                      <td className="py-4 px-4 text-white font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-4 px-4 text-gray-300">{formatDate(invoice.date)}</td>
                      <td className="py-4 px-4 text-text-primary font-bold">{formatCurrency(invoice.amount)}</td>
                      <td className="py-4 px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-4 px-4 text-white">{invoice.plan}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-text-primary/50 text-text-primary hover:bg-text-primary/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-text-primary/50 text-text-primary hover:bg-text-primary/10">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">معدل التحويل</h3>
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-text-primary mb-2">{analytics.conversionRate}%</div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-400 ml-1" />
                  <span className="text-sm text-green-400">+2.1% من الشهر الماضي</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">معدل التسرب</h3>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400 mb-2">{analytics.churnRate}%</div>
                <div className="flex items-center">
                  <TrendingDown className="w-4 h-4 text-red-400 ml-1" />
                  <span className="text-sm text-red-400">-0.5% من الشهر الماضي</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-none content-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">متوسط الإيراد لكل مستخدم</h3>
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-text-primary mb-2">{formatCurrency(analytics.averageRevenuePerUser)}</div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-400 ml-1" />
                  <span className="text-sm text-green-400">+5.2% من الشهر الماضي</span>
          </div>
        </CardContent>
      </Card>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <Timeline 
            events={timeline}
            title="الجدولة الزمنية للفواتير"
          />
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  DollarSign, 
  Trophy,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";
import { getEmployeeDashboard } from "@/lib/employeeManagementApi";
import { useAuth } from "@/lib/auth";

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  salaries: {
    currentMonth: number;
    unpaidCount: number;
  };
  topEmployees: Array<{
    employee: { id: number; name: string; email: string };
    points: number;
    level: { name: string; badge: string; color: string };
  }>;
  attendanceSummary: {
    present?: number;
    absent?: number;
    late?: number;
    leave?: number;
  };
  month: number;
  year: number;
}

export default function EmployeeDashboard() {
  const { getToken } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await getEmployeeDashboard(token);
      if (response.success) {
        setDashboard(response.dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl" />)}
    </div>;
  }

  if (!dashboard) return null;

  const attendanceRate = dashboard.totalEmployees > 0 
    ? Math.round((dashboard.presentToday / dashboard.totalEmployees) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">إجمالي الموظفين</CardTitle>
            <Users className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dashboard.totalEmployees}</div>
            <p className="text-xs text-blue-300 mt-1">موظف نشط</p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-200">الحاضرون اليوم</CardTitle>
            <UserCheck className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dashboard.presentToday}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <span className="text-xs text-green-300">{attendanceRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-200">الغائبون اليوم</CardTitle>
            <UserX className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dashboard.absentToday}</div>
            <p className="text-xs text-red-300 mt-1">موظف غائب</p>
          </CardContent>
        </Card>

        {/* <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-200">طلبات الإجازات</CardTitle>
            <Calendar className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dashboard.pendingLeaves}</div>
            <p className="text-xs text-amber-300 mt-1">طلب بانتظار الموافقة</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Salary & Top Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Summary */}
        {/* <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              ملخص الرواتب - {dashboard.month}/{dashboard.year}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="text-sm text-gray-400">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-white">
                  {dashboard.salaries.currentMonth.toLocaleString()} <span className="text-sm text-gray-400">ر.س</span>
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            
            {dashboard.salaries.unpaidCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-300">
                  {dashboard.salaries.unpaidCount} راتب بانتظار الدفع
                </p>
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Top Employees */}
        {/* <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              أفضل الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.topEmployees.slice(0, 5).map((item, index) => (
                <div 
                  key={item.employee.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.employee.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.employee.email}</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{item.level?.badge || '🌱'}</span>
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: item.level?.color, color: item.level?.color }}
                      >
                        {item.points} نقطة
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 text-left">{item.level?.name}</p>
                  </div>
                </div>
              ))}
              
              {dashboard.topEmployees.length === 0 && (
                <p className="text-center text-gray-400 py-4">لا توجد بيانات</p>
              )}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Attendance Summary */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            ملخص الحضور - {dashboard.month}/{dashboard.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-3xl font-bold text-green-400">{dashboard.attendanceSummary.present || 0}</p>
              <p className="text-sm text-gray-400 mt-1">حاضر</p>
            </div>
            
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-3xl font-bold text-red-400">{dashboard.attendanceSummary.absent || 0}</p>
              <p className="text-sm text-gray-400 mt-1">غائب</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

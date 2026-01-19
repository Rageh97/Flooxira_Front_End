"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Medal, Gift, TrendingUp, Plus, User } from "lucide-react";
import { getPointsLeaderboard, addPoints, getEmployeePoints } from "@/lib/employeeManagementApi";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function PointsSystem() {
  const { getToken } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    points: 10,
    type: 'performance_bonus',
    reason: ''
  });

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await getPointsLeaderboard(token);
      if (response.success) {
        setLeaderboard(response.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await apiFetch<any>('/api/employees?limit=1000', { authToken: token });
      if (response.success) {
        setEmployees(response.employees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAddPoints = async () => {
    if (!formData.reason) {
      toast.error('يرجى كتابة سبب المنح/الخصم');
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const response = await addPoints(token, {
        ...formData,
        employeeId: parseInt(formData.employeeId)
      });

      if (response.success) {
        toast.success(response.message);
        setShowAddPoints(false);
        loadData();
        setFormData({ ...formData, points: 10, reason: '' }); // reset some fields
      }
    } catch (error) {
      toast.error('خطأ في العملية');
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 2: return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
      case 3: return 'bg-amber-700/20 text-amber-600 border-amber-700/30';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold w-5 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">نظام النقاط والتحفيز</h2>
          <p className="text-gray-400">تابع أداء الموظفين وحفزهم من خلال نظام النقاط والمكافآت</p>
        </div>
        <Button onClick={() => setShowAddPoints(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
          <PartyPopper className="h-4 w-4 ml-2" />
          منح نقاط
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <Card className="lg:col-span-2 gradient-border bg-black/40">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              لوحة الصدارة (الشهر الحالي)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد بيانات للنقاط حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((item) => (
                  <div 
                    key={item.employee.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden"
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${getRankStyle(item.rank)}`}>
                      {getRankIcon(item.rank)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white">{item.employee.name}</h3>
                        <Badge variant="outline" className={`${getRankStyle(item.rank)} border-0`}>
                          {item.totalPoints} نقطة
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          {item.level?.badge} {item.level?.name}
                        </span>
                        {item.rank === 1 && <span className="text-yellow-500 text-xs">👑 متصدر الشهر</span>}
                      </div>

                      {/* Progress bar visual */}
                      <div className="mt-3 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, (item.totalPoints / (leaderboard[0]?.totalPoints || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info & Stats */}
        <div className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-purple-200 text-sm">أعلى نقاط مكتسبة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {leaderboard.length > 0 ? leaderboard[0].totalPoints : 0}
              </div>
              <p className="text-xs text-purple-300 mt-1">
                {leaderboard.length > 0 ? `بواسطة ${leaderboard[0].employee.name}` : '-'}
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white text-sm">المستويات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <span className="text-sm font-medium text-cyan-400">ماسي</span>
                </div>
                <span className="text-xs text-gray-500">5000+</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <span className="text-sm font-medium text-yellow-400">ذهبي</span>
                </div>
                <span className="text-xs text-gray-500">2500+</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥈</span>
                  <span className="text-sm font-medium text-gray-300">فضي</span>
                </div>
                <span className="text-xs text-gray-500">1000+</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥉</span>
                  <span className="text-sm font-medium text-amber-600">برونزي</span>
                </div>
                <span className="text-xs text-gray-500">500+</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌱</span>
                  <span className="text-sm font-medium text-green-400">مبتدئ</span>
                </div>
                <span className="text-xs text-gray-500">0+</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grant Points Dialog */}
      <Dialog open={showAddPoints} onOpenChange={setShowAddPoints}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>منح / خصم نقاط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الموظف</Label>
              <Select value={formData.employeeId} onValueChange={(v) => setFormData(f => ({ ...f, employeeId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>النوع</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance_bonus">مكافأة أداء (+)</SelectItem>
                    <SelectItem value="task_completion">إنجاز مهمة (+)</SelectItem>
                    <SelectItem value="punctuality">التزام بالمواعيد (+)</SelectItem>
                    <SelectItem value="manual_adjustment">تعديل يدوي</SelectItem>
                    <SelectItem value="policy_violation">مخالفة سياسة (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>النقاط</Label>
                <Input 
                  type="number" 
                  value={formData.points} 
                  onChange={(e) => setFormData(f => ({ ...f, points: parseInt(e.target.value) }))} 
                />
                <p className="text-xs text-gray-400 mt-1">استخدم قيمة سالبة للخصم</p>
              </div>
            </div>

            <div>
              <Label>السبب</Label>
              <Input 
                value={formData.reason} 
                onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                placeholder="مثال: إنجاز المشروع قبل الموعد"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setShowAddPoints(false)}>إلغاء</Button>
              <Button onClick={handleAddPoints} className="bg-amber-500 text-black hover:bg-amber-600">تأكيد</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Icon component helper
function PartyPopper(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" />
    </svg>
  )
}

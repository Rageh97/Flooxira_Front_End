"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Plus, CreditCard, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { getSalaries, createSalary, paySalary } from "@/lib/employeeManagementApi";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Salary {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  overtimePay: number;
  netSalary: number;
  status: string;
  paymentDate: string | null;
  currency: string;
  workDays: number;
  absentDays: number;
  employee: { id: number; name: string; email: string };
}

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function SalaryManagement() {
  const { getToken } = useAuth();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: ''
  });

  useEffect(() => {
    loadSalaries();
    loadEmployees();
  }, [filters]);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await getSalaries(token, filters);
      if (response.success) {
        setSalaries(response.salaries);
      }
    } catch (error) {
      console.error('Error loading salaries:', error);
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

  const handleCreateSalary = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await createSalary(token, formData);
      if (response.success) {
        toast.success('تم إنشاء كشف الراتب بنجاح');
        setShowCreateDialog(false);
        loadSalaries();
      } else {
        toast.error(response.message || 'خطأ في إنشاء كشف الراتب');
      }
    } catch (error) {
      toast.error('خطأ في إنشاء كشف الراتب');
    }
  };

  const handlePaySalary = async () => {
    if (!selectedSalary) return;
    
    try {
      const token = getToken();
      if (!token) return;

      const response = await paySalary(token, selectedSalary.id, paymentData);
      if (response.success) {
        toast.success('تم تأكيد دفع الراتب');
        setShowPayDialog(false);
        setSelectedSalary(null);
        loadSalaries();
      }
    } catch (error) {
      toast.error('خطأ في تأكيد الدفع');
    }
  };

  const totalSalaries = salaries.reduce((sum, s) => sum + parseFloat(String(s.netSalary)), 0);
  const paidCount = salaries.filter(s => s.status === 'paid').length;
  const pendingCount = salaries.filter(s => s.status !== 'paid').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-white">{totalSalaries.toLocaleString()} ر.س</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">مدفوع</p>
                <p className="text-2xl font-bold text-white">{paidCount} راتب</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-300">قيد الانتظار</p>
                <p className="text-2xl font-bold text-white">{pendingCount} راتب</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={String(filters.month)} onValueChange={(v) => setFilters(f => ({ ...f, month: parseInt(v) }))}>
          <SelectTrigger className="w-32 [&>span]:text-white">
            <SelectValue placeholder="الشهر" />
          </SelectTrigger>
          <SelectContent className="bg-secondry text-white">
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(filters.year)} onValueChange={(v) => setFilters(f => ({ ...f, year: parseInt(v) }))}>
          <SelectTrigger className="w-28 [&>span]:text-white">
            <SelectValue placeholder="السنة" />
          </SelectTrigger>
          <SelectContent className="bg-secondry text-white">
            {[2024, 2025, 2026].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)} className="mr-auto primary-button">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            كشف راتب جديد
          </div>
        </Button>
      </div>

      {/* Salaries Table */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            كشوفات الرواتب - {MONTHS[filters.month - 1]} {filters.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : salaries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد كشوفات رواتب</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الراتب الأساسي</TableHead>
                  <TableHead>المكافآت</TableHead>
                  <TableHead>الخصومات</TableHead>
                  <TableHead>صافي الراتب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{salary.employee.name}</p>
                        <p className="text-xs text-gray-400">{salary.workDays} يوم عمل</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{parseFloat(String(salary.baseSalary)).toLocaleString()}</TableCell>
                    <TableCell className="text-green-400">+{parseFloat(String(salary.bonuses)).toLocaleString()}</TableCell>
                    <TableCell className="text-red-400">-{parseFloat(String(salary.deductions)).toLocaleString()}</TableCell>
                    <TableCell className="text-white font-bold">{parseFloat(String(salary.netSalary)).toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_STYLES[salary.status]} border`}>
                        {salary.status === 'paid' ? 'مدفوع' : salary.status === 'pending' ? 'معلق' : salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {salary.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedSalary(salary); setShowPayDialog(true); }}
                        >
                          <CreditCard className="h-4 w-4 ml-1" />
                          دفع
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Salary Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء كشف راتب جديد</DialogTitle>
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
                <Label>الشهر</Label>
                <Select value={String(formData.month)} onValueChange={(v) => setFormData(f => ({ ...f, month: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>السنة</Label>
                <Input type="number" value={formData.year} onChange={(e) => setFormData(f => ({ ...f, year: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>الراتب الأساسي</Label>
              <Input type="number" value={formData.baseSalary} onChange={(e) => setFormData(f => ({ ...f, baseSalary: parseFloat(e.target.value) }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button className="primary-button after:bg-red-500" variant="ghost" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button className="primary-button after:bg-green-500" onClick={handleCreateSalary}>إنشاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Salary Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد دفع الراتب</DialogTitle>
          </DialogHeader>
          {selectedSalary && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-gray-400">الموظف: <span className="text-white">{selectedSalary.employee.name}</span></p>
                <p className="text-gray-400">المبلغ: <span className="text-white font-bold">{parseFloat(String(selectedSalary.netSalary)).toLocaleString()} ر.س</span></p>
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={paymentData.paymentMethod} onValueChange={(v) => setPaymentData(d => ({ ...d, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>رقم المرجع (اختياري)</Label>
                <Input value={paymentData.paymentReference} onChange={(e) => setPaymentData(d => ({ ...d, paymentReference: e.target.value }))} placeholder="رقم الحوالة أو الشيك" />
              </div>
              <div className="flex justify-end gap-2">
                <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setShowPayDialog(false)}>إلغاء</Button>
                <Button onClick={handlePaySalary} className="bg-green-600 hover:bg-green-700">تأكيد الدفع</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

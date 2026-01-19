"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, XCircle, Clock, FileText, Plus } from "lucide-react";
import { getLeaveRequests, processLeaveRequest, requestLeave } from "@/lib/employeeManagementApi";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const LEAVE_TYPES: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  emergency: 'طارئة',
  unpaid: 'بدون راتب',
  maternity: 'أمومة',
  other: 'أخرى',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'معلق', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  approved: { label: 'مقبول', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

export default function LeaveManagement() {
  const { getToken } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, [filterStatus]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await getLeaveRequests(token, { status: filterStatus });
      if (response.success) {
        setLeaves(response.leaves);
      }
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await apiFetch<any>('/api/employees?limit=1000', { authToken: token });
      if (response.success) setEmployees(response.employees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleRequestLeave = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await requestLeave(token, {
        ...formData,
        employeeId: parseInt(formData.employeeId)
      });

      if (response.success) {
        toast.success('تم تقديم طلب الإجازة بنجاح');
        setShowRequestDialog(false);
        loadLeaves();
      } else {
        toast.error(response.message || 'خطأ في تقديم الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تقديم الطلب');
    }
  };

  const handleProcess = async (id: number, action: 'approve' | 'reject') => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await processLeaveRequest(token, id, { action });
      if (response.success) {
        toast.success(`تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب بنجاح`);
        loadLeaves();
      }
    } catch (error) {
      toast.error('خطأ في معالجة الطلب');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">الكل</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="approved">مقبول</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowRequestDialog(true)} className="primary-button">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            طلب إجازة جديد
          </div>
        </Button>
      </div>

      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            سجل الإجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد طلبات إجازة</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>التواريخ</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => {
                  const statusInfo = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{leave.employee.name}</p>
                          <p className="text-xs text-gray-400">{leave.employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        {LEAVE_TYPES[leave.leaveType] || leave.leaveType}
                      </TableCell>
                      <TableCell className="text-white font-bold">
                        {leave.totalDays} أيام
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {leave.startDate} <span className="text-gray-500">إلى</span> {leave.endDate}
                      </TableCell>
                      <TableCell className="text-gray-400 max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} border`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 h-8 px-2"
                              onClick={() => handleProcess(leave.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-8 px-2"
                              onClick={() => handleProcess(leave.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل طلب إجازة</DialogTitle>
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

            <div>
              <Label>نوع الإجازة</Label>
              <Select value={formData.leaveType} onValueChange={(v) => setFormData(f => ({ ...f, leaveType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>من تاريخ</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>السبب</Label>
              <Input 
                value={formData.reason} 
                onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                placeholder="سبب الإجازة (اختياري)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button className="primary-button after:bg-red-500" variant="outline" onClick={() => setShowRequestDialog(false)}>إلغاء</Button>
              <Button className="primary-button after:bg-green-500" onClick={handleRequestLeave}>إرسال الطلب</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

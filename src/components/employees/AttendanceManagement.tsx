"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar,
  Filter,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { getAttendanceRecords, getAttendanceStats, updateAttendanceRecord } from "@/lib/employeeManagementApi";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  workHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  notes: string | null;
  employee: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  present: { label: 'حاضر', color: 'gradient-border text-green-400 border-green-500/30', icon: CheckCircle },
  absent: { label: 'غائب', color: 'gradient-border text-red-400 border-red-500/30', icon: XCircle },
  late: { label: 'متأخر', color: 'gradient-border text-amber-400 border-amber-500/30', icon: AlertTriangle },
  early_leave: { label: 'خروج مبكر', color: 'gradient-border text-orange-400 border-orange-500/30', icon: LogOut },
  half_day: { label: 'نصف يوم', color: 'gradient-border text-blue-400 border-blue-500/30', icon: Clock },
  leave: { label: 'إجازة', color: 'gradient-border text-purple-400 border-purple-500/30', icon: Calendar },
  holiday: { label: 'عطلة', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: Calendar },
};

export default function AttendanceManagement() {
  const { getToken } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all'
   });
  const [stats, setStats] = useState<any>(null);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [page, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const { status, ...otherFilters } = filters;
      const response = await getAttendanceRecords(token, {
        ...otherFilters,
        status: status === 'all' ? '' : status,
        page,
        limit: 20
      });

      if (response.success) {
        setRecords(response.attendance);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await getAttendanceStats(token, {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });

      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editRecord) return;
    
    try {
      const token = getToken();
      if (!token) return;

      const response = await updateAttendanceRecord(token, editRecord.id, {
        status: editRecord.status,
        notes: editRecord.notes
      });

      if (response.success) {
        toast.success('تم تحديث السجل بنجاح');
        setEditRecord(null);
        loadRecords();
      }
    } catch (error) {
      toast.error('خطأ في تحديث السجل');
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return '0 ساعة';
    if (hours < 1) {
      return `${Math.round(hours * 60)} دقيقة`;
    }
    return `${hours.toFixed(1)} ساعة`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="gradient-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.present || 0}</p>
              <p className="text-xs text-gray-200">حاضر</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.absent || 0}</p>
              <p className="text-xs text-gray-200">غائب</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="gradient-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-primary">تصفية:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                className="w-40"
              />
              <span className="text-gray-400">إلى</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                className="w-40"
              />
            </div>

            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-40  [&>span]:text-white">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent className="text-white bg-secondry" >
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                {/* <SelectItem value="late">متأخر</SelectItem> */}
                <SelectItem value="absent">غائب</SelectItem>
                {/* <SelectItem value="leave">إجازة</SelectItem> */}
              </SelectContent>
            </Select>

            {/* <Button  className="primary-button mr-auto" variant="secondary" size="sm" >
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 ml-2" />
              تصدير
              </div>
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            سجلات الحضور والانصراف
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد سجلات</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحضور</TableHead>
                  <TableHead>الانصراف</TableHead>
                  <TableHead>ساعات العمل</TableHead>
                  <TableHead>الحالة</TableHead>
                  {/* <TableHead>إجراءات</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const statusInfo = STATUS_LABELS[record.status] || STATUS_LABELS.present;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{record.employee.name}</p>
                          <p className="text-xs text-gray-400">{record.employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4 text-green-500" />
                          <span className="text-white">{formatTime(record.checkInTime)}</span>
                          {record.lateMinutes > 0 && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400">
                              +{record.lateMinutes} د
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-500" />
                          <span className="text-white">{formatTime(record.checkOutTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white">
                          {formatDuration(record.workHours)}
                          {record.overtimeHours > 0 && (
                            <span className="text-xs text-green-400 mr-1">
                              (+{formatDuration(record.overtimeHours)} إضافي)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} border`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditRecord(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                السابق
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">الموظف</p>
                <p className="text-white font-medium">{editRecord.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">التاريخ</p>
                <p className="text-white">{formatDate(editRecord.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">الحالة</p>
                <Select 
                  value={editRecord.status} 
                  onValueChange={(v) => setEditRecord({ ...editRecord, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">ملاحظات</p>
                <Input
                  value={editRecord.notes || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, notes: e.target.value })}
                  placeholder="أضف ملاحظة..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditRecord(null)}>إلغاء</Button>
                <Button onClick={handleUpdateRecord}>حفظ</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

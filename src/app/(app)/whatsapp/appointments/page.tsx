"use client";
import React from "react";
import { useAuth } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types
interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  serviceDescription?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  notes?: string;
  source: string;
  assignedTo?: number;
  price?: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  followUpDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
}

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
  serviceStats: Array<{ serviceType: string; count: number }>;
  priorityStats: Array<{ priority: string; count: number }>;
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [stats, setStats] = React.useState<AppointmentStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [filters, setFilters] = React.useState({
    status: '',
    priority: '',
    serviceType: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      window.location.href = '/sign-in';
      return;
    }
    loadAppointments();
    loadStats();
  }, [user, authLoading, currentPage, filters]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await fetch(`/api/appointments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/appointments/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage('تم تحديث حالة الموعد بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleDelete = async (appointmentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage('تم حذف الموعد بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadAppointments();
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      );

      const response = await fetch(`/api/appointments/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointments_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting appointments:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no_show': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">إدارة المواعيد</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="primary-button after:bg-[#131240] text-white px-4 py-2 rounded"
          >
            إضافة موعد جديد
          </button>
          <button
            onClick={handleExport}
            className="primary-button after:bg-[#131240] text-white px-4 py-2 rounded"
          >
            تصدير إلى Excel
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <card className="gradient-border flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-semibold text-white mb-2">إجمالي المواعيد</h3>
            <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
          </card>
          <card className="gradient-border flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-semibold text-white mb-2">مواعيد اليوم</h3>
            <p className="text-3xl font-bold text-green-500">{stats.today}</p>
          </card>
          <card className="gradient-border flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-semibold text-white mb-2">مواعيد قادمة</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.upcoming}</p>
          </card>
          <card className="gradient-border flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-semibold text-white mb-2">في الانتظار</h3>
            <p className="text-3xl font-bold text-orange-500">{stats.pending}</p>
          </card>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#01191040] p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">فلترة المواعيد</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 gradient-border p-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">البحث</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
              placeholder="اسم العميل، رقم الهاتف، نوع الخدمة..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
            >
              <option value="">جميع الحالات</option>
              <option value="pending">في الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="no_show">لم يحضر</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">الأولوية</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
            >
              <option value="">جميع الأولويات</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">من تاريخ</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">نوع الخدمة</label>
            <input
              type="text"
              value={filters.serviceType}
              onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
              className="w-full border-[0.5px] rounded-lg bg-[#01191040] border-blue-300 outline-none rounded px-3 py-2 text-white "
              placeholder="نوع الخدمة..."
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="gradient-border rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4   mb-2">
          <h3 className="text-lg font-medium text-white">
            المواعيد ({appointments.length} موعد)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table >
            <TableHeader >
              <TableRow>
                <TableHead >العميل</TableHead>
                <TableHead >الخدمة</TableHead>
                <TableHead >التاريخ</TableHead>
                <TableHead >الوقت</TableHead>
                <TableHead >الحالة</TableHead>
                <TableHead >الأولوية</TableHead>
                <TableHead >الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      <div className="font-medium">{appointment.customerName}</div>
                      <div className="text-gray-400">{appointment.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      <div className="font-medium">{appointment.serviceType}</div>
                      {appointment.serviceDescription && (
                        <div className="text-gray-400 text-xs truncate max-w-xs">
                          {appointment.serviceDescription}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(appointment.appointmentDate).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {appointment.appointmentTime}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status === 'pending' && 'في الانتظار'}
                      {appointment.status === 'confirmed' && 'مؤكد'}
                      {appointment.status === 'completed' && 'مكتمل'}
                      {appointment.status === 'cancelled' && 'ملغي'}
                      {appointment.status === 'no_show' && 'لم يحضر'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(appointment.priority)}`}>
                      {appointment.priority === 'low' && 'منخفضة'}
                      {appointment.priority === 'medium' && 'متوسطة'}
                      {appointment.priority === 'high' && 'عالية'}
                      {appointment.priority === 'urgent' && 'عاجلة'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className="text-xs bg-transparent border border-white/60 rounded px-2 py-1 text-white"
                      >
                        <option value="pending">في الانتظار</option>
                        <option value="confirmed">مؤكد</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                        <option value="no_show">لم يحضر</option>
                      </select>
                      <button
                        onClick={() => {
                          setEditingAppointment(appointment);
                          setShowEditModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        حذف
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  صفحة <span className="font-medium">{currentPage}</span> من <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




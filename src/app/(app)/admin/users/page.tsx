"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllUsers } from "@/lib/api";
import * as XLSX from 'xlsx';
import { Download } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function UsersAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const usersPerPage = 10;
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    getAllUsers(token, currentPage, usersPerPage)
      .then((res) => {
        setUsers(res.users);
        setTotalPages(res.totalPages || 1);
        setTotalUsers(res.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUserClick = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleExportUsers = async () => {
    if (!token) return;
    
    try {
      setIsExporting(true);
      // Fetch all users with a large limit
      const response = await getAllUsers(token, 1, 100000);
      
      if (!response.success) {
        toast.error('فشل في جلب المستخدمين للتصدير');
        return;
      }

      const allUsers = response.users;
      
      // Filter users with phone numbers and format data for Excel
      const exportData = allUsers
        .filter(user => user.phone)
        .map(user => ({
          'رقم الهاتف': user.phone
        }));

      if (exportData.length === 0) {
        toast.error('لا يوجد مستخدمين لديهم أرقام هواتف للتصدير');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المستخدمين');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      XLSX.writeFile(workbook, `users_phones_${timestamp}.xlsx`);
      
      toast.success(`تم تصدير ${exportData.length} رقم بنجاح`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل المستخدمين...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-red-400">خطأ: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">إدارة المستخدمين</h2>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportUsers} 
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'جاري التصدير...' : 'تصدير الأرقام'}
          </Button>
          <span className="text-sm text-gray-300">{totalUsers} إجمالي المستخدمين</span>
        </div>
      </div>
      
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold">جميع المستخدمين</h3>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-gray-300">لم يتم العثور على مستخدمين.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="text-center">
                  <tr className="border-b border-gray-600">
                    <th className=" py-3 px-4 font-medium text-white">المعرف</th>
                    <th className=" py-3 px-4 font-medium text-white">الاسم</th>
                    <th className=" py-3 px-4 font-medium text-white">البريد الإلكتروني</th>
                    <th className=" py-3 px-4 font-medium text-white">الهاتف</th>
                    <th className=" py-3 px-4 font-medium text-white">الدور</th>
                    <th className=" py-3 px-4 font-medium text-white">الحالة</th>
                    <th className=" py-3 px-4 font-medium text-white">تاريخ الإنشاء</th>
                    <th className=" py-3 px-4 font-medium text-white">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b border-gray-600 hover:bg-gray-700/30 cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <td className="py-3 px-4 text-sm text-gray-300">{user.id}</td>
                      <td className="py-3 px-4 text-sm font-medium text-white">
                        {user.name || 'لا يوجد اسم'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{user.phone || 'لا يوجد هاتف'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{formatDate(user.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-card border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                عرض {((currentPage - 1) * usersPerPage) + 1} - {Math.min(currentPage * usersPerPage, totalUsers)} من {totalUsers} مستخدم
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

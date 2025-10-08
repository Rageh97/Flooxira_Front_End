"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAllUsers } from "@/lib/api";

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    getAllUsers(token)
      .then((res) => setUsers(res.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <span className="text-sm text-gray-300">{users.length} إجمالي المستخدمين</span>
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
                    <tr key={user.id} className="border-b border-gray-600 hover:bg-gray-700/30">
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
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

type Review = {
  id: number;
  userId: number;
  rating: number;
  title: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  processedAt?: string;
  processedBy?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name?: string;
    email: string;
  };
  processedByUser?: {
    id: number;
    name?: string;
    email: string;
  };
};

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const { showSuccess, showError } = useToast();

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadReviews();
  }, [token]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      } else {
        setError(data.message || 'Failed to load reviews');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (review: Review, action: 'approve' | 'reject') => {
    setSelectedReview(review);
    setPendingAction(action);
    setAdminNotes(review.adminNotes || '');
    setActionModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedReview || !pendingAction) return;
    
    try {
      const response = await fetch(`/api/reviews/admin/${selectedReview.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: pendingAction === 'approve' ? 'approved' : 'rejected',
          adminNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        setActionModalOpen(false);
        setSelectedReview(null);
        setPendingAction(null);
        setAdminNotes('');
        loadReviews();
        showSuccess(`تم ${pendingAction === 'approve' ? 'الموافقة على' : 'رفض'} التقييم بنجاح!`);
      } else {
        showError('خطأ في تحديث التقييم', data.message);
      }
    } catch (e: any) {
      showError('خطأ في تحديث التقييم', e.message);
    }
  };

  const handleDelete = async (reviewId: number) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
      setPendingAction('delete');
      setActionModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedReview) return;
    
    try {
      const response = await fetch(`/api/reviews/admin/${selectedReview.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        loadReviews();
        showSuccess('تم حذف التقييم بنجاح!');
        setActionModalOpen(false);
        setSelectedReview(null);
        setPendingAction(null);
      } else {
        showError('خطأ في حذف التقييم', data.message);
      }
    } catch (e: any) {
      showError('خطأ في حذف التقييم', e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'معلق';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.status === filter;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-300">جاري تحميل التقييمات...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة التقييمات</h1>
          <p className="text-sm text-gray-300">مراجعة وإدارة تقييمات العملاء</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-300">إجمالي التقييمات</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-300">معلق</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-300">موافق عليه</p>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-300">مرفوض</p>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="bg-card border-none">
        <CardContent className="p-4">
          <div className="flex space-x-2 rtl:space-x-reverse">
            {[
              { key: 'all', label: 'الكل', count: stats.total },
              { key: 'pending', label: 'معلق', count: stats.pending },
              { key: 'approved', label: 'موافق عليه', count: stats.approved },
              { key: 'rejected', label: 'مرفوض', count: stats.rejected },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="bg-card border-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    التقييم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    التعليق
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {review.user.name || 'مستخدم'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {review.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-400">({review.rating}/5)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white max-w-xs truncate">
                        {review.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {review.comment || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(review.status)}>
                        {getStatusIcon(review.status)}
                        <span className="mr-1">{getStatusText(review.status)}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(review.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {review.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(review, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(review, 'reject')}
                              className="text-xs px-2 py-1"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              رفض
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(review.id)}
                          className="text-xs px-2 py-1"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">لا توجد تقييمات</h3>
              <p className="text-gray-300">
                {filter !== 'all' 
                  ? `لا توجد تقييمات بالحالة "${getStatusText(filter)}"` 
                  : 'لا توجد تقييمات متاحة حالياً'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approve' ? 'الموافقة على التقييم' : 
               pendingAction === 'reject' ? 'رفض التقييم' : 'حذف التقييم'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approve' 
                ? 'هل أنت متأكد من الموافقة على هذا التقييم؟ سيتم عرضه للجمهور.'
                : pendingAction === 'reject'
                ? 'هل أنت متأكد من رفض هذا التقييم؟ لن يتم عرضه للجمهور.'
                : 'هل أنت متأكد من حذف هذا التقييم؟ هذا الإجراء لا يمكن التراجع عنه.'
              }
            </DialogDescription>
          </DialogHeader>
          {pendingAction !== 'delete' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">ملاحظات الأدمن (اختياري)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات حول هذا التقييم..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActionModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={pendingAction === 'delete' ? confirmDelete : confirmAction}
              variant={pendingAction === 'approve' ? 'default' : 'destructive'}
            >
              {pendingAction === 'approve' ? 'موافقة' : 
               pendingAction === 'reject' ? 'رفض' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



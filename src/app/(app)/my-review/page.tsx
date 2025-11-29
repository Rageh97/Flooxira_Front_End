"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Send, 
  CheckCircle, 
  Clock,
  XCircle,
  MessageSquare,
  ThumbsUp
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { API_URL } from "@/lib/api";

type Review = {
  id: number;
  userId: number;
  rating: number;
  title: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function MyReviewPage() {
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [token, setToken] = useState<string>("");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showSuccess, showError } = useToast();

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    loadExistingReview();
  }, [token]);

  const loadExistingReview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        // Find user's review
        const userReview = data.reviews.find((review: Review) => review.userId === parseInt(localStorage.getItem('user_id') || '0'));
        if (userReview) {
          setExistingReview(userReview);
          setRating(userReview.rating);
          setTitle(userReview.title);
          setComment(userReview.comment || '');
        }
      }
    } catch (e) {
      console.error('Error loading existing review:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || !title.trim()) {
      showError('خطأ', 'يرجى إدخال التقييم والعنوان');
      return;
    }

    if (rating < 1 || rating > 5) {
      showError('خطأ', 'يرجى اختيار تقييم صحيح');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim() || undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        showSuccess('تم إرسال التقييم بنجاح!');
        setExistingReview({
          id: data.review.id,
          userId: data.review.userId,
          rating: data.review.rating,
          title: data.review.title,
          comment: data.review.comment,
          status: data.review.status,
          createdAt: data.review.createdAt,
          updatedAt: data.review.updatedAt
        });
      } else {
        showError('خطأ في إرسال التقييم', data.message);
      }
    } catch (e: any) {
      showError('خطأ في إرسال التقييم', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => interactive && setRating(i + 1)}
        className={`w-8 h-8 transition-colors ${
          interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
        }`}
        disabled={!interactive}
      >
        <Star
          className={`w-full h-full ${
            i < currentRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      </button>
    ));
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
        return 'تم الموافقة عليه';
      case 'rejected':
        return 'تم رفضه';
      case 'pending':
        return 'قيد المراجعة';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">تقييم الخدمة</h1>
        <p className="text-gray-300">شاركنا رأيك في خدماتنا</p>
      </div>

      {/* Existing Review Status */}
      {existingReview && (
        <Card className="gradient-border border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">تقييمك الحالي</h3>
              <Badge className={getStatusColor(existingReview.status)}>
                {getStatusIcon(existingReview.status)}
                <span className="mr-1">{getStatusText(existingReview.status)}</span>
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {renderStars(existingReview.rating)}
                <span className="text-gray-400">({existingReview.rating}/5)</span>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">{existingReview.title}</h4>
                {existingReview.comment && (
                  <p className="text-gray-300">{existingReview.comment}</p>
                )}
              </div>
              
              <div className="text-sm text-gray-400">
                تاريخ الإرسال: {new Date(existingReview.createdAt).toLocaleDateString('en-US')}
              </div>
              
              {existingReview.adminNotes && (
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-300">
                    <strong>ملاحظات الإدارة:</strong> {existingReview.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {!existingReview && (
        <Card className="gradient-border border-none">
          <CardHeader>
            <CardTitle className="text-white">اكتب تقييمك</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="text-white mb-3 block">التقييم *</Label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  {renderStars(rating, true)}
                  <span className="text-gray-400 mr-2">({rating}/5)</span>
                </div>
                {rating > 0 && (
                  <p className="text-sm text-green-300 mt-2">
                    {rating === 1 && 'سيء جداً'}
                    {rating === 2 && 'سيء'}
                    {rating === 3 && 'متوسط'}
                    {rating === 4 && 'جيد'}
                    {rating === 5 && 'ممتاز'}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-white">عنوان التقييم *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="اكتب عنواناً مختصراً لتقييمك"
                  className="mt-2 text-white"
                  maxLength={255}
                />
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment" className="text-white">التعليق (اختياري)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تفاصيل أكثر عن تجربتك مع الخدمة..."
                  className="mt-2 bg-[#011910] text-white"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-green-400 mt-1">
                  {comment.length}/1000 حرف
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !rating || !title.trim()}
                className="w-full primary-button w-50"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    {/* <Send className="w-4 h-4 mr-2" /> */}
                    إرسال التقييم
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="gradient-border border-none">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <ThumbsUp className="w-6 h-6 text-blue-400 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">معلومات مهمة</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                {/* <li>• سيتم مراجعة تقييمك من قبل فريق الإدارة قبل النشر</li> */}
                <li>• يمكنك إرسال تقييم واحد فقط</li>
                <li>• التقييمات المنشورة ستظهر في صفحة "تقييمات عملائنا"</li>
                <li>• نحن نقدر آراءكم ونعمل على تحسين خدماتنا بناءً عليها</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



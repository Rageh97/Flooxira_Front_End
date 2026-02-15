"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  User, 
  MessageSquare,
  ThumbsUp,
  Quote,
  Award,
  Users
} from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/ReviewForm";

type Review = {
  id: number;
  userId: number;
  rating: number;
  title: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: {
    id: number;
    name?: string;
    email: string;
  };
};

type ReviewStats = {
  totalReviews: number;
  averageRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const reviewsPerPage = 9;

  useEffect(() => {
    loadReviews();
    loadStats();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [currentPage]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/reviews?page=${currentPage}&limit=${reviewsPerPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setTotalPages(data.totalPages || 1);
        setTotalReviews(data.total || 0);
      } else {
        setError(data.message || 'Failed to load reviews');
      }
    } catch (e: any) {
      console.error('Error loading reviews:', e);
      setError(e.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e: any) {
      console.error('Error loading stats:', e);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }[size];

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClass} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">جاري تحميل التقييمات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-none">
          <CardContent className="p-8 text-center">
            <p className="text-red-400">خطأ: {error}</p>
            <Button onClick={() => { loadReviews(); loadStats(); }} className="mt-4">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">تقييمات عملائنا</h1>
        <p className="text-gray-300">ما يقوله عملاؤنا عن خدماتنا</p>
      </div>

      {/* Stats Section */}
      {stats && (
        <Card className="gradient-border border-none">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating || 0), 'lg')}
                </div>
                <p className="text-gray-300">متوسط التقييم</p>
                <p className="text-sm text-gray-400">{stats.totalReviews} تقييم</p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">توزيع التقييمات</h3>
                <div className="space-y-2">
                  {[
                    { stars: 5, count: stats.fiveStars, label: '5 نجوم' },
                    { stars: 4, count: stats.fourStars, label: '4 نجوم' },
                    { stars: 3, count: stats.threeStars, label: '3 نجوم' },
                    { stars: 2, count: stats.twoStars, label: '2 نجوم' },
                    { stars: 1, count: stats.oneStar, label: '1 نجمة' },
                  ].map(({ stars, count, label }) => (
                    <div key={stars} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <span className="text-sm text-gray-300 w-16">{label}</span>
                      <div className="flex-1 bg-gray-300 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getRatingPercentage(count)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="bg-card  border-none hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {review.user.name || 'عميل'}
                    </h3>
                    <p className="text-sm text-gray-400">عميل موثق</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {renderStars(review.rating, 'sm')}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-400">({review.rating}/5)</span>
                </div>
                <h4 className="font-medium text-white mb-2">{review.title}</h4>
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="relative">
                  <Quote className="absolute -top-2 -right-2 w-6 h-6 text-primary/20" />
                  <p className="text-gray-300 text-sm italic leading-relaxed">
                    "{review.comment}"
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{new Date(review.createdAt).toLocaleDateString('en-US')}</span>
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <ThumbsUp className="w-4 h-4" />
                    <span>مفيد</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card className="gradient-border border-none">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">لا توجد تقييمات</h3>
            <p className="text-gray-300">لم يتم نشر أي تقييمات بعد</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-card  border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                عرض {((currentPage - 1) * reviewsPerPage) + 1} - {Math.min(currentPage * reviewsPerPage, totalReviews)} من {totalReviews} تقييم
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

      {/* Call to Action */}
      <Card className="gradient-border border-none">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">شاركنا رأيك</h3>
          <p className="text-gray-300 mb-6">
            نحن نقدر آراء عملائنا ونعمل باستمرار على تحسين خدماتنا
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="primary-button mx-auto flex items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                اترك تقييمك
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide border-none">
              <ReviewForm />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}



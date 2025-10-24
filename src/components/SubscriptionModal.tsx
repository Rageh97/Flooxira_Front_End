"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { CreditCard, Gift, Wallet, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { Plan, uploadReceipt } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSubscribe: (paymentMethod: 'usdt' | 'coupon', data: any) => void;
  token: string;
}

export function SubscriptionModal({ isOpen, onClose, plan, onSubscribe, token }: SubscriptionModalProps) {
  const [step, setStep] = useState<'method' | 'usdt' | 'coupon'>('method');
  const [usdtData, setUsdtData] = useState({ walletAddress: '', receiptFile: null as File | null });
  const [couponData, setCouponData] = useState({ code: '', discountKeyword: '' });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();
  
  // Discount preview state
  const [discountInfo, setDiscountInfo] = useState<{ type: string; value: number; finalPrice: number } | null>(null);
  const [verifyingDiscount, setVerifyingDiscount] = useState(false);

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
  };

  const { price, period } = formatPrice(plan.priceCents, plan.interval);
  
  // Calculate final price with discount
  const getFinalPrice = () => {
    if (!discountInfo) return price;
    return `$${discountInfo.finalPrice.toFixed(2)}`;
  };
  
  // Auto-verify discount when coupon code is entered
  useEffect(() => {
    if (step === 'coupon' && couponData.code.trim().length >= 4) {
      const timer = setTimeout(async () => {
        setVerifyingDiscount(true);
        try {
          // Build query parameters
          const params = new URLSearchParams({
            code: couponData.code,
            planId: plan.id.toString()
          });
          
          if (couponData.discountKeyword.trim()) {
            params.append('discountKeyword', couponData.discountKeyword.trim());
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/coupons/verify?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const result = await response.json();
          
          if (result.success && result.valid) {
            const originalPrice = plan.priceCents / 100;
            const finalPrice = result.finalPrice || originalPrice;
            
            setDiscountInfo({
              type: result.coupon.discountType,
              value: result.appliedDiscount || result.coupon.discountValue,
              finalPrice: finalPrice
            });
          } else {
            // Clear discount if invalid
            setDiscountInfo(null);
          }
        } catch (error) {
          console.error('Auto verify discount error:', error);
          setDiscountInfo(null);
        } finally {
          setVerifyingDiscount(false);
        }
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timer);
    } else if (couponData.code.trim().length < 4) {
      // Clear discount if code is too short
      setDiscountInfo(null);
    }
  }, [couponData.code, couponData.discountKeyword, step, plan.id, plan.priceCents, token]);

  const handleMethodSelect = (method: 'usdt' | 'coupon') => {
    if (method === 'usdt') {
      setStep('usdt');
    } else {
      setStep('coupon');
    }
  };

  const handleUSDTSubmit = async () => {
    if (!usdtData.walletAddress.trim() || !usdtData.receiptFile) return;
    
    setLoading(true);
    try {
      await onSubscribe('usdt', { 
        walletAddress: usdtData.walletAddress,
        receiptFile: usdtData.receiptFile 
      });
      onClose();
    } catch (error) {
      console.error('USDT subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCouponSubmit = async () => {
    if (!couponData.code.trim()) return;
    
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        code: couponData.code,
        planId: plan.id.toString()
      });
      
      if (couponData.discountKeyword.trim()) {
        params.append('discountKeyword', couponData.discountKeyword.trim());
      }
      
      // Try to validate and activate with coupon/discount code
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/subscription-requests/validate-coupon?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      // If activated successfully (either subscription coupon or discount code)
      if (result.success && result.activated) {
        showSuccess('تم تفعيل الاشتراك بنجاح!', 'تم تفعيل اشتراكك في الباقة.');
        onClose();
        window.location.reload(); // Reload to update subscription status
        return;
      }
      
      // If validation failed
      showError('خطأ في الكود', result.message || 'الكود غير صحيح');
    } catch (error) {
      console.error('Coupon submission error:', error);
      showError('خطأ في التحقق من الكود', 'يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('method');
    setUsdtData({ walletAddress: '', receiptFile: null });
    setCouponData({ code: '', discountKeyword: '' });
    setLoading(false);
    setDiscountInfo(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CreditCard className="h-5 w-5" />
            اشتراك في {plan.name}
          </DialogTitle>
          <DialogDescription>
            اختر طريقة الدفع المناسبة لك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-800">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {discountInfo ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-gray-500 line-through">{price}</span>
                    <span className="text-xs text-gray-500">{period}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{getFinalPrice()}</span>
                    <span className="text-sm text-green-600">{period}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      خصم {discountInfo.type === 'percentage' ? `${discountInfo.value}%` : `$${discountInfo.value}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600">{price}</span>
                  <span className="text-sm text-green-600">{period}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 1: Payment Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">اختر طريقة الدفع</h3>
              
              <div className="grid gap-3">
                <Button
                  variant="secondary"
                  className="w-full h-auto p-4 justify-start hover:bg-green-50 hover:border-green-300"
                  onClick={() => handleMethodSelect('usdt')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">الدفع بـ USDT</h4>
                      <p className="text-sm text-gray-600">ادفع باستخدام محفظة USDT</p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="secondary"
                  className="w-full h-auto p-4 justify-start hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => handleMethodSelect('coupon')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gift className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">استخدام قسيمة</h4>
                      <p className="text-sm text-gray-600">ادخل كود القسيمة للتفعيل</p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: USDT Payment */}
          {step === 'usdt' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('method')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← العودة
                </button>
                <h3 className="text-lg font-semibold text-gray-800">الدفع بـ USDT</h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">معلومات المحفظة</span>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  العنوان: <code className="bg-green-100 px-2 py-1 rounded text-xs">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</code>
                </p>
                <p className="text-xs text-green-600">
                  الشبكة: TRC20 | المبلغ: {price} {period}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-address">عنوان محفظتك</Label>
                <Input
                  id="wallet-address"
                  placeholder="أدخل عنوان محفظة USDT الخاصة بك"
                  value={usdtData.walletAddress}
                  onChange={(e) => setUsdtData({ ...usdtData, walletAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>صورة إيصال الدفع</Label>
                <FileUpload
                  onFileSelect={(file) => setUsdtData({ ...usdtData, receiptFile: file })}
                  accept="image/*"
                  maxSize={5}
                />
                {usdtData.receiptFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    تم اختيار الملف: {usdtData.receiptFile.name}
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">جاهز للإرسال:</p>
                    <p>سيتم إرسال طلبك مع صورة الإيصال مباشرة</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleUSDTSubmit}
                disabled={loading || !usdtData.walletAddress.trim() || !usdtData.receiptFile}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال طلب الاشتراك مع الإيصال'}
              </Button>
            </div>
          )}

          {/* Step 3: Coupon Payment */}
          {step === 'coupon' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('method')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← العودة
                </button>
                <h3 className="text-lg font-semibold text-gray-800">استخدام قسيمة</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-code">أدخل كود القسيمة</Label>
                <div className="relative">
                  <Input
                    id="coupon-code"
                    placeholder="أدخل كود القسيمة"
                    value={couponData.code}
                    onChange={(e) => setCouponData({ ...couponData, code: e.target.value })}
                  />
                  {verifyingDiscount && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-keyword">أدخل كود الخصم إذا كان لديك كود الخصم</Label>
                <Input
                  id="discount-keyword"
                  placeholder="أدخل كود الخصم"
                  value={couponData.discountKeyword}
                  onChange={(e) => setCouponData({ ...couponData, discountKeyword: e.target.value })}
                />
                <p className="text-xs text-gray-500">أدخل كود الخصم الكامل مع كلمة الخصم في النهاية</p>
              </div>

              {discountInfo && couponData.discountKeyword ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">تم تطبيق كود الخصم!</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">السعر الأصلي:</span>
                      <span className="line-through text-gray-500">{price} {period}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">الخصم:</span>
                      <span className="text-orange-600 font-medium">
                        {discountInfo.type === 'percentage' 
                          ? `${discountInfo.value}%` 
                          : `$${discountInfo.value}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-base pt-2 border-t border-green-300">
                      <span className="text-gray-800 font-semibold">السعر بعد الخصم:</span>
                      <span className="text-green-700 font-bold text-lg">{getFinalPrice()} {period}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Gift className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">💡 يمكنك استخدام:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>قسيمة اشتراك:</strong> تفعل الباقة مباشرة بدون دفع</li>
                        <li><strong>كود خصم:</strong> يفعل الباقة بسعر مخفض مباشرة</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCouponSubmit}
                disabled={loading || !couponData.code.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'جاري التحقق...' : 'تفعيل الاشتراك'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

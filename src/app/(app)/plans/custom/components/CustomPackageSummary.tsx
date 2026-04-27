"use client";
import { memo, useState, useCallback } from "react";
import {
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  CreditCard,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { initiateEdfaPayment, type PaymentBreakdownItem, type SelectedFeature } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

type BreakdownItem = PaymentBreakdownItem;

type CustomPackageSummaryProps = {
  totalPrice: number;
  breakdownItems: BreakdownItem[];
  selectedCount: number;
  /** Raw feature selections – forwarded to the backend for price validation */
  selections: SelectedFeature[];
  onRequireAuth?: () => void;
};

// ─── component ────────────────────────────────────────────────────────────────

function CustomPackageSummaryComponent({
  totalPrice,
  breakdownItems,
  selectedCount,
  selections,
  onRequireAuth,
}: CustomPackageSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── payment handler ────────────────────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (loading || selectedCount === 0) return;

    setError(null);
    setLoading(true);

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || ""
        : "";

      if (!token) {
        setLoading(false);
        if (onRequireAuth) {
          onRequireAuth();
        } else {
          setError("يجب تسجيل الدخول أولاً لإتمام الدفع.");
        }
        return;
      }

      const result = await initiateEdfaPayment(token, {
        selectedFeatures: selections,
        totalPrice,
        breakdownItems,
      });

      if (result.success && result.redirectUrl) {
        // Redirect the whole page to EdfaPay checkout
        window.location.href = result.redirectUrl;
      } else {
        setError("تعذّر بدء عملية الدفع. يرجى المحاولة مجدداً.");
      }
    } catch (e: any) {
      console.error("[Checkout] initiateEdfaPayment error:", e);
      setError(e?.message || "حدث خطأ أثناء الاتصال ببوابة الدفع.");
    } finally {
      setLoading(false);
    }
  }, [loading, selectedCount, selections, totalPrice, breakdownItems]);

  // ── hide bar if nothing selected ──────────────────────────────────────────
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-50 w-full pointer-events-none mt-auto">
      <div className="max-w-7xl mx-auto px-4 pb-4 pointer-events-auto">
        <div
          className={`
            rounded-2xl border border-primary/30 gradient-border backdrop-blur-xl 
            shadow-2xl shadow-primary/10 transition-all duration-300
            ${expanded ? "max-h-[70vh]" : "max-h-[110px]"}
          `}
        >
          {/* ── error banner ───────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 rounded-t-2xl">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mr-auto text-[10px] text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── expandable breakdown ────────────────────────────────────────── */}
          {expanded && (
            <div className="p-4 pb-0 bg-secondry space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-white">تفاصيل باقتك المخصصة</h3>
              </div>

              {breakdownItems.map((item) => (
                <div
                  key={item.featureKey}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{item.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">
                        السعر الأساسي: {item.basePrice} ريال
                      </span>
                      {item.aiPrice > 0 && (
                        <>
                          <span className="text-[10px] text-gray-600">•</span>
                          <span className="text-[10px] text-purple-400">
                            + {item.aiCount.toLocaleString()} {item.aiUnit} = {item.aiPrice} ريال
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mr-3">
                    <span className="text-sm font-bold text-primary">{item.totalPrice}</span>
                    <span className="text-[10px] text-gray-400">ريال</span>
                  </div>
                </div>
              ))}

              <div className="h-px bg-white/10 my-2" />
            </div>
          )}

          {/* ── main bar ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between p-4">
            {/* Toggle details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-fixed-40 border-primary flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                {/* Badge */}
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{selectedCount}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{selectedCount} ميزة مختارة</p>
                <div className="flex items-center gap-1 text-xs text-primary group-hover:underline">
                  {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </div>
            </button>

            {/* Center: Total price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400">الإجمالي:</span>
              <span className="text-2xl font-bold text-white">{totalPrice}</span>
              <span className="text-sm text-gray-400">ريال/شهر</span>
            </div>

            {/* Checkout button */}
            <button
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={loading || selectedCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 primary-button text-white rounded-xl font-medium 
                         hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all 
                         shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                 <div className="flex items-center gap-2">
                   <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري التوجيه...</span>
                 </div>
                </>
              ) : (
                <>
                <div className="flex items-center gap-2"> 
                  <CreditCard className="h-4 w-4" />
                  <span>إتمام الدفع</span>
                </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CustomPackageSummary = memo(CustomPackageSummaryComponent);
export default CustomPackageSummary;

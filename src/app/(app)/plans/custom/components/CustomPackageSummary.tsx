"use client";
import { memo, useState } from "react";
import { ShoppingCart, ChevronUp, ChevronDown, CreditCard, Sparkles } from "lucide-react";

type BreakdownItem = {
  featureKey: string;
  label: string;
  basePrice: number;
  aiPrice: number;
  totalPrice: number;
  aiCount: number;
  aiUnit: string;
};

type CustomPackageSummaryProps = {
  totalPrice: number;
  breakdownItems: BreakdownItem[];
  selectedCount: number;
};

function CustomPackageSummaryComponent({
  totalPrice,
  breakdownItems,
  selectedCount
}: CustomPackageSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-50 w-full pointer-events-none mt-auto">
      <div className="max-w-7xl mx-auto px-4 pb-4 pointer-events-auto">
        <div
          className={`
            rounded-2xl border border-primary/30 gradient-border backdrop-blur-xl 
            shadow-2xl shadow-primary/10 transition-all duration-300
            ${expanded ? "max-h-[70vh]" : "max-h-[90px]"}
          `}
        >
          {/* Expandable breakdown */}
          {expanded && (
            <div className="p-4 pb-0 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-300">
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

          {/* Main bar */}
          <div className="flex items-center justify-between p-4">
            {/* Left: Toggle details */}
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
                <p className="text-xs text-gray-400">
                  {selectedCount} ميزة مختارة
                </p>
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

            {/* Right: Checkout button */}
            <button
              className="flex items-center gap-2 px-6 py-2.5 primary-button text-white rounded-xl font-medium hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              onClick={() => {
                // TODO: Integrate with PayTabs payment gateway
                alert("سيتم ربط بوابة الدفع PayTabs قريباً");
              }}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>إتمام الدفع</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CustomPackageSummary = memo(CustomPackageSummaryComponent);
export default CustomPackageSummary;

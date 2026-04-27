"use client";
import { memo } from "react";
import { Check, Minus, Plus, Bot, Users } from "lucide-react";
import type { FeatureDefinition } from "../page";
import type { CustomPackagePricing } from "@/lib/api";

type FeatureCardProps = {
  feature: FeatureDefinition;
  pricing: CustomPackagePricing;
  selected: boolean;
  aiMessageBundles: number;
  onToggle: () => void;
  onBundlesChange: (bundles: number) => void;
};

function FeatureCardComponent({
  feature,
  pricing,
  selected,
  aiMessageBundles,
  onToggle,
  onBundlesChange
}: FeatureCardProps) {
  const basePrice = Number(pricing[feature.priceField]) || 0;

  // Calculate AI price
  let aiPrice = 0;
  let aiCount = 0;
  let bundleSize = 0;
  let pricePerBundle = 0;

  if (feature.hasAiMessages && feature.aiPriceField && feature.aiBundleField) {
    pricePerBundle = Number(pricing[feature.aiPriceField]) || 0;
    bundleSize = Number(pricing[feature.aiBundleField]) || 1;
    aiPrice = pricePerBundle * aiMessageBundles;
    aiCount = bundleSize * aiMessageBundles;
  }

  const totalFeaturePrice = basePrice + aiPrice;

  return (
    <div
      className={`
        relative rounded-2xl border transition-all duration-300 overflow-hidden
        ${selected 
          ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/10" 
          : "border-white/10 bg-card hover:border-white/20"
        }
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 left-3 z-10">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Main clickable area */}
      <button
        onClick={onToggle}
        className="w-full text-right p-4 pb-3 focus:outline-none"
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-2">
          <div className={`
            p-2 rounded-xl transition-all w-12 h-12 flex items-center justify-center
            ${selected ? "bg-white/10" : "bg-white/5"}
          `}>
            <img 
              src={feature.icon} 
              alt={feature.label} 
              className="w-10 h-10 object-contain block"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight">{feature.label}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{feature.description}</p>
          </div>
        </div>

        {/* Extra info (like posts count) */}
        {feature.extraField && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-300">
            <span className="text-primary font-bold">{pricing[feature.extraField]?.toString() || '0'}</span>
            <span>{feature.extraLabel}</span>
          </div>
        )}

        {/* Base Price */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className={`text-lg font-bold ${selected ? "text-white" : "text-gray-300"}`}>
            {basePrice}
          </span>
          <span className="text-xs text-gray-400">ريال</span>
        </div>
      </button>

      {/* AI Messages Section - Only shows when selected & feature has AI */}
      {selected && feature.hasAiMessages && feature.aiPriceField && feature.aiBundleField && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-white/10" />
          
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-3">
            {/* AI label or Unit label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {feature.key === 'employeeManagement' ? (
                  <Users className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-purple-400" />
                )}
                <span className={`text-xs font-medium ${
                  feature.key === 'employeeManagement' ? 'text-primary' : 
                  feature.key === 'serviceMarketing' ? 'text-pink-400' : 'text-purple-300'
                }`}>
                  {feature.aiLabel}
                </span>
              </div>
              {aiCount > 0 && feature.key !== 'employeeManagement' && (
                <span className="text-[10px] text-gray-400">
                  {aiCount.toLocaleString()} {feature.aiUnit}
                </span>
              )}
            </div>

            {/* Bundle info / Unit price info */}
            <div className="text-[10px] text-gray-200">
              {feature.key === 'employeeManagement' 
                ? `سعر الموظف الإضافي: ${pricePerBundle} ريال`
                : feature.key === 'serviceMarketing'
                ? `سعر الخدمة الإضافية: ${pricePerBundle} ريال`
                : `كل ${bundleSize.toLocaleString()} ${feature.aiUnit} بـ ${pricePerBundle} ريال`
              }
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBundlesChange(aiMessageBundles - 1);
                  }}
                  disabled={aiMessageBundles <= (feature.minUnits || 0)}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
                >
                  <Minus className="h-3 w-3 text-white" />
                </button>
                <span className="text-sm font-bold text-white min-w-[24px] text-center">
                  {aiMessageBundles}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBundlesChange(aiMessageBundles + 1);
                  }}
                  disabled={feature.maxUnits !== undefined && aiMessageBundles >= feature.maxUnits}
                  className="w-7 h-7 rounded-lg bg-primary/30 flex items-center justify-center hover:bg-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3 text-white" />
                </button>
              </div>

              {/* AI price */}
              {aiPrice > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-purple-300">+{aiPrice}</span>
                  <span className="text-[10px] text-gray-200">ريال</span>
                </div>
              )}
            </div>
          </div>

          {/* Total for this feature */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-gray-400">إجمالي الميزة</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-primary">{totalFeaturePrice}</span>
              <span className="text-[10px] text-gray-400">ريال</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FeatureCard = memo(FeatureCardComponent);
export default FeatureCard;

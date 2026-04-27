"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  ArrowRight,
  Sparkles,
  CreditCard,
  Loader2,
} from "lucide-react";
import { getPaymentStatus } from "@/lib/api";
import Image from "next/image";

// ─── types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "success" | "declined" | "cancelled" | "pending" | "unknown" | "checking";

interface PaymentInfo {
  orderId: string;
  status: "pending" | "approved" | "rejected";
  edfaStatus: string | null;
  transId: string | null;
  paidAmount: string | null;
  totalPrice: number | null;
  currency: string;
  createdAt: string;
  processedAt: string | null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 3000;  // poll every 3 seconds
const MAX_POLL_ATTEMPTS = 20;    // give up after ~1 minute

// ─── status config map ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PaymentStatus,
  {
    icon: React.ElementType;
    iconClass: string;
    glowClass: string;
    badgeClass: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    glowClass: "shadow-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    title: "تمّت عملية الدفع بنجاح! 🎉",
    subtitle: "تم تفعيل باقتك المخصصة وستكون جاهزة خلال لحظات.",
    ctaLabel: "الذهاب إلى لوحة التحكم",
    ctaHref: "/",
  },
  declined: {
    icon: XCircle,
    iconClass: "text-red-400",
    glowClass: "shadow-red-500/20",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
    title: "تم رفض عملية الدفع",
    subtitle: "لم تتم العملية بنجاح. يرجى التحقق من بيانات البطاقة والمحاولة مجدداً.",
    ctaLabel: "المحاولة مجدداً",
    ctaHref: "/plans/custom",
  },
  cancelled: {
    icon: XCircle,
    iconClass: "text-yellow-400",
    glowClass: "shadow-yellow-500/20",
    badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    title: "تم إلغاء عملية الدفع",
    subtitle: "ألغيت عملية الدفع. يمكنك العودة وإعادة المحاولة في أي وقت.",
    ctaLabel: "العودة للبناء",
    ctaHref: "/plans/custom",
  },
  pending: {
    icon: Clock,
    iconClass: "text-blue-400",
    glowClass: "shadow-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    title: "جاري معالجة الدفع...",
    subtitle: "يتم التحقق من عملية الدفع. يرجى الانتظار قليلاً.",
    ctaLabel: "العودة للرئيسية",
    ctaHref: "/dashboard",
  },
  unknown: {
    icon: RefreshCcw,
    iconClass: "text-gray-400",
    glowClass: "shadow-gray-500/20",
    badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    title: "حالة الدفع غير معروفة",
    subtitle: "يتم التحقق من حالة الدفع. إن استمرت المشكلة تواصل مع الدعم الفني.",
    ctaLabel: "تواصل مع الدعم",
    ctaHref: "/support",
  },
  checking: {
    icon: Clock,
    iconClass: "text-blue-400",
    glowClass: "shadow-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    title: "جاري التحقق من العملية...",
    subtitle: "لقد عدت من بوابة الدفع، نتحقق الآن من حالة المعاملة.",
    ctaLabel: "العودة للرئيسية",
    ctaHref: "/",
  },
};

// ─── component ────────────────────────────────────────────────────────────────

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const urlStatus = (searchParams.get("status") || "unknown") as PaymentStatus;
  const orderId   = searchParams.get("order_id") || "";

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<PaymentStatus>(urlStatus);
  const [isPolling, setIsPolling]           = useState(false);
  const [pollError, setPollError]           = useState<string | null>(null);

  const pollAttemptsRef = useRef(0);
  const pollTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── map DB status → UI status ─────────────────────────────────────────────
  const mapDbStatus = useCallback((dbStatus: string): PaymentStatus => {
    if (dbStatus === "approved") return "success";
    if (dbStatus === "rejected") return "declined";
    return "pending";
  }, []);

  // ── poll backend for payment status ──────────────────────────────────────
  const pollStatus = useCallback(async () => {
    if (!orderId) return;
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || ""
      : "";
    if (!token) return;

    try {
      const res = await getPaymentStatus(token, orderId);
      if (res.success && res.payment) {
        setPaymentInfo(res.payment);
        const mapped = mapDbStatus(res.payment.status);
        setResolvedStatus(mapped);

        // Stop polling when we have a final answer
        if (mapped !== "pending") {
          setIsPolling(false);
          return;
        }
      }
    } catch (e: any) {
      console.warn("[PaymentResult] poll error:", e.message);
      setPollError("تعذّر التحقق من الحالة");
    }

    // Schedule next poll if still pending
    pollAttemptsRef.current += 1;
    if (pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
      pollTimerRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS);
    } else {
      setIsPolling(false);
      setPollError("انتهت مهلة التحقق. يرجى التحقق من البريد الإلكتروني أو التواصل مع الدعم.");
    }
  }, [orderId, mapDbStatus]);

  // Start polling on mount 
  useEffect(() => {
    const shouldPoll = ["success", "pending", "checking", "unknown"].includes(urlStatus);
    if (shouldPoll && orderId) {
      setIsPolling(true);
      pollStatus();
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = STATUS_CONFIG[resolvedStatus] || STATUS_CONFIG.unknown;
  const Icon   = config.icon;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 py-12"
    >
      {/* Background glow */}
      <div
        className={`
          absolute inset-0 pointer-events-none 
          ${resolvedStatus === "success" ? "bg-emerald-500/3" : ""}
          ${resolvedStatus === "declined" || resolvedStatus === "cancelled" ? "bg-red-500/3" : ""}
        `}
      />

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div
          className={`
            rounded-3xl border border-white/10  gradient-border backdrop-blur-xl
            p-8 shadow-2xl ${config.glowClass} text-center space-y-6
          `}
        >
          {/* Brand mark */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/logo.png" alt="Logo" width={200} height={100} />
          </div>

          {/* Icon */}
          <div className="flex items-center justify-center">
            {isPolling ? (
              <div className="relative">
                <Loader2 className={`h-20 w-20 animate-spin ${config.iconClass} opacity-70`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-white/50" />
                </div>
              </div>
            ) : (
              <div
                className={`
                  p-5 rounded-full 
                  ${resolvedStatus === "success" ? "bg-emerald-500/10" : ""}
                  ${resolvedStatus === "declined" ? "bg-red-500/10" : ""}
                  ${resolvedStatus === "cancelled" ? "bg-yellow-500/10" : ""}
                  ${resolvedStatus === "pending" || resolvedStatus === "unknown" ? "bg-white/5" : ""}
                `}
              >
                <Icon className={`h-16 w-16 ${config.iconClass}`} />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{config.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{config.subtitle}</p>
          </div>

          {/* Payment details */}
          {paymentInfo && (
            <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-3 text-right">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                تفاصيل المعاملة
              </h3>

              <div className="space-y-2">
                {paymentInfo.orderId && (
                  <DetailRow
                    label="رقم الطلب"
                    value={paymentInfo.orderId}
                    mono
                  />
                )}
                {paymentInfo.transId && (
                  <DetailRow
                    label="رقم المعاملة"
                    value={paymentInfo.transId}
                    mono
                  />
                )}
                {(paymentInfo.paidAmount || paymentInfo.totalPrice) && (
                  <DetailRow
                    label="المبلغ المدفوع"
                    value={`${paymentInfo.paidAmount || paymentInfo.totalPrice} ${paymentInfo.currency}`}
                    highlight={resolvedStatus === "success"}
                  />
                )}
                {paymentInfo.processedAt && (
                  <DetailRow
                    label="تاريخ المعالجة"
                    value={new Date(paymentInfo.processedAt).toLocaleString("ar-SA")}
                  />
                )}
              </div>

              {/* Status badge */}
              <div
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                  ${config.badgeClass}
                `}
              >
                <Icon className="h-3 w-3" />
                {resolvedStatus === "success" && "مكتمل"}
                {resolvedStatus === "declined" && "مرفوض"}
                {resolvedStatus === "cancelled" && "ملغى"}
                {resolvedStatus === "pending" && "قيد المعالجة"}
                {resolvedStatus === "unknown" && "غير معروف"}
              </div>
            </div>
          )}

          {/* Order ID (when no paymentInfo yet) */}
          {!paymentInfo && orderId && (
            <div className="bg-white/5 rounded-xl border border-white/5 px-4 py-3">
              <p className="text-[11px] text-gray-500 mb-1">رقم الطلب</p>
              <p className="text-xs text-white font-mono tracking-wider">{orderId}</p>
            </div>
          )}

          {/* Poll error */}
          {pollError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <RefreshCcw className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300 text-right">{pollError}</p>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="payment-result-cta"
              onClick={() => router.push(config.ctaHref)}
              disabled={isPolling}
              className="
                flex-1 flex items-center justify-center gap-2 px-6 py-3
                primary-button text-white rounded-xl font-medium
                hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] transition-all
                shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isPolling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  {/* <ArrowRight className="h-4 w-4" /> */}
                  <span>{config.ctaLabel}</span>
                </>
              )}
            </button>

            {/* Secondary: go to plans */}
            {resolvedStatus !== "success" && (
              <button
                onClick={() => router.push("/plans")}
                className="
                  flex-1 flex items-center justify-center gap-2 px-6 py-3
                  bg-white/5 hover:bg-white/10 border border-white/10
                  text-white rounded-xl font-medium transition-all
                "
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>استعرض الباقات</span>
              </button>
            )}
          </div>

          {/* Support note */}
          <p className="text-[11px] text-gray-300">
            هل تحتاج مساعدة؟{" "}
            <a
              href="mailto:support@flooxira.com"
              className="text-primary hover:underline"
            >
              تواصل مع الدعم الفني
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── sub-component ────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-500 shrink-0">{label}</span>
      <span
        className={`
          text-[11px] truncate max-w-[200px]
          ${mono ? "font-mono tracking-wide" : ""}
          ${highlight ? "text-emerald-400 font-bold" : "text-gray-300"}
        `}
      >
        {value}
      </span>
    </div>
  );
}

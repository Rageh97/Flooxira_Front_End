import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Flooxira",
  description: `فلوكسيرا منصة أتمتة متقدمة تعتمد على الذكاء الاصطناعي لتعزيز الدعم الفني وتحسين خدمة العملاء في جميع المنصات. توفر المنصة نظام رد تلقائي في واتساب مبني على تقنيات AI الحديثة لضمان سرعة الاستجابة ودقة المعلومات، مع نظام محاسبة متكامل، ونظام مواعيد ذكي لحجز المواعيد تلقائياً عبر الواتساب بدون أي تدخل بشري.

تقدم فلوكسيرا ربطاً كاملاً مع منصة سلة، بالإضافة إلى إمكانية إضافة Live Chat لمواقع التجارة الإلكترونية لعرض أيقونة الدعم الفني المدعومة بالذكاء الاصطناعي. كما تشمل المنصة نظام تذاكر احترافي لإدارة الطلبات والاستفسارات، وحلول تسويقية قوية لتفعيل الحملات الإعلانية في الواتساب، وتمكين النشر التلقائي اليومي أو الشهري بضغطة واحدة فقط.

تدعم فلوكسيرا شات مدمج بنموذج GPT-5 لإنتاج المحتوى، كتابة الكابشنات، ابتكار الأفكار، وتوليد الردود بدقة عالية وبلهجات عربية متعددة. المنصة مخصصة لأصحاب المشاريع والمتاجر الإلكترونية في جميع الدول العربية، وتساعدهم على رفع الكفاءة التشغيلية، تسريع العمل، وتحسين تجربة العملاء بأعلى مستوى.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html dir="rtl" lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={` antialiased`}>
        <Providers>{children}</Providers>

      </body>
    </html>
  );
}

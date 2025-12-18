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
      <body className={` antialiased`}>
        <Providers>{children}</Providers>
       <script>
  window.WIDGET_API_URL = 'http://localhost:4000';
  window.WIDGET_SOCKET_URL = 'http://localhost:4000';
</script>
<script src="http://localhost:4000/widget.js" data-store-id="9b78752d-4935-4a05-bc10-f283a3602c4b"></script>
      </body>
    </html>
  );
}

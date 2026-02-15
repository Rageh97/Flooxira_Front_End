"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Info, 
  Scale, 
  Cpu, 
  MessageSquare, 
  Calendar, 
  Globe, 
  CreditCard, 
  RefreshCcw, 
  Headphones, 
  AlertTriangle, 
  HandMetal, 
  XOctagon,
  FileText
} from "lucide-react";

export default function PolicyPage() {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const sections = [
    {
      title: "تعريف المنصة وطبيعة الخدمة",
      icon: <Info className="w-6 h-6 text-blue-400" />,
      content: [
        "فلوكسيرا هي منصة تقنية متخصصة في أدوات الذكاء الاصطناعي، إدارة التواصل، الأتمتة، إدارة المحتوى، إدارة العملاء والمحاسبة، التكاملات البرمجية عبر Webhook و API، وإدارة الاشتراكات والموظفين.",
        "المنصة تقدم أدوات تقنية رقمية تساعد أصحاب المشاريع والمتاجر وصناع المحتوى على إدارة أعمالهم بكفاءة أعلى.",
        "فلوكسيرا لا تمثل المستخدم أمام أي جهة رسمية ولا تتحمل مسؤولية نشاطه التجاري أو القانوني أو المالي."
      ]
    },
    {
      title: "نطاق الاستخدام المشروع",
      icon: <Scale className="w-6 h-6 text-green-400" />,
      content: [
        "يجب استخدام المنصة بما يتوافق مع الأنظمة والقوانين المعمول بها في بلد المستخدم، وسياسات مزودي الخدمات المرتبطين (واتساب، ميتا، تيليجرام)، والضوابط الأخلاقية وأحكام الشريعة الإسلامية.",
        "يمنع استخدام المنصة في: الاحتيال، انتحال الشخصيات، الإساءة، نشر محتوى محرم أو مخالف للآداب، الترويج للمقامرة أو الربا، أو إرسال رسائل مزعجة (Spam).",
        "تحتفظ المنصة بالحق الكامل في تعليق أو إيقاف أي حساب يثبت مخالفته دون إشعار مسبق."
      ]
    },
    {
      title: "أدوات الذكاء الاصطناعي والمحتوى",
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      content: [
        "توفر فلوكسيرا أدوات ذكاء اصطناعي لإنشاء محتوى وتحليل بيانات وإعداد ردود تلقائية.",
        "المستخدم يتحمل المسؤولية الكاملة عن أي محتوى يتم إنشاؤه. يمنع إنتاج محتوى مضلل، يسيء للأديان، تحريضي، أو ينتهك حقوق الملكية الفكرية.",
        "المنصة توفر التقنية فقط ولا تتحمل مسؤولية نتائج الاستخدام."
      ]
    },
    {
      title: "إدارة واتساب وتيليجرام والدردشة المباشرة",
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      content: [
        "يلتزم المستخدم التزاماً كاملاً بسياسات تلك المنصات.",
        "أي حظر أو تقييد للحسابات الناتج عن سوء الاستخدام أو الإرسال المفرط يتحمله المستخدم بالكامل.",
        "المنصة غير مسؤولة عن قرارات الحظر أو الإيقاف الصادرة من مزودي الخدمات."
      ]
    },
    {
      title: "إدارة المحتوى والجدولة والنشر",
      icon: <Calendar className="w-6 h-6 text-pink-400" />,
      content: [
        "المستخدم مسؤول عن ملكية المحتوى، صحة المعلومات، والتزامه بالأنظمة وحقوق النشر.",
        "أي مطالبة قانونية بسبب محتوى المستخدم تقع تحت مسؤوليته الشخصية بالكامل."
      ]
    },
    {
      title: "التكاملات البرمجية Webhook و API",
      icon: <Globe className="w-6 h-6 text-indigo-400" />,
      content: [
        "يمنع منعاً باتاً: محاولة اختراق النظام، الضغط المتعمد على الخوادم، التحايل على حدود الباقات، استخراج بيانات غير مصرح بها، أو إعادة بيع الخدمة دون إذن.",
        "يحق للمنصة تعطيل المفاتيح البرمجية فوراً عند الاشتباه بأي تهديد أمني."
      ]
    },
    {
      title: "الاشتراكات والباقات",
      icon: <CreditCard className="w-6 h-6 text-yellow-400" />,
      content: [
        "يتم تفعيل الاشتراك بعد إتمام عملية الدفع بنجاح. جميع الميزات تخضع لنوع الباقة المشتراة.",
        "تحتفظ المنصة بحق تعديل الباقات أو تطويرها أو تحديث الأسعار بما يخدم استقرار الخدمة واستمراريتها."
      ]
    },
    {
      title: "سياسة الاستبدال والاسترجاع",
      icon: <RefreshCcw className="w-6 h-6 text-orange-400" />,
      content: [
        "لا يوجد استبدال أو استرجاع للأموال بعد تفعيل الاشتراك أو شراء كود التفعيل واستخدامه. المشتريات الرقمية نهائية.",
        "يتم إعادة النظر فقط إذا تم الدفع ولم يتم التفعيل، حيث يتم التحقق وضمان تسليم الاشتراك فعالاً بالكامل للعميل دون استرجاع المبلغ مالياً."
      ]
    },
    {
      title: "الدعم الفني",
      icon: <Headphones className="w-6 h-6 text-cyan-400" />,
      content: [
        "نوفر دعماً فنياً للمساعدة التقنية المتعلقة باستخدام المنصة فقط.",
        "الدعم لا يشمل إدارة حسابات العملاء التجارية أو تشغيل الحملات التسويقية أو تعويض خسائر ناتجة عن قرارات خارجية."
      ]
    },
    {
      title: "الشراء من جهات غير معتمدة",
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      content: [
        "نحذر من شراء الاشتراكات من جهات خارجية غير مصرح بها. المنصة الرسمية تعمل تحت مظلة 'شانس بلاي' (www.chancplay.com).",
        "أي جهة غير مذكورة رسمياً داخل المنصة لا تعتبر شريكاً معتمداً."
      ]
    },
    {
      title: "حدود المسؤولية",
      icon: <HandMetal className="w-6 h-6 text-gray-400" />,
      content: [
        "فلوكسيرا تقدم أدوات تقنية فقط، ولا تتحمل مسؤولية الأرباح أو الخسائر، قرارات العملاء، إيقاف الحسابات الخارجية، أو النتائج التسويقية.",
        "استخدام المنصة يتم على مسؤولية المستخدم الكاملة."
      ]
    },
    {
      title: "تعليق أو إنهاء الحساب",
      icon: <XOctagon className="w-6 h-6 text-red-600" />,
      content: [
        "يحق للمنصة إيقاف الحساب في حال مخالفة الشروط، الإضرار بسمعة المنصة، الاستخدام غير المشروع، أو مخالفة الضوابط الشرعية.",
        "لا يحق المطالبة بأي تعويض في حال ثبتت المخالفة."
      ]
    }
  ];

  return (
    <div className=" mx-auto space-y-3 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <ShieldCheck className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          الشروط والأحكام الرسمية لمنصة <span className="text-primary">فلوكسيرا</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-gray-400 bg-white/5 w-fit mx-auto px-4 py-1.5 rounded-full border border-white/10">
          <FileText className="w-4 h-4" />
          <p className="text-sm">آخر تحديث: {currentDate || "..."}</p>
        </div>
      </div>

      {/* Intro Card */}
      <Card className="gradient-border border-none bg-card/50 backdrop-blur-xl">
        <CardContent className="p-8 text-center">
          <p className="text-lg text-gray-200 leading-relaxed max-w-3xl mx-auto">
            مرحباً بك في منصة فلوكسيرا. استخدامك للمنصة أو إنشاء حساب أو شراء أي باقة يعني موافقتك الكاملة والملزمة قانونياً على جميع الشروط والأحكام الواردة في هذه الصفحة دون استثناء.
          </p>
          <div className="mt-6 p-2 bg-red-500/80 border border-red-500/20 rounded-xl inline-block">
            <p className="text-white font-medium">
              في حال عدم الموافقة على أي بند، يرجى التوقف عن استخدام المنصة فوراً.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {sections.map((section, idx) => (
          <Card key={idx} className="bg-fixed-40 border-none transition-all duration-300 ">
            <CardHeader className="flex flex-row items-center space-x-4 space-x-reverse pb-2">
              <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <CardTitle className="text-xl text-white pt-2">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final Clause */}
      <Card className="gradient-border border-none bg-primary/5 overflow-hidden">
        <CardContent className="p-10 text-center relative">
          <div className="absolute top-0 right-0 p-8 opacity-30">
            <ShieldCheck className="w-32 h-32 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">التعديلات على الشروط</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            تحتفظ فلوكسيرا بحق تعديل أو تحديث هذه الشروط في أي وقت. ويعد استمرار استخدام المنصة بعد التحديث موافقة ضمنية على الشروط المعدلة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

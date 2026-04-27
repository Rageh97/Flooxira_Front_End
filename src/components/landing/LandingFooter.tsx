import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="bg-transparent pt-20 pb-10 border-t border-white/10 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Image src="/logo.png" alt="Logo" width={200} height={200}  />
            </Link>
            <p className="text-white/80 max-w-sm mb-6 leading-relaxed font-medium">
              المنصة الأقوى والإختيار الأول لإدارة السوشيال ميديا وربط واتساب بالذكاء الاصطناعي بشكل يضمن لك تحقيق أعلى مبيعات وبأقل مجهود.
            </p>
            <Link href="/sign-up">
              <Button className="bg-white/20 backdrop-blur-md saturate-200 text-white border border-white/30 hover:bg-white/30 rounded-full px-8 font-bold">
                انضم إلينا الآن
              </Button>
            </Link>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-white/70 hover:text-white transition-colors">المميزات</Link></li>
              <li><Link href="#how-it-works" className="text-white/70 hover:text-white transition-colors">كيف نعمل</Link></li>
              <li><Link href="/sign-in" className="text-white/70 hover:text-white transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="text-white/70">الدعم الفني متاح 24/7 لمساعدتك في أي وقت.</li>
              <li><a href="mailto:support@socialmanage.com" className="text-cyan-400 hover:text-cyan-300">support@flooxira.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-white/50 text-sm">
          <p>© {new Date().getFullYear()}  flooxira. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/policy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link href="/policy" className="hover:text-white transition-colors">شروط الاستخدام</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


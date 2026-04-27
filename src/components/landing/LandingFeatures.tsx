"use client";

import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

const mainFeatures = [
  {
    id: "whatsapp",
    title: "إدارة الواتساب الذكية",
    subtitle: "ردود AI احترافية وتحكم كامل في فريق عملك",
    description: "حوّل رقم واتساب واحد إلى مركز عمليات ذكي. بفضل محرك الذكاء الاصطناعي المتطور، ستحصل على ردود ذكية تشبه الموظف البشري تماماً، مع القدرة على توزيع المهام بين موظفيك ومتابعة أدائهم لحظة بلحظة، وتنظيم محادثاتك عبر التصنيفات والمجموعات باحترافية.",
    bullets: [
      "ردود ذكاء اصطناعي (AI) فائقة الدقة تحاكي العنصر البشري وتفهم استفسارات العملاء",
      "إدارة مركزية لجميع الموظفين على رقم واحد مع توزيع تلقائي للمحادثات",
      "تنظيم المحادثات باستخدام التصنيفات (Labels) وإدارة احترافية للمجموعات والجروبات",
    ],
    image: "/featurew.jpeg",
    color: "from-emerald-500/40 to-green-600/40",
    shadow: "shadow-green-500/20",
    reverse: false,
  },
  {
    id: "livechat",
    title: "اللايف شات: محرك التحويل",
    subtitle: "حول زوار موقعك لعملاء في أجزاء من الثانية",
    description: "امنح زوار موقعك تجربة دعم استثنائية عبر ويدجت 'لايف شات' سريع وخفيف. يتميز بقدرة عالية على التخصيص لتناسب هويتك، مع إمكانية التحويل المباشر للموظفين أو المساعد الذكي لضمان استجابة 24/7.",
    bullets: [
      "برمجة رسائل ترحيبية ذكية تظهر بناءً على سلوك الزائر",
      "تخصيص كامل للأيقونات، الألوان، وأوقات العمل آلياً",
      "لوحة تحكم موحدة لاستقبال رسائل الموقع بجانب الواتساب",
    ],
    image: "/automate-livechat.jfif",
    color: "from-blue-500/40 to-cyan-500/40",
    shadow: "shadow-blue-500/20",
    reverse: true,
  },
  {
    id: "telegram",
    title: "أتمتة التليجرام الاحترافية",
    subtitle: "إدارة القنوات والمجموعات والاشتراكات",
    description: "سيطرة تامة على قنواتك ومجموعاتك في تليجرام. نظم حملاتك الإخبارية، وأدِر اشتراكات الأعضاء، وتفاعل بلحظية عبر واجهة موحدة تدعم الميديا الضخمة والملفات المتنوعة بسهولة تامة.",
    bullets: [
      "بث رسائل وتنبيهات مبرمجة لآلاف المشتركين في القنوات",
      "تحكم كامل في إعدادات البوتات وردودها التلقائية للمجموعات",
      "دمج محادثات التليجرام ضمن صندوق الوارد لتعزيز تعاون الفريق",
    ],
    image: "/automate-telegram.jfif",
    color: "from-sky-500/40 to-indigo-500/40",
    shadow: "shadow-sky-500/20",
    reverse: false,
  },
  {
    id: "ai_media",
    title: "مصنع الإبداع بالـ AI",
    subtitle: "جيل جديد من الصور، الفيديو، والصوت",
    description: "انتقل بإنتاج المحتوى لمستوى خيالي. استخدم أدواتنا لتوليد صور بجودة سينمائية، صناعة مقاطع فيديو إعلانية قصيرة من النص، وتحويل النصوص إلى بصمات صوتية (Voice) طبيعية تشبه البشر تماماً.",
    bullets: [
      "توليد صور واقعية وتصاميم للمنتجات بضغطة زر",
      "صناعة محتوى فيديو احترافي (AI Video Generation)",
      "تحويل النصوص إلى أصوات بشرية (Voiceovers) بلهجات متعددة",
    ],
    image: "/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png",
    color: "from-pink-500/40 to-orange-500/40",
    shadow: "shadow-pink-500/20",
    reverse: true,
  },
  {
    id: "ai_logic",
    title: "الذكاء الاصطناعي (العقل الحركي)",
    subtitle: "تدريب مخصص لخدمة عملائك بدقة متناهية",
    description: "لا يقف دورنا عند التوليد؛ بل نمنح عملك 'عقلاً' مفكراً. درب المساعد الذكي على ملفات شركتك ورابط موقعك ليقوم بالرد على الاستفسارات المعقدة، تحليل المشاعر، وتوجيه العملاء بذكاء بشري.",
    bullets: [
      "قاعدة معرفة (Knowledge Base) يتم تدريبها على ملفاتك الخاصة",
      "تحليل مشاعر العميل وفهم نية الشراء أو الاعتراض لحظياً",
      "دعم فني كامل وذكي يغنيك عن عدد ضخم من الموظفين",
    ],
    image: "/ai-brain.jfif",
    color: "from-purple-500/40 to-indigo-500/40",
    shadow: "shadow-purple-500/20",
    reverse: false,
  },
  {
    id: "webhook_integration",
    title: "الربط التقني والويبهوك (Webhooks)",
    subtitle: "تكامل فوري مع سلة، ووردبريس، وإياب IApp Cloud",
    description: "اربط متجرك أو موقعك الإلكتروني مباشرة بـ فلوكسيرا. نوفر تكاملاً برمجياً متطوراً يتيح لك أتمتة عملياتك بالكامل، من تخزين بيانات الطلبات والعملاء تلقائياً، وحتى إرسال إشعارات احترافية لعملائك عبر الواتساب عند كل تحديث.",
    bullets: [
      "تكامل فوري مع منصات Salla و WordPress و IApp Cloud",
      "تخزين تلقائي لبيانات الطلبات والعملاء في قاعدة بيانات واحدة",
      "إرسال إشعارات WhatsApp تلقائية للعملاء لمتابعة حالة الطلب",
    ],
    image: "/الربط api.webp",
    color: "from-orange-500/40 to-red-500/40",
    shadow: "shadow-orange-500/20",
    reverse: true,
  }
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 relative z-10 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-6 [text-shadow:0_4px_30px_rgba(255,255,255,0.1)]"
          >
            حلولنا الذكية: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">بوابتك للنمو المتسارع</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed"
          >
            نجمع لك أرقى تقنيات الذكاء الاصطناعي وأدوات التواصل في منصة واحدة، لنمنحك السيطرة الكاملة والقدرة على التوسع بأمان واحترافية.
          </motion.p>
        </div>

        <div className="space-y-32">
          {mainFeatures.map((feature, index) => (
            <div key={feature.id} className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
               
               {/* Text Content */}
               <motion.div 
                 initial={{ opacity: 0, x: feature.reverse ? -40 : 40 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6 }}
                 className="flex-1 text-right w-full"
               >
                 <div className="mb-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-sm md:text-base font-semibold text-white shadow-sm">
                    {feature.subtitle}
                 </div>
                 <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-snug">
                   {feature.title}
                 </h3>
                 <p className="text-white/80 text-lg leading-relaxed mb-8">
                   {feature.description}
                 </p>
                 <ul className="space-y-4">
                   {feature.bullets.map((bullet, i) => (
                     <li key={i} className="flex items-start gap-3">
                       <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5 filter drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                       <span className="text-white/90 font-medium text-lg">{bullet}</span>
                     </li>
                   ))}
                 </ul>
               </motion.div>

               {/* Visual Mockup Content */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6, delay: 0.2 }}
                 className="flex-1 w-full"
               >
                 <div className={`relative w-full aspect-square md:aspect-video lg:aspect-square max-w-[500px] mx-auto rounded-[2.5rem] bg-gradient-to-br ${feature.color} p-[1px] shadow-[0_16px_64px_rgba(0,0,0,0.5)] group`}>
                   <div className="w-full h-full bg-black/20 backdrop-blur-2xl rounded-[2.4rem] overflow-hidden relative border border-white/10 flex items-center justify-center">
                      <img 
                        src={feature.image} 
                        alt={feature.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none opacity-50" />
                   </div>
                 </div>
               </motion.div>
               
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

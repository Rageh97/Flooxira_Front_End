"use client";

import { motion } from "motion/react";

const steps = [
  {
    title: "ربط القنوات بسهولة",
    desc: "أضف كل حساباتك (واتساب، تليجرام، وتطبيقات أخرى) بنقرة واحدة باستخدام واجهة ربط آمنة وسريعة مع دعم لـ Webhooks.",
    icon: "1",
    glow: "bg-blue-500/30"
  },
  {
    title: "إعداد الذكاء والموظفين",
    desc: "درب الروبوت على بياناتك ليجيب بخبرة، ثم قم بدعوة فريقك وتوزيع الصلاحيات وربط الأقسام بكل سهولة.",
    icon: "2",
    glow: "bg-purple-500/30"
  },
  {
    title: "إطلاق المبيعات والانطلاق",
    desc: "دع النظام يتولى الرد وتوزيع المهام، وراقب المبيعات تتدفق من جميع المنصات في صندوق وارد (Inbox) موحد وذكي.",
    icon: "3",
    glow: "bg-cyan-500/30"
  }
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative bg-transparent overflow-hidden">
      {/* Decorative Blur */}
      {/* <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" /> */}

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-24">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-sm font-semibold text-white shadow-sm"
          >
             طريقة العمل
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-6 [text-shadow:0_4px_30px_rgba(255,255,255,0.1)]"
          >
            كيف تبدأ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">بتحويل عملك؟</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg max-w-2xl mx-auto font-medium"
          >
            خطوات بسيطة جداً تفصلك عن أتمتة مبيعاتك وإدارة فريقك بشكل أكثر احترافية وسرعة.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Hidden on mobile) */}
          <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="relative relative group"
            >
              {/* Box container */}
              <div className="bg-white/[0.03] backdrop-blur-3xl saturate-200 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-8 rounded-[2rem] hover:bg-white/10 transition-all duration-300 relative z-10 h-full flex flex-col items-center text-center">
                 <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-xl ${step.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                 
                 <div className="w-20 h-20 mx-auto bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl relative z-10">
                   {step.icon}
                 </div>
                 
                 <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{step.title}</h3>
                 <p className="text-white/80 leading-relaxed text-sm md:text-base font-medium">{step.desc}</p>
              </div>
              
              {/* Background hover effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



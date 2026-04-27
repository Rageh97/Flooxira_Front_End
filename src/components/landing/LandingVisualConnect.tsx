"use client";

import { motion } from "motion/react";
import { Zap, Shield, Cpu, MessageSquare } from "lucide-react";
import Image from "next/image";

const advantages = [
  {
    title: "أتمتة واتساب",
    desc: "قناة اتصال واحده وقاعدة معرفة للذكاء الاصطناعي للرد على العملاء",
    icon: "/whats.png",
    position: "left",
    color: "#10b981"
  },
  {
    title: "أدوات توليد الفيديو والصور والصوت  ",
    desc: "اصنع محتوى إبداعي لعملك بضغطة زر باستخدام الذكاء الاصطناعي.",
    icon: "/ai.png",
    position: "right",
    color: "#8b5cf6"
  },
  {
    title: "لايف شات",
    desc: "تعاون فريقك بالكامل للرد من منصة واحدة بكل سهولة.",
    icon: "/live.png",
    position: "left",
    color: "#f59e0b"
  },
  {
    title: "أتمتة تليجرام ",
    desc: "إدارة القنوات والبوتات وبث الرسائل لآلاف المشتركين.",
    icon: "/tele.png",
    position: "right",
    color: "#3b82f6"
  },
  {
    title: "ربط ويبهوك مع سلة واياب كلاود و ووردبريس",
    desc: "سهولة تكامل وأتمتة متاجرك وعملياتك بشكل فوري.",
    icon: "/salla.png",
    position: "left",
    color: "#06b6d4"
  },
  {
    title: "ادارة موظفين",
    desc: "توزيع الصلاحيات ومتابعة الأداء وإدارة فريقك بدقة.",
    icon: "/employee.png",
    position: "right",
    color: "#ef4444"
  }
];

export default function LandingVisualConnect() {
  return (
    <section className="py-3 relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            ما الذي يجعلنا <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">  متميزين؟</span>
          </motion.h2>
          <p className="text-white/50 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            نحن لا نقدم مجرد أدوات، بل نبني لك عصبًا مركزيًا ذكيًا يربط كافة قنوات تواصلك في نظام واحد فائق القوة.
          </p>
        </div>

        {/* Visual Hub System */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-[850px] lg:min-h-[700px]">
          
          {/* SVG Connections Layer (Desktop Only) */}
          <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
              {/* Left Side Curves */}
              <motion.path d="M 600 400 Q 400 200 200 200" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
              <motion.path d="M 600 400 L 200 400" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} />
              <motion.path d="M 600 400 Q 400 600 200 600" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.4 }} />
              
              {/* Right Side Curves */}
              <motion.path d="M 600 400 Q 800 200 1000 200" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
              <motion.path d="M 600 400 L 1000 400" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} />
              <motion.path d="M 600 400 Q 800 600 1000 600" stroke="url(#grad-line)" strokeWidth="2" strokeDasharray="8 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.4 }} />
              
              <defs>
                <linearGradient id="grad-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Central Hub */}
          <div className="relative z-20 order-1 lg:order-none scale-90 md:scale-100 lg:scale-110">
            <div className="relative">
              {/* Spinning Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="w-56 h-56 md:w-64 md:h-64 rounded-full border-2 border-blue-500/20 border-dashed"
              ></motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border-2 border-purple-500/30 border-t-transparent blur-[1px]"
              ></motion.div>
              
              {/* Core Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 shadow-[0_0_80px_rgba(59,130,246,0.6)] flex flex-col items-center justify-center group overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 to-purple-600/40 animate-pulse"></div>
                   <div className="relative z-10 text-white font-black text-xl tracking-[0.2em] flex flex-col items-center select-none">
                     <Image src="/favicon.png" alt="Logo" width={80} height={80}  />
                      <span className="text-[10px] text-white/50 mt-1 font-bold">CORE ENGINE</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:absolute lg:inset-0 lg:z-10 pointer-events-none px-4 lg:px-0 mt-8 lg:mt-0">
             
             {/* Left Column (3 Cards) */}
             <div className="flex flex-col gap-8 lg:gap-32 items-end lg:pr-12 w-full lg:w-1/3 pointer-events-auto">
                {advantages.filter(a => a.position === 'left').map((adv, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.8 }}
                    key={adv.title}
                    className="relative w-full max-w-[340px] p-6 rounded-2xl gradient-border backdrop-blur-2xl border border-white/10 shadow-2xl group hover:bg-white/[0.08] transition-all duration-500"
                  >
                    <div className="flex items-center gap-5">
                       <div 
                         className="relative w-14 h-14 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden p-2"
                         style={{ 
                           backgroundColor: `${adv.color}15`, 
                           borderColor: `${adv.color}40`,
                           boxShadow: `inset 0 0 20px ${adv.color}10, 0 0 10px ${adv.color}05`
                         }}
                       >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${adv.color}, transparent)` }} />
                          <Image src={adv.icon} alt={adv.title} width={36} height={36} className="w-full h-full object-contain drop-shadow-md relative z-10" />
                       </div>
                       <div className="text-right flex-1">
                          <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">{adv.title}</h3>
                          <p className="text-white/40 text-xs leading-relaxed group-hover:text-white/60 transition-colors">{adv.desc}</p>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>

             {/* Right Column (3 Cards) */}
             <div className="flex flex-col gap-8 lg:gap-32 items-start lg:pl-12 w-full lg:w-1/3 pointer-events-auto mt-8 lg:mt-0">
                {advantages.filter(a => a.position === 'right').map((adv, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.8 }}
                    key={adv.title}
                    className="relative w-full max-w-[340px] p-6 rounded-2xl gradient-border backdrop-blur-2xl border border-white/10 shadow-2xl group hover:bg-white/[0.08] transition-all duration-500"
                  >
                    <div className="flex items-center flex-row-reverse gap-5">
                       <div 
                         className="relative w-14 h-14 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden p-2"
                         style={{ 
                           backgroundColor: `${adv.color}15`, 
                           borderColor: `${adv.color}40`,
                           boxShadow: `inset 0 0 20px ${adv.color}10, 0 0 10px ${adv.color}05`
                         }}
                       >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${adv.color}, transparent)` }} />
                          <Image src={adv.icon} alt={adv.title} width={36} height={36} className="w-full h-full object-contain drop-shadow-md relative z-10" />
                       </div>
                       <div className="text-right flex-1">
                          <h3 className="text-white font-bold text-lg mb-1 group-hover:text-purple-300 transition-colors">{adv.title}</h3>
                          <p className="text-white/40 text-xs leading-relaxed group-hover:text-white/60 transition-colors">{adv.desc}</p>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>

          </div>

        </div>

        {/* Flower Spark Effect at the bottom */}
        {/* <div className="mt-40 flex justify-center scale-75 md:scale-100 opacity-50 overflow-hidden h-40">
           <div className="relative w-96 h-96 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 15 + i, repeat: Infinity, ease: "linear" }}
                  className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                />
              ))}
              <div className="w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full"></div>
           </div>
        </div> */}
      </div>

      {/* Background Ambience */}
      <div className="absolute top-1/2 left-0 w-full h-[1200px] -translate-y-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent -z-10"></div>
    </section>
  );
}

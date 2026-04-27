"use client";

import { motion } from "motion/react";
import { Check, Sparkles, SlidersHorizontal, Calculator, Zap } from "lucide-react";

export default function LandingPricing() {
  const features = [
    { title: "التحكم الكامل بباقتك", desc: "أنت تختار الصلاحيات التي تحتاجها فقط. لا مزيد من الدفع لميزات لا تستخدمها.", icon: SlidersHorizontal },
    { title: "تسعير ديناميكي وشفاف", desc: "نقوم بحساب التكلفة تلقائياً بناءً على ما اخترته فقط. ستعرف ما تدفعه بالضبط قبل التأكيد.", icon: Calculator },
    { title: "تفعيل فوري للمميزات", desc: "بمجرد إتمام الدفع، يتم تجهيز حسابك وصلاحياتك بالكامل وتفعيلها في ثوانٍ معدودة.", icon: Zap },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium text-sm mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Sparkles className="w-4 h-4" />
              <span>نظام الاشتراك الذكي</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-extrabold text-white mb-6 [text-shadow:0_4px_30px_rgba(255,255,255,0.1)]"
            >
              وداعاً للباقات الثابتة..{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                ادفع فقط ما تستخدمه!
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-lg max-w-2xl mx-auto font-medium"
            >
              لقد ابتكرنا نظاماً فريداً يمنحك الحرية المطلقة. يمكنك الآن تفصيل باقتك بدقة وتحديد الميزات التي تلبي احتياجاتك فعلياً واستلام فاتورة دقيقة تناسب عملك تماماً.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
             {/* Text side */}
             <div className="space-y-10">
               {features.map((feature, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.1 + 0.3 }}
                   className="flex items-start gap-5"
                 >
                   <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mix-blend-overlay"></div>
                     <feature.icon className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                     <p className="text-white/60 leading-relaxed text-lg">{feature.desc}</p>
                   </div>
                 </motion.div>
               ))}
             </div>

             {/* Illustration Mockup */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
             >
                <div className="absolute -inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-[3rem] blur-3xl -z-10" />
                <div className="bg-[#0b1228]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                   
                   <h4 className="text-white font-semibold mb-8 flex items-center gap-3 text-lg">
                     <Calculator className="w-6 h-6 text-cyan-400" />
                     شاشة اختيار الصلاحيات
                   </h4>
                   
                   <div className="space-y-4">
                     {[
                       { name: "الرد التلقائي وإدارة الرسائل", price: "+ $15/شهر", active: true },
                       { name: "تقارير وأداء الموظفين المتقدمة", price: "+ $10/شهر", active: true },
                       { name: "ربط المتاجر الإلكترونية", price: "+ $25/شهر", active: false }
                     ].map((item, i) => (
                       <div key={i} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${item.active ? "bg-cyan-500/5 border-cyan-500/30 shadow-[inset_0_0_15px_rgba(34,211,238,0.05)]" : "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100"}`}>
                         <div className="flex items-center gap-4">
                           <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${item.active ? "bg-cyan-500 text-[#060d1f] shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "border border-white/20"}`}>
                             {item.active && <Check className="w-4 h-4 font-bold" />}
                           </div>
                           <span className={item.active ? "text-cyan-50 font-medium" : "text-white/60"}>{item.name}</span>
                         </div>
                         <span className={`font-mono text-sm ${item.active ? "text-cyan-400 font-bold" : "text-white/40"}`}>{item.price}</span>
                       </div>
                     ))}
                   </div>

                   <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                     <div>
                       <div className="text-white/60 text-sm mb-1 uppercase tracking-wider">الإجمالي المستحق</div>
                       <div className="text-4xl font-black text-white flex items-end gap-2">
                         $25 <span className="text-base text-white/50 font-medium mb-1">/ شهرياً</span>
                       </div>
                     </div>
                     <button className="px-8 py-3.5 rounded-full gradient-border text-white font-bold hover:text-white transition-all duration-300">
                       اشترك الآن
                     </button>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
    </section>
  );
}

"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingCTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-transparent">
      {/* Background Effect */}
      {/* <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-[800px] h-[300px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur-[150px] opacity-40 mix-blend-screen" />
      </div> */}

      <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 border border-white/20 p-10 md:p-16 rounded-[3rem] backdrop-blur-3xl saturate-200 shadow-[0_16px_64px_rgba(0,0,0,0.3)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/30 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/30 rounded-full blur-[80px]" />
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight relative font-sans [text-shadow:0_4px_30px_rgba(255,255,255,0.2)]">
            مستعد لنقل مبيعاتك وإدارتك <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">إلى المستوى التالي؟</span>
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto relative font-medium">
            انضم إلى المئات من أصحاب الأعمال الذين حققوا نمواً مذهلاً باستخدام تقنياتنا المتطورة في الإدارة الذكية.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg bg-white/20 backdrop-blur-xl saturate-200 text-white hover:bg-white/30 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full font-bold transition-transform hover:scale-105">
                إنشاء حساب مجاني
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


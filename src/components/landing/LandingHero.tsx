"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "../ui/border-beam";

function HeroHeading() {
  const text1 = "أتمتة ذكية، محادثات أسرع،";
  const text2 = "وإدارة شاملة لعملك بالذكاء الاصطناعي";
  
  return (
    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-[1.2] tracking-tight max-w-5xl [text-shadow:0_4px_30px_rgba(255,255,255,0.2)]">
      {text1}
      <br className="hidden md:block" />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white">
        {text2}
      </span>
    </h1>
  );
}

export default function LandingHero() {
  return (
    <section className="relative min-h-[30vh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 bg-transparent">
      {/* Remove the opaque grid and radial gradients so the main body wallpaper shows through perfectly */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-gradient-to-b from-cyan-400/20 via-blue-500/10 to-transparent rounded-full blur-[100px] opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.7, ease: "easeOut" }}
           className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-xl saturate-200 shadow-xl"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
          </span>
          <span className="text-sm font-medium text-cyan-50">الجيل الجديد من منصات إدارة الأعمال</span>
        </motion.div>

        {/* Headline Static */}
        <HeroHeading />

        {/* Sub-headline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-blue-50 max-w-3xl mb-12 leading-relaxed opacity-90 font-medium"
        >
          اجمع واتساب، تليجرام، واللايف شات في مكان واحد مع عقل الذكاء الاصطناعي، 
          نظام ويبهوك متطور للربط الخارجي، وإدارة احترافية لفريق عملك وصلاحياتهم.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto"
        >
          {/* <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-white/20 backdrop-blur-xl saturate-200 text-white border border-white/30 hover:bg-white/30 hover:scale-105 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full">
              انطلق الآن مجاناً
            </Button>
          </Link> */}
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold text-white border-white/10 gradient-border hover:bg-black/30 rounded-full backdrop-blur-xl saturate-200 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all">
              استكشف النظام 
                <BorderBeam />
            </Button>
          
          </Link>
        </motion.div>
      </div>

    </section>
  );
}


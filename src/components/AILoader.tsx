"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";

const loadingTexts = [
  "جاري استحضار الإلهام...",
  "يتم مزج الألوان الرقمية...",
  "بناء الأشكال والأبعاد...",
  "إضافة تفاصيل دقيقة...",
  "تحسين الإضاءة والظلال...",
  "وضع اللمسات السحرية..."
];

export default function AILoader() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 w-full h-full min-h-[500px] rounded-[40px] bg-[#00050a] border border-white/5 flex flex-col items-center justify-center gap-8 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent opacity-50" />
      
      {/* Orb Animation */}
      <div className="relative w-64 h-64 flex items-center justify-center">
         {/* Core Glow */}
         <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"
         />
         
         {/* Inner Energy Ball */}
         <div className="relative w-32 h-32 bg-[#000] rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.5)] z-10 overflow-hidden">
            {/* Swirling Energy */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(59,130,246,0.5)_180deg,transparent_360deg)] opacity-50"
            />
            
            <div className="absolute inset-1 bg-[#00050a] rounded-full z-10 flex items-center justify-center">
               <motion.div 
                  animate={{ scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 blur-md opacity-80"
               />
               <motion.div 
                  animate={{ scale: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-8 h-8 rounded-full bg-white blur-sm opacity-90"
               />
            </div>
         </div>

         {/* Orbiting Rings */}
         {[1, 2, 3].map((i) => (
            <motion.div
               key={i}
               className="absolute rounded-full border border-blue-500/20 border-t-cyan-400/60"
               style={{ 
                  width: `${160 + i * 40}px`, 
                  height: `${160 + i * 40}px`,
                  zIndex: 5 - i
               }}
               animate={{ 
                  rotate: i % 2 === 0 ? 360 : -360,
                  scale: [1, 1.05, 1],
               }}
               transition={{ 
                  rotate: { duration: 15 - i * 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
               }}
            >
               {/* Satellite Particles */}
               <div className="absolute top-1/2 left-full w-2 h-2 -ml-1 -mt-1 bg-cyan-400 rounded-full blur-[1px] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </motion.div>
         ))}
      </div>

      {/* Text Content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
         <motion.div 
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
         >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-300 font-medium">المعالج الذكي نشط</span>
         </motion.div>

         <div className="text-center space-y-2 h-16">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">
               جاري إنشاء التحفة الفنية
            </h3>
            
            <motion.p
               key={textIndex}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="text-gray-500 text-sm font-mono"
            >
               {loadingTexts[textIndex]}
            </motion.p>
         </div>
      </div>
    </motion.div>
  );
}

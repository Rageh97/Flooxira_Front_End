"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LandingNavbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-1 backdrop-blur-2xl bg-white/[0.02] saturate-200 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo element */}
          <Image src="/Logoo.png" alt="Logo" width={150} height={100}  />
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
          <Link href="#features" className="hover:text-white transition-colors">المميزات</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">كيف نعمل</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">الأسعار</Link>
          {/* <Link href="#demo" className="hover:text-white text-green-400 transition-colors drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">تجربة حيّة</Link> */}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-white font-medium hover:bg-white/10 rounded-full">تسجيل الدخول</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-white/20 backdrop-blur-xl saturate-200 hover:bg-white/30 text-white font-bold border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.2)] rounded-full px-6 transition-all">
              ابدأ الآن
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}


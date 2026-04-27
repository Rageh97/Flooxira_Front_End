"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingWhatsAppDemo from "@/components/landing/LandingWhatsAppDemo";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingVisualConnect from "@/components/landing/LandingVisualConnect";

export default function Home() {
  return (
    <main dir="rtl" className="relative min-h-screen bg-transparent font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Design */}
      <div className="fixed inset-0 z-[-1] bg-[#060d1f] overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <LandingNavbar />
        <LandingHero />
        <LandingVisualConnect />
        <LandingFeatures />
        <LandingHowItWorks />
        {/* <LandingWhatsAppDemo /> */}
        <LandingPricing />
        <LandingCTA />
        <LandingFooter />
      </div>
    </main>
  );
}

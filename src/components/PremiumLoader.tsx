"use client";
import { FunctionComponent, useEffect, useState } from "react";
import Image from "next/image";

const PremiumLoader: FunctionComponent = () => {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0a0118]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[500px] w-[300px] h-[500px] bg-[#0072FF]/10 blur-[120px] rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[300px] w-[300px] h-[300px] bg-[#00C6FF]/10 blur-[100px] rounded-full delay-3000"></div>

      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative md:w-60 w-40 md:h-60 h-40 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-t-[#0072FF] border-r-transparent border-b-transparent border-l-transparent animate-spin-fast"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-[#00C6FF] border-b-transparent border-l-transparent animate-spin-reverse"></div>
          <div className="absolute inset-4 rounded-full border-2 border-t-transparent border-r-transparent border-b-[#5433FF] border-l-transparent animate-spin-slow"></div>
          
          {/* Central Logo/Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/Logo.png" 
              alt="flooxira logo" 
              className="md:w-50 w-30 md:h-50 h-30 object-contain animate-pulse"
            />
          </div>
        </div>

        {/* Text and Progress */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[#0072FF] via-white to-[#00C6FF] bg-clip-text text-transparent animate-pulse tracking-widest uppercase">
            Flooxira
          </h2>
          
          <div className="w-48 h-1 overflow-hidden bg-white/10 rounded-full relative">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0072FF] to-[#00C6FF] animate-progress-fill rounded-full"></div>
          </div>
          
        
        </div>
      </div>

    </div>
  );
};

export default PremiumLoader;

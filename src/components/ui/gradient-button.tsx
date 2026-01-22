"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface GradientButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: ReactNode;
  loadingText?: string;
  loadingIcon?: ReactNode;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}

export function GradientButton({
  onClick,
  disabled = false,
  loading = false,
  children,
  loadingText = "جاري المعالجة...",
  loadingIcon,
  icon,
  className = "",
  size = "md",
  showArrow = true,
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "h-10 px-3 py-2 text-xs",
    md: "h-12 px-4 py-2.5 text-sm",
    lg: "h-14 px-4 py-3 text-sm"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "group relative flex flex-row items-center bg-[#212121] justify-center gap-6 rounded-2xl font-medium shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] w-full disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:var(--bg-size)_100%] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] p-[1px] ![mask-composite:subtract]"></div>
      
      {loading ? (
        <>
          {loadingIcon && (
            <div className="size-4 text-[#ffaa40]">
              {loadingIcon}
            </div>
          )}
          {/* <div className="shrink-0 bg-border w-[1px] h-4" role="none"></div> */}
          <span className="inline animate-gradient whitespace-pre bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent [--bg-size:300%] text-center font-bold">
            {loadingText}
          </span>
        </>
      ) : (
        <>
          {icon && (
            <div className="size-4 text-[#ffaa40]">
              {icon}
            </div>
          )}
          {/* <div className="shrink-0 bg-border w-[1px] h-4" role="none"></div> */}
          <span className="inline animate-gradient whitespace-pre bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent [--bg-size:300%] text-center font-bold">
            {children}
          </span>
          {showArrow && (
            <ChevronRight className="text-[#9c40ff] size-4 transition group-hover:translate-x-[3px]" />
          )}
        </>
      )}
    </button>
  );
}
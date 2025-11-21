"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center cursor-pointer justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default: "bg-black text-white hover:bg-black/90",
      secondary: "bg-gray-200  text-gray-900",
      ghost: "bg-blue-500 text-white",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-sm",
      md: "h-9 px-4 text-sm",
      lg: "h-10 px-6 text-base",
    };
    return (
      <button ref={ref} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";










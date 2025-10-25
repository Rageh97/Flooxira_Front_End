import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-9 w-full rounded-lg  bg-[#011910] px-3 py-3 text-sm outline-none border-1 border-gray-300  placeholder:text-gray-400 text-white",
        "",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";










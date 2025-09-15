import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none ring-offset-2 placeholder:text-gray-400",
        "focus-visible:ring-2 focus-visible:ring-black",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";










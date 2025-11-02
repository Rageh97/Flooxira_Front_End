import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx(
        "min-h-24 w-full bg-[#01191040] rounded-md border border-blue-300  px-3 py-2 text-sm outline-none ring-offset-2 placeholder:text-gray-400",
        "focus-visible:ring-2 focus-visible:ring-black",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";










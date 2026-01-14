import * as React from "react"
import { clsx } from "clsx"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, maxHeight = 200, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const handleResize = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea && autoResize) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [autoResize, maxHeight]);

    React.useEffect(() => {
      handleResize();
    }, [handleResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleResize();
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        className={clsx(
          "flex min-h-[60px] w-full rounded-lg border-1 border-blue-300 bg-[#01191040] px-3 py-3 text-base text-white placeholder:text-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          autoResize && "resize-none overflow-hidden",
          className
        )}
        ref={(node) => {
          textareaRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onChange={handleChange}
        style={{
          fontSize: '16px', // منع الزوم في iOS
          maxHeight: autoResize ? `${maxHeight}px` : undefined,
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

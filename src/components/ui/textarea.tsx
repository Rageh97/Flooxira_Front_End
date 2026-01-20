import * as React from "react"
import { clsx } from "clsx"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, maxHeight = 600, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = React.useCallback(() => {
      const textarea = internalRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const borderTop = parseInt(getComputedStyle(textarea).borderTopWidth) || 0;
      const borderBottom = parseInt(getComputedStyle(textarea).borderBottomWidth) || 0;
      const newHeight = Math.min(scrollHeight + borderTop + borderBottom, maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [autoResize, maxHeight]);

    React.useEffect(() => {
      adjustHeight();
      // Listen to window resize to adjust textarea as well
      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [adjustHeight, props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) onChange(e);
    };

    return (
      <textarea
        {...props}
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onChange={handleChange}
        className={clsx(
          "flex min-h-[60px] w-full rounded-lg border border-gray-700 bg-fixed-40 px-3 py-3 text-base text-white placeholder:text-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          autoResize && "resize-none",
          className
        )}
        style={{
          ...props.style,
          maxHeight: autoResize ? `${maxHeight}px` : props.style?.maxHeight,
        }}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

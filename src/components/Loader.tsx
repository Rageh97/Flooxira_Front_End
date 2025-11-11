import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  /**
   * النص الذي يظهر تحت الـ loader
   */
  text?: string;
  
  /**
   * حجم الـ loader: 'sm' | 'md' | 'lg' | 'xl'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * لون الـ loader (primary, secondary, etc.)
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  
  /**
   * هل يعرض النص
   */
  showText?: boolean;
  
  /**
   * CSS classes إضافية
   */
  className?: string;
  
  /**
   * CSS classes للنص
   */
  textClassName?: string;
  
  /**
   * هل يعرض النقاط المتحركة
   */
  showDots?: boolean;
  
  /**
   * محاذاة: 'center' | 'start' | 'end'
   */
  align?: 'center' | 'start' | 'end';
  
  /**
   * هل يعرض داخل container كامل الشاشة
   */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
  xl: 'h-16 w-16 border-4',
};

const variantClasses = {
  primary: 'border-primary border-t-transparent',
  secondary: 'border-blue-500 border-t-transparent',
  success: 'border-emerald-500 border-t-transparent',
  warning: 'border-yellow-500 border-t-transparent',
  danger: 'border-red-500 border-t-transparent',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const alignClasses = {
  center: 'items-center justify-center',
  start: 'items-start justify-start',
  end: 'items-end justify-end',
};

/**
 * ✅ Loader Component - Reusable Loading Spinner
 * 
 * @example
 * <Loader text="جاري التحميل..." />
 * <Loader size="lg" variant="primary" fullScreen />
 * <Loader text="جاري التحقق من الصلاحيات..." showDots />
 */
export default function Loader({
  text,
  size = 'md',
  variant = 'primary',
  showText = true,
  className,
  textClassName,
  showDots = false,
  align = 'center',
  fullScreen = false,
}: LoaderProps) {
  const containerClasses = cn(
    'flex flex-col',
    alignClasses[align],
    fullScreen ? 'min-h-screen w-full' : '',
    className
  );

  const spinnerClasses = cn(
    'rounded-full animate-spin',
    sizeClasses[size],
    variantClasses[variant]
  );

  const textSize = textSizeClasses[size];

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Main Spinner */}
        <div className="relative">
          <div className={spinnerClasses}></div>
          
          {/* Optional Inner Circle */}
          {size === 'xl' || size === 'lg' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                'rounded-full bg-gradient-to-br from-primary/20 to-primary/5',
                size === 'xl' ? 'h-8 w-8' : 'h-6 w-6'
              )}></div>
            </div>
          ) : null}
        </div>

        {/* Loading Text */}
        {showText && text && (
          <div className={cn('text-gray-300 font-medium', textSize, textClassName)}>
            {text}
          </div>
        )}

        {/* Animated Dots */}
        {showDots && (
          <div className="flex justify-center gap-1 mt-2">
            <span 
              className={cn(
                'rounded-full animate-bounce',
                size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5',
                variant === 'primary' ? 'bg-blue-500' :
                variant === 'secondary' ? 'bg-blue-500' :
                variant === 'success' ? 'bg-emerald-500' :
                variant === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              )}
              style={{ animationDelay: '0s' }}
            ></span>
            <span 
              className={cn(
                'rounded-full animate-bounce',
                size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5',
                variant === 'primary' ? 'bg-primary' :
                variant === 'secondary' ? 'bg-blue-500' :
                variant === 'success' ? 'bg-emerald-500' :
                variant === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              )}
              style={{ animationDelay: '0.2s' }}
            ></span>
            <span 
              className={cn(
                'rounded-full animate-bounce',
                size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5',
                variant === 'primary' ? 'bg-primary' :
                variant === 'secondary' ? 'bg-blue-500' :
                variant === 'success' ? 'bg-emerald-500' :
                variant === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              )}
              style={{ animationDelay: '0.4s' }}
            ></span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ✅ Simple Inline Loader - للمستخدم في الأزرار والـ inline elements
 */
export function InlineLoader({ 
  size = 'sm', 
  variant = 'primary',
  className 
}: { 
  size?: 'sm' | 'md'; 
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  return (
    <div 
      className={cn(
        'inline-block rounded-full animate-spin border-t-transparent',
        size === 'sm' ? 'h-4 w-4 border-2' : 'h-5 w-5 border-2',
        variant === 'primary' ? 'border-primary' : 'border-blue-500',
        className
      )}
    />
  );
}


















import { PropsWithChildren } from "react";
import { clsx } from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("rounded-lg border border-gray-200 bg-white", className)}>{children}</div>;
}
export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("p-4 border-b border-gray-200", className)}>{children}</div>;
}
export function CardContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("p-4", className)}>{children}</div>;
}



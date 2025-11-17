import * as React from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

const baseClasses =
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
  gradient:
    "gradient-primary text-white hover:shadow-blue active:scale-[0.98] shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
  secondary:
    "border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 shadow-sm hover:shadow",
  outline:
    "border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  )
);

Button.displayName = "Button";

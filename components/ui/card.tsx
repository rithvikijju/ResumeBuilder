import * as React from "react";
import { clsx } from "clsx";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outlined" | "elevated" | "subtle" | "gradient";
  hover?: boolean;
  interactive?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, interactive = false, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white border border-gray-200 shadow-sm",
      outlined: "bg-white border-2 border-gray-300",
      elevated: "bg-white border border-gray-200 shadow-md",
      subtle: "bg-gray-50/50 border border-gray-200",
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-2xl p-6 transition-all duration-300",
          variantClasses[variant],
          hover && "hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 cursor-pointer",
          interactive && "cursor-pointer active:scale-[0.98]",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx("flex flex-col space-y-2 mb-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx("text-xl font-bold text-gray-900 tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx("text-sm text-gray-600 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx("", className)} {...props} />
));
CardContent.displayName = "CardContent";

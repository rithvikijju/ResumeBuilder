import * as React from "react";
import { clsx } from "clsx";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const baseClasses =
  "block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:shadow-md hover:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 resize-y min-h-[120px]";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={clsx(baseClasses, className)} {...props} />
  )
);

Textarea.displayName = "Textarea";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "secondary";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };

    const variantClasses = {
      default: "text-gray-500",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", sizeClasses[size], variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
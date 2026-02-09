import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  variant?: "default" | "destructive";
  showIcon?: boolean;
}

const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(
  ({ className, message, variant = "destructive", showIcon = true, ...props }, ref) => {
    const variantClasses = {
      default: "bg-muted text-foreground",
      destructive: "bg-destructive text-destructive-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center p-4 rounded-md border",
          variant === "destructive"
            ? "border-destructive/50 bg-destructive/10 text-destructive-foreground"
            : "border-muted-foreground/50 bg-muted text-foreground",
          className
        )}
        {...props}
      >
        {showIcon && (
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
        )}
        <span className="text-sm">{message}</span>
      </div>
    );
  }
);
ErrorDisplay.displayName = "ErrorDisplay";

export { ErrorDisplay };
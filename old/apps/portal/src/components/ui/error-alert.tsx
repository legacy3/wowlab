import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div
      data-slot="error-alert"
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

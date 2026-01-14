"use client";

import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { FlaskLoader, type FlaskVariant } from "./flask-loader";

interface LoaderProps {
  variant?: FlaskVariant;
  message?: string;
  className?: string;
}

export function PageLoader({
  variant = "loading",
  message,
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] gap-4",
        className,
      )}
    >
      <FlaskLoader size="xl" variant={variant} />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export function CardLoader({
  variant = "loading",
  message,
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className,
      )}
    >
      <FlaskLoader size="lg" variant={variant} />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

export function OverlayLoader({
  variant = "loading",
  message,
  className,
}: LoaderProps) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <FlaskLoader size="lg" variant={variant} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </motion.div>
  );
}

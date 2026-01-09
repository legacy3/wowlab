"use client";

import * as motion from "motion/react-client";
import { clsx } from "clsx";
import { FlaskLoader, type FlaskVariant } from "./flask-loader";
import styles from "./index.module.scss";

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
      className={clsx(styles.pageLoader, className)}
    >
      <FlaskLoader size="xl" variant={variant} />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.pageMessage}
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
      className={clsx(styles.cardLoader, className)}
    >
      <FlaskLoader size="lg" variant={variant} />
      {message && <p className={styles.cardMessage}>{message}</p>}
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
      className={clsx(styles.overlayLoader, className)}
    >
      <FlaskLoader size="lg" variant={variant} />
      {message && <p className={styles.overlayMessage}>{message}</p>}
    </motion.div>
  );
}

"use client";

import * as React from "react";
import * as motion from "motion/react-client";
import { useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import type { FlaskVariant } from "./flask-loader";
import styles from "./index.module.scss";

const MINI_FLASK_PATH =
  "M9 4h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 8V4z";

export interface FlaskInlineLoaderProps {
  className?: string;
  animate?: boolean;
  variant?: FlaskVariant;
}

function StaticFill() {
  return (
    <>
      <rect
        x="5"
        y="14"
        width="14"
        height="16"
        className={styles.inlineLiquid}
      />
      <ellipse
        cx="12"
        cy="14"
        rx="7"
        ry="1.5"
        className={styles.inlineSurface}
      />
    </>
  );
}

function LoadingFill() {
  return (
    <>
      <motion.rect
        x="5"
        y="20"
        width="14"
        height="16"
        className={styles.inlineLiquid}
        animate={{ y: [20, 10, 20] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
      <motion.ellipse
        cx="12"
        cy="20"
        rx="7"
        ry="1.5"
        className={styles.inlineSurface}
        animate={{ cy: [20, 10, 20], ry: [1.5, 2, 1.5] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </>
  );
}

function ProcessingFill() {
  return (
    <>
      <rect
        x="5"
        y="11"
        width="14"
        height="16"
        className={styles.inlineLiquid}
      />
      <motion.ellipse
        cx="12"
        cy="11"
        rx="7"
        ry="1.5"
        className={styles.inlineSurface}
        animate={{ ry: [1.5, 2, 1.5] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="10"
        cy="18"
        r="1"
        className={styles.inlineBubble}
        animate={{ cy: [18, 12], opacity: [0.7, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.circle
        cx="14"
        cy="17"
        r="0.8"
        className={styles.inlineBubble}
        animate={{ cy: [17, 11], opacity: [0.7, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.3,
        }}
      />
      <motion.circle
        cx="12"
        cy="19"
        r="0.6"
        className={styles.inlineBubble}
        animate={{ cy: [19, 13], opacity: [0.6, 0] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        }}
      />
    </>
  );
}

function IdleFill() {
  return (
    <>
      <rect
        x="5"
        y="14"
        width="14"
        height="16"
        className={styles.inlineLiquid}
      />
      <motion.ellipse
        cx="12"
        cy="14"
        rx="7"
        ry="1.5"
        className={styles.inlineSurface}
        animate={{ ry: [1.5, 1.8, 1.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

export function FlaskInlineLoader({
  className,
  animate: shouldAnimate = true,
  variant = "loading",
}: FlaskInlineLoaderProps) {
  const id = React.useId();
  const prefersReduced = useReducedMotion();
  const isStatic = prefersReduced || !shouldAnimate;

  let Fill: React.ComponentType;
  if (isStatic) {
    Fill = StaticFill;
  } else if (variant === "processing") {
    Fill = ProcessingFill;
  } else if (variant === "idle") {
    Fill = IdleFill;
  } else {
    Fill = LoadingFill;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={clsx(styles.inlineSvg, className)}
    >
      <defs>
        <clipPath id={`mini-flask-${id}`}>
          <path d={MINI_FLASK_PATH} />
        </clipPath>
      </defs>
      <path
        d={MINI_FLASK_PATH}
        className={styles.inlineOutline}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 4h10"
        className={styles.inlineRim}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g clipPath={`url(#mini-flask-${id})`}>
        <Fill />
      </g>
    </svg>
  );
}

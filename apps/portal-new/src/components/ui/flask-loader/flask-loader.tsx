"use client";

import { clsx } from "clsx";
import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-client";
import * as React from "react";

import styles from "./index.module.scss";

export interface FlaskLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: FlaskVariant;
}

export type FlaskVariant = "loading" | "processing" | "idle";

const FLASK_PATH =
  "M208 80H304V160L384 384C392 416 368 432 336 432H176C144 432 120 416 128 384L208 160V80Z";

function FlaskOutline() {
  return (
    <>
      <path d={FLASK_PATH} className={styles.flaskOutline} strokeWidth="24" />
      <path
        d="M176 80H336"
        className={styles.flaskRim}
        strokeWidth="32"
        strokeLinecap="round"
      />
    </>
  );
}

function FlaskSvg({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.flaskSvg}
    >
      <defs>
        <clipPath id={`flask-clip-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`flask-gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" className={styles.gradientStart} />
          <stop offset="100%" className={styles.gradientEnd} />
        </linearGradient>
      </defs>
      <rect
        width="512"
        height="512"
        rx="96"
        className={styles.flaskBackground}
      />
      <FlaskOutline />
      {children}
    </svg>
  );
}

function IdleFlask({ id }: { id: string }) {
  return (
    <FlaskSvg id={id}>
      <g clipPath={`url(#flask-clip-${id})`}>
        <rect
          x="100"
          y="240"
          width="320"
          height="220"
          className={styles.liquidBody}
        />
        <motion.ellipse
          cx="256"
          cy="240"
          rx="160"
          ry="28"
          className={styles.liquidSurface}
          animate={{ ry: [28, 30, 28] }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        />
      </g>
    </FlaskSvg>
  );
}

function LoadingFlask({ id }: { id: string }) {
  return (
    <FlaskSvg id={id}>
      <g clipPath={`url(#flask-clip-${id})`}>
        <motion.rect
          x="100"
          y="450"
          width="320"
          height="400"
          fill={`url(#flask-gradient-${id})`}
          animate={{ y: [450, 160, 160, 450] }}
          transition={{
            duration: 3.2,
            ease: [0.4, 0, 0.2, 1],
            repeat: Infinity,
            times: [0, 0.4, 0.5, 1],
          }}
        />
        <motion.ellipse
          cx="256"
          cy="450"
          rx="160"
          ry="28"
          className={styles.liquidSurface}
          animate={{ cy: [450, 160, 160, 450], ry: [28, 34, 34, 28] }}
          transition={{
            duration: 3.2,
            ease: [0.4, 0, 0.2, 1],
            repeat: Infinity,
            times: [0, 0.4, 0.5, 1],
          }}
        />
      </g>
      <g clipPath={`url(#flask-clip-${id})`}>
        {[
          { cx: 200, cy: [400, 200], delay: 0, duration: 2, r: 14 },
          { cx: 280, cy: [390, 210], delay: 0.6, duration: 1.8, r: 11 },
          { cx: 240, cy: [410, 190], delay: 1.2, duration: 2.2, r: 9 },
        ].map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            cy={b.cy[0]}
            r={b.r}
            className={styles.bubble}
            animate={{ cy: b.cy, opacity: [0, 0.7, 0.7, 0] }}
            transition={{
              delay: b.delay,
              duration: b.duration,
              ease: "easeOut",
              repeat: Infinity,
              times: [0, 0.1, 0.8, 1],
            }}
          />
        ))}
      </g>
    </FlaskSvg>
  );
}

function ProcessingFlask({ id }: { id: string }) {
  const bubbles = [
    { cx: 200, delay: 0, duration: 1.3, r: 12 },
    { cx: 245, delay: 0.25, duration: 1.5, r: 10 },
    { cx: 280, delay: 0.5, duration: 1.4, r: 11 },
    { cx: 220, delay: 0.75, duration: 1.2, r: 8 },
    { cx: 265, delay: 0.35, duration: 1.6, r: 13 },
    { cx: 300, delay: 0.6, duration: 1.35, r: 9 },
  ];

  return (
    <FlaskSvg id={id}>
      <g clipPath={`url(#flask-clip-${id})`}>
        <rect
          x="100"
          y="220"
          width="320"
          height="250"
          fill={`url(#flask-gradient-${id})`}
        />
        <motion.ellipse
          cx="256"
          cy="220"
          rx="160"
          ry="28"
          className={styles.liquidSurface}
          animate={{ cy: [220, 217, 222, 219, 220], ry: [28, 32, 26, 30, 28] }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
        />
        {bubbles.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            cy="400"
            r={b.r}
            className={styles.bubbleLight}
            animate={{
              cy: [400, 230],
              opacity: [0, 0.6, 0.6, 0],
              scale: [1, 1.15],
            }}
            transition={{
              delay: b.delay,
              duration: b.duration,
              ease: "easeOut",
              repeat: Infinity,
              times: [0, 0.1, 0.85, 1],
            }}
          />
        ))}
      </g>
      <motion.g opacity={0.35}>
        <motion.circle
          cx="240"
          cy="175"
          r="7"
          className={styles.steam}
          animate={{ cy: [175, 100], opacity: [0.5, 0], scale: [1, 1.6] }}
          transition={{ duration: 2.2, ease: "easeOut", repeat: Infinity }}
        />
        <motion.circle
          cx="275"
          cy="180"
          r="6"
          className={styles.steam}
          animate={{ cy: [180, 110], opacity: [0.45, 0], scale: [1, 1.5] }}
          transition={{
            delay: 0.8,
            duration: 2.4,
            ease: "easeOut",
            repeat: Infinity,
          }}
        />
      </motion.g>
    </FlaskSvg>
  );
}

function StaticFlask({ id }: { id: string }) {
  return (
    <FlaskSvg id={id}>
      <g clipPath={`url(#flask-clip-${id})`}>
        <rect
          x="100"
          y="240"
          width="320"
          height="220"
          className={styles.liquidBody}
        />
        <ellipse
          cx="256"
          cy="240"
          rx="160"
          ry="28"
          className={styles.liquidSurface}
        />
      </g>
    </FlaskSvg>
  );
}

const variants = {
  idle: IdleFlask,
  loading: LoadingFlask,
  processing: ProcessingFlask,
};

export function FlaskLoader({
  className,
  size = "md",
  variant = "loading",
}: FlaskLoaderProps) {
  const id = React.useId();
  const prefersReduced = useReducedMotion();
  const Variant = variants[variant];

  return (
    <div className={clsx(styles.container, styles[size], className)}>
      {prefersReduced ? <StaticFlask id={id} /> : <Variant id={id} />}
    </div>
  );
}

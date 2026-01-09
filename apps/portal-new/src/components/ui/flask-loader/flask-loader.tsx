"use client";

import * as React from "react";
import * as motion from "motion/react-client";
import { useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import styles from "./index.module.scss";

export type FlaskVariant = "loading" | "processing" | "idle";

export interface FlaskLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: FlaskVariant;
  className?: string;
}

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
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
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
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.5, 1],
          }}
        />
      </g>
      <g clipPath={`url(#flask-clip-${id})`}>
        {[
          { cx: 200, r: 14, cy: [400, 200], duration: 2, delay: 0 },
          { cx: 280, r: 11, cy: [390, 210], duration: 1.8, delay: 0.6 },
          { cx: 240, r: 9, cy: [410, 190], duration: 2.2, delay: 1.2 },
        ].map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            cy={b.cy[0]}
            r={b.r}
            className={styles.bubble}
            animate={{ cy: b.cy, opacity: [0, 0.7, 0.7, 0] }}
            transition={{
              duration: b.duration,
              repeat: Infinity,
              ease: "easeOut",
              delay: b.delay,
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
    { cx: 200, r: 12, delay: 0, duration: 1.3 },
    { cx: 245, r: 10, delay: 0.25, duration: 1.5 },
    { cx: 280, r: 11, delay: 0.5, duration: 1.4 },
    { cx: 220, r: 8, delay: 0.75, duration: 1.2 },
    { cx: 265, r: 13, delay: 0.35, duration: 1.6 },
    { cx: 300, r: 9, delay: 0.6, duration: 1.35 },
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
          animate={{ ry: [28, 32, 26, 30, 28], cy: [220, 217, 222, 219, 220] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
              duration: b.duration,
              repeat: Infinity,
              ease: "easeOut",
              delay: b.delay,
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
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.circle
          cx="275"
          cy="180"
          r="6"
          className={styles.steam}
          animate={{ cy: [180, 110], opacity: [0.45, 0], scale: [1, 1.5] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.8,
          }}
        />
      </motion.g>
    </FlaskSvg>
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
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
    </FlaskSvg>
  );
}

const variants = {
  loading: LoadingFlask,
  processing: ProcessingFlask,
  idle: IdleFlask,
};

export function FlaskLoader({
  size = "md",
  variant = "loading",
  className,
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

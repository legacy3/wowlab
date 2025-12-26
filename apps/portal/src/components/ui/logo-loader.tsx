"use client";

import * as React from "react";
import * as motion from "motion/react-client";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type FillVariant =
  | "fill"
  | "fill-slow"
  | "fill-simmer"
  | "fill-pulse"
  | "chromatic"
  | "tidal"
  | "effervescent"
  | "viscous"
  | "aurora"
  | "swirl"
  | "vapor"
  | "surge";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: FillVariant;
  className?: string;
}

const sizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

/**
 * Animated WoW Lab logo loader with fill animation variants.
 */
export function LogoLoader({
  size = "md",
  variant = "fill",
  className,
}: LogoLoaderProps) {
  const id = React.useId();
  const prefersReduced = useReducedMotion();

  // Static version for reduced motion
  if (prefersReduced) {
    return (
      <div className={cn("relative", sizes[size], className)}>
        <StaticLoader id={id} />
      </div>
    );
  }

  return (
    <div className={cn("relative", sizes[size], className)}>
      {variant === "fill" && <FillLoader id={id} />}
      {variant === "fill-slow" && <FillSlowLoader id={id} />}
      {variant === "fill-simmer" && <FillSimmerLoader id={id} />}
      {variant === "fill-pulse" && <FillPulseLoader id={id} />}
      {variant === "chromatic" && <ChromaticLoader id={id} />}
      {variant === "tidal" && <TidalLoader id={id} />}
      {variant === "effervescent" && <EffervescentLoader id={id} />}
      {variant === "viscous" && <ViscousLoader id={id} />}
      {variant === "aurora" && <AuroraLoader id={id} />}
      {variant === "swirl" && <SwirlLoader id={id} />}
      {variant === "vapor" && <VaporLoader id={id} />}
      {variant === "surge" && <SurgeLoader id={id} />}
    </div>
  );
}

// Shared flask path for clip paths
const FLASK_PATH =
  "M208 80H304V160L384 384C392 416 368 432 336 432H176C144 432 120 416 128 384L208 160V80Z";

// Base flask outline component
function FlaskOutline({ strokeOpacity = 1 }: { strokeOpacity?: number }) {
  return (
    <>
      <path
        d={FLASK_PATH}
        className="fill-primary/20 stroke-primary"
        strokeOpacity={strokeOpacity}
        strokeWidth="24"
      />
      <path
        d="M176 80H336"
        className="stroke-primary"
        strokeOpacity={strokeOpacity}
        strokeWidth="32"
        strokeLinecap="round"
      />
    </>
  );
}

// Static loader for reduced motion
function StaticLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-static-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-static-${id})`}>
        {/* Static fill at 65% */}
        <rect
          x="100"
          y="240"
          width="320"
          height="220"
          className="fill-primary/50"
        />
        <ellipse
          cx="256"
          cy="240"
          rx="160"
          ry="28"
          className="fill-primary/70"
        />
      </g>

      {/* Subtle opacity pulse via CSS */}
      <motion.ellipse
        cx="256"
        cy="300"
        rx="80"
        ry="60"
        className="fill-primary/10"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

// Variant 1: Standard fill - smooth rise and fall (2.6s)
function FillLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient id={`liquid-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.6"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-${id})`}>
        {/* Main liquid body - 2.6s with plateau at top */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-${id})`}
          animate={{ y: [450, 160, 160, 450] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.5, 1],
          }}
        />

        {/* Wave surface */}
        <motion.ellipse
          cx="256"
          rx="160"
          ry="28"
          className="fill-primary/80"
          animate={{
            cy: [450, 160, 160, 450],
            ry: [28, 34, 34, 28],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.5, 1],
          }}
        />
      </g>

      {/* Independent rising bubbles - decoupled from liquid */}
      <g clipPath={`url(#flask-${id})`}>
        <motion.circle
          cx="200"
          r="14"
          className="fill-primary/75"
          animate={{
            cy: [400, 200],
            opacity: [0, 0.75, 0.75, 0],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.4,
            times: [0, 0.1, 0.8, 1],
          }}
        />
        <motion.circle
          cx="280"
          r="11"
          className="fill-primary/70"
          animate={{
            cy: [390, 210],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.5,
            repeatDelay: 0.5,
            times: [0, 0.1, 0.8, 1],
          }}
        />
        <motion.circle
          cx="240"
          r="9"
          className="fill-primary/65"
          animate={{
            cy: [410, 190],
            opacity: [0, 0.65, 0.65, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1.0,
            repeatDelay: 0.3,
            times: [0, 0.1, 0.8, 1],
          }}
        />
        <motion.circle
          cx="310"
          r="8"
          className="fill-primary/60"
          animate={{
            cy: [395, 215],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1.5,
            repeatDelay: 0.6,
            times: [0, 0.1, 0.8, 1],
          }}
        />
      </g>
    </svg>
  );
}

// Variant 2: Slow fill - relaxed, zen-like (4.8s)
function FillSlowLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-slow-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-slow-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.85"
          />
          <stop
            offset="50%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.7"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.55"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-slow-${id})`}>
        {/* Main liquid - 4.8s, reduced swing (450 → 180) */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-slow-${id})`}
          animate={{ y: [450, 180, 450] }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        />

        {/* Gentle wave */}
        <motion.ellipse
          cx="256"
          rx="160"
          ry="24"
          className="fill-primary/75"
          animate={{
            cy: [450, 180, 450],
            ry: [24, 30, 24],
          }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      </g>

      {/* Slow rising bubbles - 3 bubbles for variety */}
      <g clipPath={`url(#flask-slow-${id})`}>
        <motion.circle
          cx="220"
          r="12"
          className="fill-primary/70"
          animate={{
            cy: [420, 200],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeOut",
            repeatDelay: 0.8,
            times: [0, 0.1, 0.85, 1],
          }}
        />
        <motion.circle
          cx="290"
          r="10"
          className="fill-primary/65"
          animate={{
            cy: [415, 210],
            opacity: [0, 0.65, 0.65, 0],
          }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1.2,
            repeatDelay: 0.6,
            times: [0, 0.1, 0.85, 1],
          }}
        />
        <motion.circle
          cx="250"
          r="8"
          className="fill-primary/60"
          animate={{
            cy: [425, 195],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 3.0,
            repeat: Infinity,
            ease: "easeOut",
            delay: 2.4,
            repeatDelay: 1.0,
            times: [0, 0.1, 0.85, 1],
          }}
        />
      </g>
    </svg>
  );
}

// Variant 3: Simmer - filled with active bubbling (reduced noise)
function FillSimmerLoader({ id }: { id: string }) {
  // 6 bubbles max, varied timing
  const bubbles = [
    { cx: 200, r: 12, delay: 0, duration: 1.3 },
    { cx: 245, r: 10, delay: 0.25, duration: 1.5 },
    { cx: 280, r: 11, delay: 0.5, duration: 1.4 },
    { cx: 220, r: 8, delay: 0.75, duration: 1.2 },
    { cx: 265, r: 13, delay: 0.35, duration: 1.6 },
    { cx: 300, r: 9, delay: 0.6, duration: 1.35 },
  ];

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-simmer-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-simmer-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.6"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-simmer-${id})`}>
        {/* Static filled liquid */}
        <rect
          x="100"
          y="220"
          width="320"
          height="250"
          fill={`url(#liquid-simmer-${id})`}
        />

        {/* Agitated surface - 1.2s, gentler motion */}
        <motion.ellipse
          cx="256"
          cy="220"
          rx="160"
          ry="28"
          className="fill-primary/80"
          animate={{
            ry: [28, 32, 26, 30, 28],
            cy: [220, 217, 222, 219, 220],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* 6 bubbles with reduced opacity */}
        {bubbles.map((bubble, i) => (
          <motion.circle
            key={i}
            cx={bubble.cx}
            r={bubble.r}
            className="fill-primary/60"
            animate={{
              cy: [400, 230],
              opacity: [0, 0.6, 0.6, 0],
              scale: [1, 1.15],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: "easeOut",
              delay: bubble.delay,
              times: [0, 0.1, 0.85, 1],
            }}
          />
        ))}
      </g>

      {/* 2 steam wisps - slower, 2.2s */}
      <motion.g opacity={0.35}>
        <motion.circle
          cx="240"
          r="7"
          className="fill-primary"
          animate={{
            cy: [175, 100],
            opacity: [0.5, 0],
            scale: [1, 1.6],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.circle
          cx="275"
          r="6"
          className="fill-primary"
          animate={{
            cy: [180, 110],
            opacity: [0.45, 0],
            scale: [1, 1.5],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.8,
          }}
        />
      </motion.g>
    </svg>
  );
}

// Variant 4: Pulse fill - calm breathing (3.2s)
function FillPulseLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-pulse-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-pulse-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.85"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.5"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />

      {/* Subtle glow behind flask - reduced amplitude */}
      <motion.ellipse
        cx="256"
        cy="300"
        rx="100"
        ry="120"
        className="fill-primary/15"
        animate={{
          opacity: [0.12, 0.25, 0.12],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "256px 300px" }}
      />

      <FlaskOutline strokeOpacity={0.9} />

      <g clipPath={`url(#flask-pulse-${id})`}>
        {/* Breathing liquid level - 3.2s, gentle */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-pulse-${id})`}
          animate={{
            y: [260, 230, 260],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Breathing surface */}
        <motion.ellipse
          cx="256"
          rx="160"
          ry="28"
          className="fill-primary/80"
          animate={{
            cy: [260, 230, 260],
            ry: [28, 32, 28],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Static bubbles with subtle opacity pulse only */}
        <motion.circle
          cx="210"
          cy="320"
          r="18"
          className="fill-primary"
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx="280"
          cy="345"
          r="14"
          className="fill-primary"
          animate={{
            opacity: [0.45, 0.65, 0.45],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.circle
          cx="245"
          cy="380"
          r="11"
          className="fill-primary"
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.0,
          }}
        />
      </g>
    </svg>
  );
}

// Variant 5: Chromatic Brew - hue cycling like shifting chemicals
function ChromaticLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-chromatic-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-chromatic-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <motion.stop
            offset="0%"
            stopOpacity="0.9"
            animate={{
              stopColor: [
                "#4ad9ff",
                "#7bff6a",
                "#ff7ad9",
                "#ffb347",
                "#4ad9ff",
              ],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.stop
            offset="100%"
            stopOpacity="0.6"
            animate={{
              stopColor: [
                "#2196f3",
                "#4caf50",
                "#e91e63",
                "#ff9800",
                "#2196f3",
              ],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-chromatic-${id})`}>
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-chromatic-${id})`}
          animate={{ y: [450, 180, 180, 450] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.35, 0.5, 1],
          }}
        />

        <motion.ellipse
          cx="256"
          rx="160"
          ry="28"
          animate={{
            cy: [450, 180, 180, 450],
            ry: [28, 34, 34, 28],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.35, 0.5, 1],
          }}
        >
          <animate
            attributeName="fill"
            values="#4ad9ff;#7bff6a;#ff7ad9;#ffb347;#4ad9ff"
            dur="5.5s"
            repeatCount="indefinite"
          />
        </motion.ellipse>
      </g>
    </svg>
  );
}

// Variant 6: Tidal Slosh - surface sloshes side-to-side
function TidalLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-tidal-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-tidal-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.6"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-tidal-${id})`}>
        <motion.g
          animate={{
            x: [-8, 8, -8],
            rotate: [-1.5, 1.5, -1.5],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "256px 300px" }}
        >
          {/* Main liquid */}
          <rect
            x="100"
            y="200"
            width="320"
            height="280"
            fill={`url(#liquid-tidal-${id})`}
          />

          {/* Tilting wave surface */}
          <motion.ellipse
            cx="256"
            cy="200"
            rx="160"
            ry="28"
            className="fill-primary/80"
            animate={{
              ry: [28, 36, 28],
              cy: [200, 195, 200],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.g>

        {/* Bubbles affected by tilt */}
        <motion.circle
          cx="220"
          r="10"
          className="fill-primary/60"
          animate={{
            cy: [380, 220],
            cx: [220, 240, 200, 220],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
            times: [0, 0.1, 0.85, 1],
          }}
        />
        <motion.circle
          cx="290"
          r="8"
          className="fill-primary/55"
          animate={{
            cy: [390, 230],
            cx: [290, 270, 310, 290],
            opacity: [0, 0.55, 0.55, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.8,
            times: [0, 0.1, 0.85, 1],
          }}
        />
      </g>
    </svg>
  );
}

// Variant 7: Effervescent - bubbles burst at surface with rings
function EffervescentLoader({ id }: { id: string }) {
  const bubbles = [
    { cx: 200, delay: 0 },
    { cx: 240, delay: 0.3 },
    { cx: 280, delay: 0.6 },
    { cx: 260, delay: 0.9 },
    { cx: 220, delay: 1.2 },
  ];

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-efferv-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-efferv-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.85"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.55"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-efferv-${id})`}>
        {/* Static filled liquid */}
        <rect
          x="100"
          y="220"
          width="320"
          height="250"
          fill={`url(#liquid-efferv-${id})`}
        />

        {/* Gentle surface */}
        <motion.ellipse
          cx="256"
          cy="220"
          rx="160"
          ry="26"
          className="fill-primary/80"
          animate={{
            ry: [26, 30, 26],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Rising bubbles */}
        {bubbles.map((bubble, i) => (
          <motion.circle
            key={i}
            cx={bubble.cx}
            r="10"
            className="fill-primary/65"
            animate={{
              cy: [400, 225],
              r: [8, 12, 0],
              opacity: [0, 0.65, 0.65, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: bubble.delay,
              times: [0, 0.1, 0.85, 1],
            }}
          />
        ))}

        {/* Burst rings at surface */}
        {bubbles.map((bubble, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={bubble.cx}
            cy="218"
            className="stroke-primary/50 fill-none"
            strokeWidth="2"
            animate={{
              r: [0, 18, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: bubble.delay + 1.3,
            }}
          />
        ))}
      </g>
    </svg>
  );
}

// Variant 8: Viscous Drip - thick liquid with droplet formation
function ViscousLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-viscous-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-viscous-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.95"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.7"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-viscous-${id})`}>
        {/* Main liquid body */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-viscous-${id})`}
          animate={{ y: [420, 200, 200, 420] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.55, 1],
          }}
        />

        {/* Surface with bulge for drip formation */}
        <motion.path
          className="fill-primary/85"
          animate={{
            d: [
              "M96 420 Q176 420 256 420 Q336 420 416 420 Q416 400 256 400 Q96 400 96 420 Z",
              "M96 200 Q176 200 256 200 Q336 200 416 200 Q416 170 256 180 Q96 170 96 200 Z",
              "M96 200 Q176 200 256 240 Q336 200 416 200 Q416 170 256 180 Q96 170 96 200 Z",
              "M96 200 Q176 200 256 200 Q336 200 416 200 Q416 170 256 180 Q96 170 96 200 Z",
              "M96 420 Q176 420 256 420 Q336 420 416 420 Q416 400 256 400 Q96 400 96 420 Z",
            ],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.4, 0.5, 0.55, 1],
          }}
        />

        {/* Drip droplet */}
        <motion.ellipse
          cx="256"
          rx="16"
          className="fill-primary/90"
          animate={{
            cy: [200, 200, 240, 350, 400],
            ry: [0, 16, 24, 16, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.45, 0.52, 0.7, 0.85],
          }}
        />
      </g>
    </svg>
  );
}

// Variant 9: Aurora - slow-moving gradient waves with glow
function AuroraLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-aurora-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-aurora-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <motion.stop
            offset="0%"
            stopOpacity="0.9"
            animate={{ stopOpacity: [0.7, 0.95, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="[stop-color:hsl(var(--primary))]"
          />
          <motion.stop
            offset="50%"
            stopOpacity="0.7"
            animate={{ offset: ["40%", "60%", "40%"] as unknown as string[] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="[stop-color:hsl(var(--primary))]"
          />
          <motion.stop
            offset="100%"
            stopOpacity="0.5"
            animate={{ stopOpacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="[stop-color:hsl(var(--primary))]"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />

      {/* Outer glow */}
      <motion.ellipse
        cx="256"
        cy="300"
        rx="110"
        ry="130"
        className="fill-primary/10"
        animate={{
          opacity: [0.08, 0.2, 0.08],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "256px 300px" }}
      />

      <FlaskOutline strokeOpacity={0.85} />

      <g clipPath={`url(#flask-aurora-${id})`}>
        {/* Breathing liquid */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-aurora-${id})`}
          animate={{ y: [280, 200, 280] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.ellipse
          cx="256"
          rx="160"
          ry="30"
          className="fill-primary/75"
          animate={{
            cy: [280, 200, 280],
            ry: [30, 38, 30],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner wave shimmer */}
        <motion.ellipse
          cx="256"
          rx="100"
          ry="50"
          className="fill-primary/20"
          animate={{
            cy: [340, 260, 340],
            ry: [50, 65, 50],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </g>
    </svg>
  );
}

// Variant 10: Magnetic Swirl - liquid rotates in slow vortex
function SwirlLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-swirl-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-swirl-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.6"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-swirl-${id})`}>
        {/* Main liquid */}
        <rect
          x="100"
          y="200"
          width="320"
          height="280"
          fill={`url(#liquid-swirl-${id})`}
        />

        {/* Surface */}
        <motion.ellipse
          cx="256"
          cy="200"
          rx="160"
          ry="28"
          className="fill-primary/80"
          animate={{
            ry: [28, 32, 28],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Rotating swirl patterns */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "256px 320px" }}
        >
          <motion.ellipse
            cx="256"
            cy="320"
            rx="80"
            ry="40"
            className="stroke-primary/40 fill-none"
            strokeWidth="3"
            strokeDasharray="20 30"
            animate={{
              ry: [40, 50, 40],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.ellipse
            cx="256"
            cy="360"
            rx="60"
            ry="25"
            className="stroke-primary/30 fill-none"
            strokeWidth="2"
            strokeDasharray="15 25"
            animate={{
              ry: [25, 35, 25],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </motion.g>

        {/* Swirling bubbles */}
        <motion.circle
          r="10"
          className="fill-primary/60"
          animate={{
            cx: [200, 280, 320, 240, 200],
            cy: [380, 350, 300, 280, 380],
            opacity: [0, 0.6, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          r="7"
          className="fill-primary/50"
          animate={{
            cx: [300, 220, 200, 280, 300],
            cy: [370, 340, 290, 270, 370],
            opacity: [0, 0.5, 0.5, 0.5, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </g>
    </svg>
  );
}

// Variant 11: Vapor Pulse - steam puffs rise above neck
function VaporLoader({ id }: { id: string }) {
  const steamPuffs = [
    { cx: 230, delay: 0 },
    { cx: 256, delay: 0.6 },
    { cx: 282, delay: 1.2 },
  ];

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-vapor-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-vapor-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.65"
          />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />
      <FlaskOutline />

      <g clipPath={`url(#flask-vapor-${id})`}>
        {/* Breathing liquid */}
        <motion.rect
          x="100"
          width="320"
          height="400"
          fill={`url(#liquid-vapor-${id})`}
          animate={{ y: [250, 220, 250] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.ellipse
          cx="256"
          rx="160"
          ry="28"
          className="fill-primary/85"
          animate={{
            cy: [250, 220, 250],
            ry: [28, 34, 28],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Subtle bubbles */}
        <motion.circle
          cx="230"
          r="8"
          className="fill-primary/50"
          animate={{
            cy: [380, 260],
            opacity: [0, 0.5, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            times: [0, 0.1, 0.85, 1],
          }}
        />
        <motion.circle
          cx="280"
          r="6"
          className="fill-primary/45"
          animate={{
            cy: [390, 270],
            opacity: [0, 0.45, 0.45, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.8,
            times: [0, 0.1, 0.85, 1],
          }}
        />
      </g>

      {/* Steam puffs above flask */}
      {steamPuffs.map((puff, i) => (
        <motion.g key={i}>
          <motion.circle
            cx={puff.cx}
            r="12"
            className="fill-primary/30"
            animate={{
              cy: [165, 90],
              opacity: [0, 0.4, 0],
              scale: [0.6, 1.4],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: puff.delay,
            }}
            style={{ transformOrigin: `${puff.cx}px 130px` }}
          />
          <motion.circle
            cx={puff.cx + 8}
            r="8"
            className="fill-primary/20"
            animate={{
              cy: [170, 100],
              opacity: [0, 0.3, 0],
              scale: [0.5, 1.3],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeOut",
              delay: puff.delay + 0.3,
            }}
            style={{ transformOrigin: `${puff.cx + 8}px 135px` }}
          />
        </motion.g>
      ))}
    </svg>
  );
}

// Variant 12: Ion Surge - bright charge wave through liquid
function SurgeLoader({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <clipPath id={`flask-surge-${id}`}>
          <path d={FLASK_PATH} />
        </clipPath>
        <linearGradient
          id={`liquid-surge-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.85"
          />
          <stop
            offset="100%"
            className="[stop-color:hsl(var(--primary))]"
            stopOpacity="0.55"
          />
        </linearGradient>
        <linearGradient
          id={`surge-band-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="96" className="fill-background" />

      {/* Surge glow behind flask */}
      <motion.ellipse
        cx="256"
        cy="300"
        rx="100"
        ry="120"
        className="fill-primary/15"
        animate={{
          opacity: [0.05, 0.25, 0.05],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.4,
        }}
        style={{ transformOrigin: "256px 300px" }}
      />

      <FlaskOutline />

      <g clipPath={`url(#flask-surge-${id})`}>
        {/* Static filled liquid */}
        <rect
          x="100"
          y="200"
          width="320"
          height="280"
          fill={`url(#liquid-surge-${id})`}
        />

        {/* Surface */}
        <motion.ellipse
          cx="256"
          cy="200"
          rx="160"
          ry="28"
          className="fill-primary/80"
          animate={{
            ry: [28, 32, 28],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Moving charge band */}
        <motion.rect
          x="-60"
          y="200"
          width="80"
          height="280"
          fill={`url(#surge-band-${id})`}
          animate={{
            x: [-60, 440],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.8,
          }}
        />

        {/* Secondary fainter band */}
        <motion.rect
          x="-60"
          y="200"
          width="40"
          height="280"
          fill={`url(#surge-band-${id})`}
          style={{ opacity: 0.5 }}
          animate={{
            x: [-60, 440],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.8,
            delay: 0.2,
          }}
        />
      </g>

      {/* Spark particles */}
      <g clipPath={`url(#flask-surge-${id})`}>
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cy={280 + i * 50}
            r="4"
            className="fill-white/70"
            animate={{
              cx: [120, 400],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0.8,
              delay: i * 0.15,
            }}
          />
        ))}
      </g>
    </svg>
  );
}

// Full-page loader component
interface PageLoaderProps {
  variant?: FillVariant;
  message?: string;
  className?: string;
}

export function PageLoader({
  variant = "fill",
  message,
  className,
}: PageLoaderProps) {
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
      <LogoLoader size="xl" variant={variant} />
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

// Inline loader for buttons (dots)
export function InlineLoader({ className }: { className?: string }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
          />
        ))}
      </span>
    );
  }

  return (
    <motion.span
      className={cn("inline-flex items-center gap-1", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{
            y: [0, -3, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.span>
  );
}

// Mini flask inline loader
export function FlaskInlineLoader({ className }: { className?: string }) {
  const id = React.useId();
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4", className)}>
        <path
          d="M9 2h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 6V2z"
          className="stroke-current fill-current/30"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7 2h10"
          className="stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4", className)}>
      <defs>
        <clipPath id={`mini-flask-${id}`}>
          <path d="M9 2h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 6V2z" />
        </clipPath>
      </defs>

      {/* Flask outline */}
      <path
        d="M9 2h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 6V2z"
        className="stroke-current fill-current/10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 2h10"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Animated fill */}
      <g clipPath={`url(#mini-flask-${id})`}>
        <motion.rect
          x="5"
          width="14"
          height="16"
          className="fill-current/60"
          animate={{ y: [18, 8, 18] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
        <motion.ellipse
          cx="12"
          rx="7"
          ry="1.5"
          className="fill-current/80"
          animate={{
            cy: [18, 8, 18],
            ry: [1.5, 2, 1.5],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </g>
    </svg>
  );
}

// Card loader - for use inside cards
interface CardLoaderProps {
  variant?: FillVariant;
  message?: string;
  className?: string;
}

export function CardLoader({
  variant = "fill",
  message,
  className,
}: CardLoaderProps) {
  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className,
      )}
    >
      <LogoLoader size="lg" variant={variant} />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

// Overlay loader - covers parent with loader
interface OverlayLoaderProps {
  variant?: FillVariant;
  message?: string;
  className?: string;
}

export function OverlayLoader({
  variant = "fill",
  message,
  className,
}: OverlayLoaderProps) {
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
      <LogoLoader size="lg" variant={variant} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </motion.div>
  );
}

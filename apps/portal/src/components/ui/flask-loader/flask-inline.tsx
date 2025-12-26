"use client";

import * as React from "react";
import * as motion from "motion/react-client";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const MINI_FLASK_PATH =
  "M9 2h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 6V2z";

export interface FlaskInlineLoaderProps {
  className?: string;
  animate?: boolean;
}

export function FlaskInlineLoader({
  className,
  animate: shouldAnimate = true,
}: FlaskInlineLoaderProps) {
  const id = React.useId();
  const prefersReduced = useReducedMotion();
  const isStatic = prefersReduced || !shouldAnimate;

  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("w-4 h-4", className)}>
      <defs>
        <clipPath id={`mini-flask-${id}`}>
          <path d={MINI_FLASK_PATH} />
        </clipPath>
      </defs>
      <path
        d={MINI_FLASK_PATH}
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
      <g clipPath={`url(#mini-flask-${id})`}>
        {isStatic ? (
          <>
            <rect
              x="5"
              y="12"
              width="14"
              height="16"
              className="fill-current/60"
            />
            <ellipse
              cx="12"
              cy="12"
              rx="7"
              ry="1.5"
              className="fill-current/80"
            />
          </>
        ) : (
          <>
            <motion.rect
              x="5"
              width="14"
              height="16"
              className="fill-current/60"
              animate={{ y: [18, 8, 18] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
            <motion.ellipse
              cx="12"
              rx="7"
              ry="1.5"
              className="fill-current/80"
              animate={{ cy: [18, 8, 18], ry: [1.5, 2, 1.5] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </>
        )}
      </g>
    </svg>
  );
}

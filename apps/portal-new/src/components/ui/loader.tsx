"use client";

import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-client";
import * as React from "react";
import { type HTMLStyledProps, styled } from "styled-system/jsx";
import { loader, type LoaderVariantProps } from "styled-system/recipes";

export interface LoaderProps
  extends LoaderVariantProps, Omit<HTMLStyledProps<"div">, "size"> {
  variant?: LoaderVariant;
}

export type LoaderVariant = "loading" | "processing" | "idle";

const FLASK_PATH =
  "M208 80H304V160L384 384C392 416 368 432 336 432H176C144 432 120 416 128 384L208 160V80Z";
const MINI_FLASK_PATH =
  "M9 4h6v4l4 10c.5 1.5-.5 2-1.5 2h-11c-1 0-2-.5-1.5-2L9 8V4z";

// Detailed SVG for larger sizes (md, lg, xl)
function DetailedFlaskOutline() {
  return (
    <>
      <path
        d={FLASK_PATH}
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="24"
      />
      <path
        d="M176 80H336"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
      />
    </>
  );
}

function DetailedFlaskSvg({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "100%", width: "100%" }}
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
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <DetailedFlaskOutline />
      {children}
    </svg>
  );
}

function DetailedIdleFill({ id }: { id: string }) {
  return (
    <g clipPath={`url(#flask-clip-${id})`}>
      <rect
        x="100"
        y="240"
        width="320"
        height="220"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <motion.ellipse
        cx="256"
        cy="240"
        rx="160"
        fill="currentColor"
        fillOpacity="0.7"
        animate={{ ry: [28, 30, 28] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
      />
    </g>
  );
}

function DetailedLoadingFill({ id }: { id: string }) {
  return (
    <>
      <g clipPath={`url(#flask-clip-${id})`}>
        <motion.rect
          x="100"
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
          rx="160"
          fill="currentColor"
          fillOpacity="0.8"
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
            r={b.r}
            fill="currentColor"
            fillOpacity="0.7"
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
    </>
  );
}

function DetailedProcessingFill({ id }: { id: string }) {
  const bubbles = [
    { cx: 200, delay: 0, duration: 1.3, r: 12 },
    { cx: 245, delay: 0.25, duration: 1.5, r: 10 },
    { cx: 280, delay: 0.5, duration: 1.4, r: 11 },
    { cx: 220, delay: 0.75, duration: 1.2, r: 8 },
    { cx: 265, delay: 0.35, duration: 1.6, r: 13 },
    { cx: 300, delay: 0.6, duration: 1.35, r: 9 },
  ];
  return (
    <>
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
          fill="currentColor"
          fillOpacity="0.8"
          animate={{ cy: [220, 217, 222, 219, 220], ry: [28, 32, 26, 30, 28] }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
        />
        {bubbles.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx}
            r={b.r}
            fill="currentColor"
            fillOpacity="0.6"
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
          r="7"
          fill="currentColor"
          animate={{ cy: [175, 100], opacity: [0.5, 0], scale: [1, 1.6] }}
          transition={{ duration: 2.2, ease: "easeOut", repeat: Infinity }}
        />
        <motion.circle
          cx="275"
          r="6"
          fill="currentColor"
          animate={{ cy: [180, 110], opacity: [0.45, 0], scale: [1, 1.5] }}
          transition={{
            delay: 0.8,
            duration: 2.4,
            ease: "easeOut",
            repeat: Infinity,
          }}
        />
      </motion.g>
    </>
  );
}

function DetailedStaticFill({ id }: { id: string }) {
  return (
    <g clipPath={`url(#flask-clip-${id})`}>
      <rect
        x="100"
        y="240"
        width="320"
        height="220"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <ellipse
        cx="256"
        cy="240"
        rx="160"
        ry="28"
        fill="currentColor"
        fillOpacity="0.7"
      />
    </g>
  );
}

function MiniFlaskSvg({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      style={{ height: "100%", width: "100%" }}
    >
      <defs>
        <clipPath id={`mini-flask-${id}`}>
          <path d={MINI_FLASK_PATH} />
        </clipPath>
      </defs>
      <path
        d={MINI_FLASK_PATH}
        stroke="currentColor"
        fill="currentColor"
        fillOpacity="0.1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 4h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g clipPath={`url(#mini-flask-${id})`}>{children}</g>
    </svg>
  );
}

function MiniIdleFill() {
  return (
    <>
      <rect
        x="5"
        y="14"
        width="14"
        height="16"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <motion.ellipse
        cx="12"
        cy="14"
        rx="7"
        fill="currentColor"
        fillOpacity="0.8"
        animate={{ ry: [1.5, 1.8, 1.5] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
      />
    </>
  );
}

function MiniLoadingFill() {
  return (
    <>
      <motion.rect
        x="5"
        width="14"
        height="16"
        fill="currentColor"
        fillOpacity="0.6"
        animate={{ y: [20, 10, 20] }}
        transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1], repeat: Infinity }}
      />
      <motion.ellipse
        cx="12"
        rx="7"
        fill="currentColor"
        fillOpacity="0.8"
        animate={{ cy: [20, 10, 20], ry: [1.5, 2, 1.5] }}
        transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1], repeat: Infinity }}
      />
    </>
  );
}

function MiniProcessingFill() {
  return (
    <>
      <rect
        x="5"
        y="11"
        width="14"
        height="16"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <motion.ellipse
        cx="12"
        cy="11"
        rx="7"
        fill="currentColor"
        fillOpacity="0.8"
        animate={{ ry: [1.5, 2, 1.5] }}
        transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.circle
        cx="10"
        r="1"
        fill="currentColor"
        fillOpacity="0.7"
        animate={{ cy: [18, 12], opacity: [0.7, 0] }}
        transition={{ duration: 0.9, ease: "easeOut", repeat: Infinity }}
      />
      <motion.circle
        cx="14"
        r="0.8"
        fill="currentColor"
        fillOpacity="0.7"
        animate={{ cy: [17, 11], opacity: [0.7, 0] }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeOut",
          repeat: Infinity,
        }}
      />
      <motion.circle
        cx="12"
        r="0.6"
        fill="currentColor"
        fillOpacity="0.7"
        animate={{ cy: [19, 13], opacity: [0.6, 0] }}
        transition={{
          delay: 0.5,
          duration: 1,
          ease: "easeOut",
          repeat: Infinity,
        }}
      />
    </>
  );
}

// Mini SVG for smaller sizes (xs, sm)
function MiniStaticFill() {
  return (
    <>
      <rect
        x="5"
        y="14"
        width="14"
        height="16"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <ellipse
        cx="12"
        cy="14"
        rx="7"
        ry="1.5"
        fill="currentColor"
        fillOpacity="0.8"
      />
    </>
  );
}

const StyledLoader = styled("div", loader);

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  function Loader(props, ref) {
    const { size = "md", variant = "loading", ...rest } = props;
    const id = React.useId();
    const prefersReduced = useReducedMotion();

    const isMini = size === "xs" || size === "sm";

    if (isMini) {
      let Fill: React.ComponentType;
      if (prefersReduced) {
        Fill = MiniStaticFill;
      } else if (variant === "processing") {
        Fill = MiniProcessingFill;
      } else if (variant === "idle") {
        Fill = MiniIdleFill;
      } else {
        Fill = MiniLoadingFill;
      }

      return (
        <StyledLoader
          ref={ref}
          size={size}
          role="status"
          aria-label="Loading"
          {...rest}
        >
          <MiniFlaskSvg id={id}>
            <Fill />
          </MiniFlaskSvg>
        </StyledLoader>
      );
    }

    let Fill: React.ComponentType<{ id: string }>;
    if (prefersReduced) {
      Fill = DetailedStaticFill;
    } else if (variant === "processing") {
      Fill = DetailedProcessingFill;
    } else if (variant === "idle") {
      Fill = DetailedIdleFill;
    } else {
      Fill = DetailedLoadingFill;
    }

    return (
      <StyledLoader
        ref={ref}
        size={size}
        role="status"
        aria-label="Loading"
        {...rest}
      >
        <DetailedFlaskSvg id={id}>
          <Fill id={id} />
        </DetailedFlaskSvg>
      </StyledLoader>
    );
  },
);

// Convenience alias for button loading state
export const InlineLoader = React.forwardRef<
  HTMLDivElement,
  Omit<LoaderProps, "size">
>(function InlineLoader(props, ref) {
  return <Loader ref={ref} size="xs" {...props} />;
});

export type InlineLoaderProps = Omit<LoaderProps, "size">;

// Wrapper components for common use cases
export interface LoaderWrapperProps {
  className?: string;
  message?: string;
  variant?: LoaderVariant;
}

const MotionP = motion.p;

export function CardLoader({
  className,
  message,
  variant = "loading",
}: LoaderWrapperProps) {
  return (
    <styled.div
      role="status"
      aria-label={message || "Loading"}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      py="12"
      gap="3"
      color="colorPalette.solid.bg"
      className={className}
    >
      <Loader size="lg" variant={variant} />
      {message && (
        <styled.p textStyle="xs" color="fg.muted">
          {message}
        </styled.p>
      )}
    </styled.div>
  );
}

export function PageLoader({
  className,
  message,
  variant = "loading",
}: LoaderWrapperProps) {
  return (
    <styled.div
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      minH="400px"
      gap="4"
      color="colorPalette.solid.bg"
      className={className}
    >
      <Loader size="xl" variant={variant} />
      {message && (
        <MotionP
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <styled.span textStyle="sm" color="fg.muted">
            {message}
          </styled.span>
        </MotionP>
      )}
    </styled.div>
  );
}

const MotionDiv = motion.div;

export function OverlayLoader({
  className,
  message,
  variant = "loading",
}: LoaderWrapperProps) {
  return (
    <MotionDiv
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={className}
    >
      <styled.div
        pos="absolute"
        inset="0"
        zIndex="10"
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
        bg="gray.1/80"
        backdropFilter="blur(4px)"
        color="colorPalette.solid.bg"
      >
        <Loader size="lg" variant={variant} />
        {message && (
          <styled.p textStyle="sm" color="fg.muted">
            {message}
          </styled.p>
        )}
      </styled.div>
    </MotionDiv>
  );
}

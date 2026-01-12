"use client";

import Image from "next/image";
import { css, cx } from "styled-system/css";

import { env } from "@/lib/env";

interface GameIconProps {
  alt?: string;
  className?: string;
  iconName: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

const SIZE_DIMENSIONS = {
  lg: 56,
  md: 36,
  sm: 18,
} as const;

const SIZE_URLS = {
  lg: "large",
  md: "medium",
  sm: "small",
} as const;

export function GameIcon({
  alt,
  className,
  iconName,
  size = "md",
}: GameIconProps) {
  if (!iconName) {
    return (
      <div
        className={cx(
          css({
            alignItems: "center",
            bg: "bg.muted",
            color: "fg.muted",
            display: "flex",
            fontSize: "xs",
            justifyContent: "center",
            rounded: "sm",
          }),
          className,
        )}
        style={{
          height: SIZE_DIMENSIONS[size],
          width: SIZE_DIMENSIONS[size],
        }}
      >
        ?
      </div>
    );
  }

  const url = `${env.SUPABASE_URL}/functions/v1/icons/${SIZE_URLS[size]}/${iconName}.jpg`;
  const dimension = SIZE_DIMENSIONS[size];

  return (
    <Image
      src={url}
      alt={alt || iconName}
      width={dimension}
      height={dimension}
      className={cx(
        css({
          bg: "bg.muted",
          rounded: "sm",
        }),
        className,
      )}
      unoptimized
    />
  );
}

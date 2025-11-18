import Image from "next/image";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

interface GameIconProps {
  iconName: string;
  size?: "small" | "medium" | "large";
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

const SIZE_DIMENSIONS = {
  small: 18,
  medium: 36,
  large: 56,
} as const;

export function GameIcon({
  iconName,
  size = "medium",
  alt,
  className,
  width,
  height,
}: GameIconProps) {
  const url = `${env.SUPABASE_URL}/functions/v1/icons/${size}/${iconName}.jpg`;
  const dimension = width || height || SIZE_DIMENSIONS[size];

  return (
    <Image
      src={url}
      alt={alt || iconName}
      width={width || dimension}
      height={height || dimension}
      className={cn("rounded", className)}
      unoptimized
    />
  );
}

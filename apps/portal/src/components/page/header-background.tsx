import Image from "next/image";

import { cn } from "@/lib/utils";

export type HeaderBackgroundProps = {
  src?: string;
  size?: number;
  opacity?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
};

export function HeaderBackground({
  src = "/logo.svg",
  size = 900,
  opacity = 0.06,
  alt = "",
  priority,
  className,
}: HeaderBackgroundProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      aria-hidden={alt === ""}
      priority={priority}
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none",
        className,
      )}
      style={{ opacity }}
    />
  );
}

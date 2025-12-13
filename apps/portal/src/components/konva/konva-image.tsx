"use client";

import { forwardRef } from "react";
import { Image } from "react-konva";
import type Konva from "konva";
import type { ImageConfig } from "konva/lib/shapes/Image";
import type { KonvaNodeEvents } from "react-konva";
import useImage from "use-image";
import { getIconUrl } from "./icons";

type KonvaImageProps = Omit<ImageConfig, "image"> &
  KonvaNodeEvents & {
    src?: string;
    iconName?: string;
    iconSize?: "small" | "medium" | "large";
    fallback?: React.ReactNode;
  };

export const KonvaImage = forwardRef<Konva.Image, KonvaImageProps>(
  function KonvaImage(
    {
      src,
      iconName,
      iconSize = "medium",
      fallback,
      perfectDrawEnabled = false,
      ...props
    },
    ref,
  ) {
    const url = iconName ? getIconUrl(iconName, iconSize) : src;
    const [image, status] = useImage(url ?? "", "anonymous");

    if (status === "loading" || status === "failed" || !image) {
      return fallback ?? null;
    }

    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <Image
        ref={ref}
        image={image}
        perfectDrawEnabled={perfectDrawEnabled}
        {...props}
      />
    );
  },
);

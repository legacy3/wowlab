"use client";

import type { ImageProps as NextImageProps } from "next/image";

import NextImage from "next/image";
import { image } from "styled-system/recipes";

import { Expandable } from "./expandable";

type ImageProps = {
  alt: string;
  expandable?: boolean;
  src: string;
} & Omit<NextImageProps, "alt" | "src">;

export function Image({
  alt,
  expandable = false,
  height = 600,
  src,
  width = 900,
  ...props
}: ImageProps) {
  const imageElement = (
    <NextImage
      src={src}
      alt={alt}
      width={width as number}
      height={height as number}
      className={image()}
      {...props}
    />
  );

  if (!expandable) {
    return imageElement;
  }

  const expandedImage = (
    <NextImage
      src={src}
      alt={alt}
      width={1800}
      height={1200}
      className={image({ variant: "modal" })}
      {...props}
    />
  );

  return (
    <Expandable variant="image" expandedContent={expandedImage} title={alt}>
      {imageElement}
    </Expandable>
  );
}

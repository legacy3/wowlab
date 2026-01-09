import type { ComponentProps } from "react";

import { Slider } from "@base-ui/react/slider";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Slider.Root;
export const Value = Slider.Value;

export function Control({
  className,
  ...props
}: ComponentProps<typeof Slider.Control>) {
  return (
    <Slider.Control className={clsx(styles.control, className)} {...props} />
  );
}

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Slider.Indicator>) {
  return (
    <Slider.Indicator
      className={clsx(styles.indicator, className)}
      {...props}
    />
  );
}

export function Thumb({
  className,
  ...props
}: ComponentProps<typeof Slider.Thumb>) {
  return <Slider.Thumb className={clsx(styles.thumb, className)} {...props} />;
}

export function Track({
  className,
  ...props
}: ComponentProps<typeof Slider.Track>) {
  return <Slider.Track className={clsx(styles.track, className)} {...props} />;
}

import { Progress } from "@base-ui/react/progress";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Progress.Root;
export const Value = Progress.Value;
export const Label = Progress.Label;

export function Track({
  className,
  ...props
}: ComponentProps<typeof Progress.Track>) {
  return (
    <Progress.Track className={clsx(styles.track, className)} {...props} />
  );
}

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Progress.Indicator>) {
  return (
    <Progress.Indicator
      className={clsx(styles.indicator, className)}
      {...props}
    />
  );
}

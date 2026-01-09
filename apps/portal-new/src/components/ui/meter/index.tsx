import type { ComponentProps } from "react";

import { Meter } from "@base-ui/react/meter";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Meter.Root;
export const Value = Meter.Value;
export const Label = Meter.Label;

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Meter.Indicator>) {
  return (
    <Meter.Indicator className={clsx(styles.indicator, className)} {...props} />
  );
}

export function Track({
  className,
  ...props
}: ComponentProps<typeof Meter.Track>) {
  return <Meter.Track className={clsx(styles.track, className)} {...props} />;
}

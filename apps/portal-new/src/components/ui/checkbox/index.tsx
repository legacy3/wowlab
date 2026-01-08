import { Checkbox } from "@base-ui/react/checkbox";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Checkbox.Root>) {
  return <Checkbox.Root className={clsx(styles.root, className)} {...props} />;
}

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Checkbox.Indicator>) {
  return (
    <Checkbox.Indicator
      className={clsx(styles.indicator, className)}
      {...props}
    />
  );
}

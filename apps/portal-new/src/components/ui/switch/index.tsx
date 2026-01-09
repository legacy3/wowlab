import type { ComponentProps } from "react";

import { Switch } from "@base-ui/react/switch";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Switch.Root>) {
  return <Switch.Root className={clsx(styles.root, className)} {...props} />;
}

export function Thumb({
  className,
  ...props
}: ComponentProps<typeof Switch.Thumb>) {
  return <Switch.Thumb className={clsx(styles.thumb, className)} {...props} />;
}

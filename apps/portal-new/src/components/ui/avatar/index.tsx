import type { ComponentProps } from "react";

import { Avatar } from "@base-ui/react/avatar";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Fallback({
  className,
  ...props
}: ComponentProps<typeof Avatar.Fallback>) {
  return (
    <Avatar.Fallback className={clsx(styles.fallback, className)} {...props} />
  );
}

export function Image({
  className,
  ...props
}: ComponentProps<typeof Avatar.Image>) {
  return <Avatar.Image className={clsx(styles.image, className)} {...props} />;
}

export function Root({
  className,
  ...props
}: ComponentProps<typeof Avatar.Root>) {
  return <Avatar.Root className={clsx(styles.root, className)} {...props} />;
}

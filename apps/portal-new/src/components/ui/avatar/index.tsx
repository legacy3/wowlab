import { Avatar } from "@base-ui/react/avatar";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Avatar.Root>) {
  return <Avatar.Root className={clsx(styles.root, className)} {...props} />;
}

export function Image({
  className,
  ...props
}: ComponentProps<typeof Avatar.Image>) {
  return <Avatar.Image className={clsx(styles.image, className)} {...props} />;
}

export function Fallback({
  className,
  ...props
}: ComponentProps<typeof Avatar.Fallback>) {
  return (
    <Avatar.Fallback className={clsx(styles.fallback, className)} {...props} />
  );
}

import { ScrollArea } from "@base-ui/react/scroll-area";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root className={clsx(styles.root, className)} {...props} />
  );
}

export function Viewport({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Viewport>) {
  return (
    <ScrollArea.Viewport
      className={clsx(styles.viewport, className)}
      {...props}
    />
  );
}

export const Content = ScrollArea.Content;

export function Scrollbar({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Scrollbar>) {
  return (
    <ScrollArea.Scrollbar
      className={clsx(styles.scrollbar, className)}
      {...props}
    />
  );
}

export function Thumb({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Thumb>) {
  return (
    <ScrollArea.Thumb className={clsx(styles.thumb, className)} {...props} />
  );
}

export function Corner({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Corner>) {
  return (
    <ScrollArea.Corner className={clsx(styles.corner, className)} {...props} />
  );
}

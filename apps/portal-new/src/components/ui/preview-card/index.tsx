import { PreviewCard } from "@base-ui/react/preview-card";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = PreviewCard.Root;
export const Trigger = PreviewCard.Trigger;
export const Portal = PreviewCard.Portal;
export const Positioner = PreviewCard.Positioner;
export const Arrow = PreviewCard.Arrow;

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof PreviewCard.Backdrop>) {
  return (
    <PreviewCard.Backdrop
      className={clsx(styles.backdrop, className)}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof PreviewCard.Popup>) {
  return (
    <PreviewCard.Popup className={clsx(styles.popup, className)} {...props} />
  );
}

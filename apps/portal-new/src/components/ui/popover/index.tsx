import type { ComponentProps } from "react";

import { Popover } from "@base-ui/react/popover";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Popover.Root;
export const Trigger = Popover.Trigger;
export const Portal = Popover.Portal;
export const Title = Popover.Title;
export const Description = Popover.Description;
export const Close = Popover.Close;
export const Arrow = Popover.Arrow;

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof Popover.Backdrop>) {
  return (
    <Popover.Backdrop className={clsx(styles.backdrop, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Popover.Popup>) {
  return <Popover.Popup className={clsx(styles.popup, className)} {...props} />;
}

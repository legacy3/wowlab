import { Tooltip } from "@base-ui/react/tooltip";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Tooltip.Root;
export const Trigger = Tooltip.Trigger;
export const Portal = Tooltip.Portal;
export const Arrow = Tooltip.Arrow;
export const Provider = Tooltip.Provider;

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Tooltip.Popup>) {
  return <Tooltip.Popup className={clsx(styles.popup, className)} {...props} />;
}

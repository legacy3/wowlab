import type { ComponentProps } from "react";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = AlertDialog.Root;
export const Trigger = AlertDialog.Trigger;
export const Portal = AlertDialog.Portal;
export const Title = AlertDialog.Title;
export const Description = AlertDialog.Description;
export const Close = AlertDialog.Close;

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof AlertDialog.Backdrop>) {
  return (
    <AlertDialog.Backdrop
      className={clsx(styles.backdrop, className)}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof AlertDialog.Popup>) {
  return (
    <AlertDialog.Popup className={clsx(styles.popup, className)} {...props} />
  );
}

import { Dialog } from "@base-ui/react/dialog";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Dialog.Root;
export const Trigger = Dialog.Trigger;
export const Portal = Dialog.Portal;
export const Title = Dialog.Title;
export const Description = Dialog.Description;
export const Close = Dialog.Close;

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop className={clsx(styles.backdrop, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Dialog.Popup>) {
  return <Dialog.Popup className={clsx(styles.popup, className)} {...props} />;
}

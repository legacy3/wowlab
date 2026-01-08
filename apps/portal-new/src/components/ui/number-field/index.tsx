import { NumberField } from "@base-ui/react/number-field";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = NumberField.Root;
export const ScrubArea = NumberField.ScrubArea;
export const ScrubAreaCursor = NumberField.ScrubAreaCursor;

export function Group({
  className,
  ...props
}: ComponentProps<typeof NumberField.Group>) {
  return (
    <NumberField.Group className={clsx(styles.group, className)} {...props} />
  );
}

export function Input({
  className,
  ...props
}: ComponentProps<typeof NumberField.Input>) {
  return (
    <NumberField.Input className={clsx(styles.input, className)} {...props} />
  );
}

export function Decrement({
  className,
  ...props
}: ComponentProps<typeof NumberField.Decrement>) {
  return (
    <NumberField.Decrement
      className={clsx(styles.button, styles.decrement, className)}
      {...props}
    />
  );
}

export function Increment({
  className,
  ...props
}: ComponentProps<typeof NumberField.Increment>) {
  return (
    <NumberField.Increment
      className={clsx(styles.button, styles.increment, className)}
      {...props}
    />
  );
}

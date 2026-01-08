import { Field } from "@base-ui/react/field";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Field.Root;
export const Control = Field.Control;
export const Validity = Field.Validity;

export function Label({
  className,
  ...props
}: ComponentProps<typeof Field.Label>) {
  return <Field.Label className={clsx(styles.label, className)} {...props} />;
}

export function Description({
  className,
  ...props
}: ComponentProps<typeof Field.Description>) {
  return (
    <Field.Description
      className={clsx(styles.description, className)}
      {...props}
    />
  );
}

export function Error({
  className,
  ...props
}: ComponentProps<typeof Field.Error>) {
  return <Field.Error className={clsx(styles.error, className)} {...props} />;
}

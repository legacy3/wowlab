import { Toolbar } from "@base-ui/react/toolbar";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Toolbar.Root>) {
  return <Toolbar.Root className={clsx(styles.root, className)} {...props} />;
}

export function Button({
  className,
  ...props
}: ComponentProps<typeof Toolbar.Button>) {
  return (
    <Toolbar.Button className={clsx(styles.button, className)} {...props} />
  );
}

export function Link({
  className,
  ...props
}: ComponentProps<typeof Toolbar.Link>) {
  return <Toolbar.Link className={clsx(styles.link, className)} {...props} />;
}

export const Input = Toolbar.Input;

export function Group({
  className,
  ...props
}: ComponentProps<typeof Toolbar.Group>) {
  return <Toolbar.Group className={clsx(styles.group, className)} {...props} />;
}

export function Separator({
  className,
  ...props
}: ComponentProps<typeof Toolbar.Separator>) {
  return (
    <Toolbar.Separator
      className={clsx(styles.separator, className)}
      {...props}
    />
  );
}

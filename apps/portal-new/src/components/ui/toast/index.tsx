import type { ComponentProps } from "react";

import { Toast } from "@base-ui/react/toast";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Provider = Toast.Provider;
export const Portal = Toast.Portal;
export const Title = Toast.Title;
export const Description = Toast.Description;
export const Action = Toast.Action;
export const Close = Toast.Close;
export const useToastManager = Toast.useToastManager;

export function Content({
  className,
  ...props
}: ComponentProps<typeof Toast.Content>) {
  return (
    <Toast.Content className={clsx(styles.content, className)} {...props} />
  );
}

export function Root({
  className,
  ...props
}: ComponentProps<typeof Toast.Root>) {
  return <Toast.Root className={clsx(styles.root, className)} {...props} />;
}

export function Viewport({
  className,
  ...props
}: ComponentProps<typeof Toast.Viewport>) {
  return (
    <Toast.Viewport className={clsx(styles.viewport, className)} {...props} />
  );
}

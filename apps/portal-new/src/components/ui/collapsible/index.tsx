import type { ComponentProps } from "react";

import { Collapsible } from "@base-ui/react/collapsible";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Collapsible.Root;

export function Panel({
  className,
  ...props
}: ComponentProps<typeof Collapsible.Panel>) {
  return (
    <Collapsible.Panel className={clsx(styles.panel, className)} {...props} />
  );
}

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof Collapsible.Trigger>) {
  return (
    <Collapsible.Trigger
      className={clsx(styles.trigger, className)}
      {...props}
    />
  );
}

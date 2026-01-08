import { Tabs } from "@base-ui/react/tabs";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Tabs.Root;
export const Panel = Tabs.Panel;

export function List({
  className,
  ...props
}: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={clsx(styles.list, className)} {...props} />;
}

export function Tab({ className, ...props }: ComponentProps<typeof Tabs.Tab>) {
  return <Tabs.Tab className={clsx(styles.tab, className)} {...props} />;
}

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Tabs.Indicator>) {
  return (
    <Tabs.Indicator className={clsx(styles.indicator, className)} {...props} />
  );
}

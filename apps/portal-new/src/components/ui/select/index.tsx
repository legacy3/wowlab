import { Select } from "@base-ui/react/select";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export const Root = Select.Root;
export const Value = Select.Value;
export const Icon = Select.Icon;
export const Portal = Select.Portal;
export const Positioner = Select.Positioner;
export const ScrollUpArrow = Select.ScrollUpArrow;
export const ScrollDownArrow = Select.ScrollDownArrow;
export const Group = Select.Group;
export const GroupLabel = Select.GroupLabel;
export const Arrow = Select.Arrow;

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof Select.Trigger>) {
  return (
    <Select.Trigger className={clsx(styles.trigger, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Select.Popup>) {
  return <Select.Popup className={clsx(styles.popup, className)} {...props} />;
}

export function Item({
  className,
  ...props
}: ComponentProps<typeof Select.Item>) {
  return <Select.Item className={clsx(styles.item, className)} {...props} />;
}

export function ItemIndicator({
  className,
  ...props
}: ComponentProps<typeof Select.ItemIndicator>) {
  return (
    <Select.ItemIndicator
      className={clsx(styles.itemIndicator, className)}
      {...props}
    />
  );
}

export function ItemText(props: ComponentProps<typeof Select.ItemText>) {
  return <Select.ItemText {...props} />;
}

export function Separator({
  className,
  ...props
}: ComponentProps<typeof Select.Separator>) {
  return (
    <Select.Separator
      className={clsx(styles.separator, className)}
      {...props}
    />
  );
}

import type { ComponentProps } from "react";

import { ContextMenu } from "@base-ui/react/context-menu";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = ContextMenu.Root;
export const Trigger = ContextMenu.Trigger;
export const Portal = ContextMenu.Portal;
export const Positioner = ContextMenu.Positioner;
export const Group = ContextMenu.Group;
export const GroupLabel = ContextMenu.GroupLabel;
export const RadioGroup = ContextMenu.RadioGroup;
export const RadioItem = ContextMenu.RadioItem;
export const RadioItemIndicator = ContextMenu.RadioItemIndicator;
export const CheckboxItem = ContextMenu.CheckboxItem;
export const CheckboxItemIndicator = ContextMenu.CheckboxItemIndicator;
export const SubmenuRoot = ContextMenu.SubmenuRoot;
export const SubmenuTrigger = ContextMenu.SubmenuTrigger;

export function Item({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Item>) {
  return (
    <ContextMenu.Item className={clsx(styles.item, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Popup>) {
  return (
    <ContextMenu.Popup className={clsx(styles.popup, className)} {...props} />
  );
}

export function Separator({
  className,
  ...props
}: ComponentProps<typeof ContextMenu.Separator>) {
  return (
    <ContextMenu.Separator
      className={clsx(styles.separator, className)}
      {...props}
    />
  );
}

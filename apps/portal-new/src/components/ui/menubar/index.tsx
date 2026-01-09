import type { ComponentProps } from "react";

import { Menu } from "@base-ui/react/menu";
import { Menubar } from "@base-ui/react/menubar";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Menubar>) {
  return <Menubar className={clsx(styles.root, className)} {...props} />;
}

export const MenuRoot = Menu.Root;
export const Portal = Menu.Portal;
export const Positioner = Menu.Positioner;
export const Group = Menu.Group;
export const GroupLabel = Menu.GroupLabel;
export const RadioGroup = Menu.RadioGroup;
export const RadioItem = Menu.RadioItem;
export const RadioItemIndicator = Menu.RadioItemIndicator;
export const CheckboxItem = Menu.CheckboxItem;
export const CheckboxItemIndicator = Menu.CheckboxItemIndicator;
export const SubmenuRoot = Menu.SubmenuRoot;
export const SubmenuTrigger = Menu.SubmenuTrigger;

export function Item({
  className,
  ...props
}: ComponentProps<typeof Menu.Item>) {
  return <Menu.Item className={clsx(styles.item, className)} {...props} />;
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Menu.Popup>) {
  return <Menu.Popup className={clsx(styles.popup, className)} {...props} />;
}

export function Separator({
  className,
  ...props
}: ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator className={clsx(styles.separator, className)} {...props} />
  );
}

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger className={clsx(styles.trigger, className)} {...props} />
  );
}

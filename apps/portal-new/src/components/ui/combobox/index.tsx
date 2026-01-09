import type { ComponentProps } from "react";

import { Combobox } from "@base-ui/react/combobox";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Combobox.Root;
export const Value = Combobox.Value;
export const Portal = Combobox.Portal;
export const Positioner = Combobox.Positioner;
export const Arrow = Combobox.Arrow;
export const Group = Combobox.Group;
export const GroupLabel = Combobox.GroupLabel;
export const Collection = Combobox.Collection;
export const Clear = Combobox.Clear;
export const Icon = Combobox.Icon;
export const ItemIndicator = Combobox.ItemIndicator;
export const Chips = Combobox.Chips;
export const Chip = Combobox.Chip;
export const ChipRemove = Combobox.ChipRemove;
export const Status = Combobox.Status;

export function Empty({
  className,
  ...props
}: ComponentProps<typeof Combobox.Empty>) {
  return (
    <Combobox.Empty className={clsx(styles.empty, className)} {...props} />
  );
}

export function Input({
  className,
  ...props
}: ComponentProps<typeof Combobox.Input>) {
  return (
    <Combobox.Input className={clsx(styles.input, className)} {...props} />
  );
}

export function Item({
  className,
  ...props
}: ComponentProps<typeof Combobox.Item>) {
  return <Combobox.Item className={clsx(styles.item, className)} {...props} />;
}

export function List({
  className,
  ...props
}: ComponentProps<typeof Combobox.List>) {
  return <Combobox.List className={clsx(styles.list, className)} {...props} />;
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Combobox.Popup>) {
  return (
    <Combobox.Popup className={clsx(styles.popup, className)} {...props} />
  );
}

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof Combobox.Trigger>) {
  return (
    <Combobox.Trigger className={clsx(styles.trigger, className)} {...props} />
  );
}

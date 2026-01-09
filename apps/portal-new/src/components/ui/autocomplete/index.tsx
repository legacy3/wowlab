import type { ComponentProps } from "react";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = Autocomplete.Root;
export const Value = Autocomplete.Value;
export const Portal = Autocomplete.Portal;
export const Positioner = Autocomplete.Positioner;
export const Arrow = Autocomplete.Arrow;
export const Group = Autocomplete.Group;
export const GroupLabel = Autocomplete.GroupLabel;
export const Collection = Autocomplete.Collection;
export const Clear = Autocomplete.Clear;
export const Status = Autocomplete.Status;

export function Empty({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.Empty>) {
  return (
    <Autocomplete.Empty className={clsx(styles.empty, className)} {...props} />
  );
}

export function Input({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.Input>) {
  return (
    <Autocomplete.Input className={clsx(styles.input, className)} {...props} />
  );
}

export function Item({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.Item>) {
  return (
    <Autocomplete.Item className={clsx(styles.item, className)} {...props} />
  );
}

export function List({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.List>) {
  return (
    <Autocomplete.List className={clsx(styles.list, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.Popup>) {
  return (
    <Autocomplete.Popup className={clsx(styles.popup, className)} {...props} />
  );
}

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof Autocomplete.Trigger>) {
  return (
    <Autocomplete.Trigger
      className={clsx(styles.trigger, className)}
      {...props}
    />
  );
}

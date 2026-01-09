import type { ComponentProps } from "react";

import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { clsx } from "clsx";

import styles from "./index.module.css";

export const Root = NavigationMenu.Root;
export const Item = NavigationMenu.Item;
export const Portal = NavigationMenu.Portal;
export const Positioner = NavigationMenu.Positioner;
export const Viewport = NavigationMenu.Viewport;
export const Arrow = NavigationMenu.Arrow;

export function Backdrop({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Backdrop>) {
  return (
    <NavigationMenu.Backdrop
      className={clsx(styles.backdrop, className)}
      {...props}
    />
  );
}

export function Content({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Content>) {
  return (
    <NavigationMenu.Content
      className={clsx(styles.content, className)}
      {...props}
    />
  );
}

export function Icon({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Icon>) {
  return (
    <NavigationMenu.Icon className={clsx(styles.icon, className)} {...props} />
  );
}

export function Link({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Link>) {
  return (
    <NavigationMenu.Link className={clsx(styles.link, className)} {...props} />
  );
}

export function List({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.List>) {
  return (
    <NavigationMenu.List className={clsx(styles.list, className)} {...props} />
  );
}

export function Popup({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Popup>) {
  return (
    <NavigationMenu.Popup
      className={clsx(styles.popup, className)}
      {...props}
    />
  );
}

export function Trigger({
  className,
  ...props
}: ComponentProps<typeof NavigationMenu.Trigger>) {
  return (
    <NavigationMenu.Trigger
      className={clsx(styles.trigger, className)}
      {...props}
    />
  );
}

"use client";

import type { ComponentProps, ReactNode } from "react";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { css, cx } from "styled-system/css";
import { command } from "styled-system/recipes";

import * as DialogPrimitive from "./dialog";

const styles = command();

export interface DialogProps extends DialogPrimitive.RootProps {
  children: ReactNode;
  description?: string;
  title?: string;
}

export type EmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

export type GroupProps = ComponentProps<typeof CommandPrimitive.Group>;

export type InputProps = ComponentProps<typeof CommandPrimitive.Input>;

export type ItemProps = ComponentProps<typeof CommandPrimitive.Item>;

export type ListProps = ComponentProps<typeof CommandPrimitive.List>;

export type RootProps = ComponentProps<typeof CommandPrimitive>;

export type SeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

export function Dialog({
  children,
  description = "Search for a command to run...",
  title = "Command Palette",
  ...props
}: DialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Backdrop />
      <DialogPrimitive.Positioner>
        <DialogPrimitive.Content
          p="0"
          overflow="hidden"
          maxW="lg"
          className={css({ "& > div:first-child": { display: "none" } })}
        >
          <DialogPrimitive.Title srOnly>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description srOnly>
            {description}
          </DialogPrimitive.Description>
          <Root>{children}</Root>
        </DialogPrimitive.Content>
      </DialogPrimitive.Positioner>
    </DialogPrimitive.Root>
  );
}

export function Empty(props: EmptyProps) {
  return <CommandPrimitive.Empty className={styles.empty} {...props} />;
}

export function Group({ className, ...props }: GroupProps) {
  return (
    <CommandPrimitive.Group
      className={cx(styles.group, className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputProps) {
  return (
    <div className={styles.inputWrapper}>
      <SearchIcon size={16} className={css({ color: "fg.muted" })} />
      <CommandPrimitive.Input
        className={cx(styles.input, className)}
        {...props}
      />
    </div>
  );
}

export function Item({ className, ...props }: ItemProps) {
  return (
    <CommandPrimitive.Item className={cx(styles.item, className)} {...props} />
  );
}

export function List({ className, ...props }: ListProps) {
  return (
    <CommandPrimitive.List className={cx(styles.list, className)} {...props} />
  );
}

export function Root({ className, ...props }: RootProps) {
  return <CommandPrimitive className={cx(styles.root, className)} {...props} />;
}

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <CommandPrimitive.Separator
      className={cx(styles.separator, className)}
      {...props}
    />
  );
}

export function Shortcut({ className, ...props }: ComponentProps<"span">) {
  return <span className={cx(styles.shortcut, className)} {...props} />;
}

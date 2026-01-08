import { Accordion } from '@base-ui/react/accordion';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import styles from './index.module.css';

export const Root = Accordion.Root;
export const Item = Accordion.Item;
export const Header = Accordion.Header;

export function Trigger({ className, ...props }: ComponentProps<typeof Accordion.Trigger>) {
  return <Accordion.Trigger className={clsx(styles.trigger, className)} {...props} />;
}

export function Panel({ className, ...props }: ComponentProps<typeof Accordion.Panel>) {
  return <Accordion.Panel className={clsx(styles.panel, className)} {...props} />;
}

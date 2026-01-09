import type { ComponentProps } from "react";

import { Toggle } from "@base-ui/react/toggle";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Toggle>) {
  return <Toggle className={clsx(styles.root, className)} {...props} />;
}

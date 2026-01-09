import type { ComponentProps } from "react";

import { Input } from "@base-ui/react/input";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={clsx(styles.input, className)} {...props} />;
}

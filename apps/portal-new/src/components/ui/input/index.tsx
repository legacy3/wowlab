import { Input } from "@base-ui/react/input";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={clsx(styles.input, className)} {...props} />;
}

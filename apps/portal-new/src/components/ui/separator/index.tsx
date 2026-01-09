import { Separator } from "@base-ui/react/separator";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Separator>) {
  return <Separator className={clsx(styles.root, className)} {...props} />;
}

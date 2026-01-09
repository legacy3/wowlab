import type { ComponentProps } from "react";

import { Separator } from "@base-ui/react/separator";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Separator>) {
  return <Separator className={clsx(styles.root, className)} {...props} />;
}

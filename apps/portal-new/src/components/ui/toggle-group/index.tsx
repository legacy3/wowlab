import type { ComponentProps } from "react";

import { ToggleGroup } from "@base-ui/react/toggle-group";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof ToggleGroup>) {
  return <ToggleGroup className={clsx(styles.root, className)} {...props} />;
}

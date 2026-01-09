import type { ComponentProps } from "react";

import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof CheckboxGroup>) {
  return <CheckboxGroup className={clsx(styles.root, className)} {...props} />;
}

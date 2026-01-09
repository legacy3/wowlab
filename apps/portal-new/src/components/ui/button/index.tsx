import type { ComponentProps } from "react";

import { Button } from "@base-ui/react/button";
import { clsx } from "clsx";

import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={clsx(styles.root, className)} {...props} />;
}

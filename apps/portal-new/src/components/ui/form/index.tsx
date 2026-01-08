import { Form } from "@base-ui/react/form";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({ className, ...props }: ComponentProps<typeof Form>) {
  return <Form className={clsx(styles.root, className)} {...props} />;
}

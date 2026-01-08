import { Fieldset } from "@base-ui/react/fieldset";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export function Root({
  className,
  ...props
}: ComponentProps<typeof Fieldset.Root>) {
  return <Fieldset.Root className={clsx(styles.root, className)} {...props} />;
}

export function Legend({
  className,
  ...props
}: ComponentProps<typeof Fieldset.Legend>) {
  return (
    <Fieldset.Legend className={clsx(styles.legend, className)} {...props} />
  );
}

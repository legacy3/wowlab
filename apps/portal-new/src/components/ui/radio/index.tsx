import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { clsx } from "clsx";
import type { ComponentProps } from "react";
import styles from "./index.module.css";

export { RadioGroup as Group };

export function Root({
  className,
  ...props
}: ComponentProps<typeof Radio.Root>) {
  return <Radio.Root className={clsx(styles.root, className)} {...props} />;
}

export function Indicator({
  className,
  ...props
}: ComponentProps<typeof Radio.Indicator>) {
  return (
    <Radio.Indicator className={clsx(styles.indicator, className)} {...props} />
  );
}

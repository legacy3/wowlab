import { clsx } from "clsx";

import styles from "./index.module.scss";

interface SkeletonProps extends React.ComponentProps<"div"> {
  height?: string;
  width?: string;
}

export function Skeleton({
  className,
  height,
  style,
  width,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(styles.skeleton, className)}
      style={{ height, width, ...style }}
      {...props}
    />
  );
}

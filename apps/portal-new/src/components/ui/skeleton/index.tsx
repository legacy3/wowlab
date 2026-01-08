import { clsx } from "clsx";
import styles from "./index.module.scss";

interface SkeletonProps extends React.ComponentProps<"div"> {
  width?: string;
  height?: string;
}

export function Skeleton({
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(styles.skeleton, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

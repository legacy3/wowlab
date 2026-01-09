import { clsx } from "clsx";
import type { ReactNode } from "react";
import styles from "./index.module.scss";

interface ErrorBoxProps {
  children: ReactNode;
  className?: string;
}

export function ErrorBox({ children, className }: ErrorBoxProps) {
  return (
    <div role="alert" className={clsx(styles.error, className)}>
      {children}
    </div>
  );
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";

import styles from "../index.module.scss";

export const id = "skeleton";
export const title = "Skeleton";

export function Content() {
  return (
    <>
      <p className={styles.description}>
        Placeholder for content loading. Use for layout-preserving loading
        states.
      </p>
      <div className={styles.demoRow}>
        <span className={styles.demoLabel}>Basic</span>
        <div className={styles.demoContent}>
          <div className={styles.skeletonDemo}>
            <Skeleton width="8rem" height="1.5rem" />
            <Skeleton height="1rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </div>
      </div>
      <div className={styles.demoRow}>
        <span className={styles.demoLabel}>Card</span>
        <div className={styles.demoContent}>
          <article className={styles.skeletonCard}>
            <header>
              <Skeleton width="40%" height="1.25rem" />
            </header>
            <Skeleton height="4rem" />
            <footer>
              <Skeleton width="6rem" height="2rem" />
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}

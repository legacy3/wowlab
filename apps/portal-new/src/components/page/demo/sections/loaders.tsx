"use client";

import { useState } from "react";

import {
  FlaskInlineLoader,
  FlaskLoader,
  type FlaskVariant,
} from "@/components/ui/flask-loader";

import styles from "../index.module.scss";

export const id = "loaders";
export const title = "Flask Loaders";

export function Content() {
  const [loadingButton, setLoadingButton] = useState(false);
  const [processingButton, setProcessingButton] = useState(false);

  const handleLoadingClick = () => {
    setLoadingButton(true);
    setTimeout(() => setLoadingButton(false), 2000);
  };

  const handleProcessingClick = () => {
    setProcessingButton(true);
    setTimeout(() => setProcessingButton(false), 3000);
  };

  return (
    <>
      <p className={styles.description}>
        Branded loading indicators. Use <code>FlaskInlineLoader</code> for
        buttons and inline contexts, <code>FlaskLoader</code> for larger
        displays.
      </p>

      <div className={styles.subsection}>
        <h3>Inline Loader</h3>
        <p className={styles.description}>
          Inherits color from parent. Use in buttons, labels, or any inline
          context.
        </p>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>Variants</span>
          <div className={styles.demoContent}>
            {(["loading", "processing", "idle"] as FlaskVariant[]).map((v) => (
              <span key={v} className={styles.inlineDemo}>
                <FlaskInlineLoader variant={v} />
                <code>{v}</code>
              </span>
            ))}
          </div>
        </div>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>Sizes</span>
          <div className={styles.demoContent}>
            <FlaskInlineLoader className={styles.inlineSm} />
            <FlaskInlineLoader />
            <FlaskInlineLoader className={styles.inlineLg} />
            <FlaskInlineLoader className={styles.inlineXl} />
          </div>
        </div>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>In buttons</span>
          <div className={styles.demoContent}>
            <button onClick={handleLoadingClick} disabled={loadingButton}>
              <FlaskInlineLoader animate={loadingButton} />
              {loadingButton ? "Loading..." : "Click me"}
            </button>
            <button
              onClick={handleProcessingClick}
              disabled={processingButton}
              className="secondary"
            >
              <FlaskInlineLoader
                animate={processingButton}
                variant="processing"
              />
              {processingButton ? "Processing..." : "Process"}
            </button>
          </div>
        </div>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>Static</span>
          <div className={styles.demoContent}>
            <FlaskInlineLoader animate={false} />
            <code>animate=false</code>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Full Loader</h3>
        <p className={styles.description}>
          Larger loader for page sections or cards.
        </p>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>Sizes</span>
          <div className={styles.demoContent}>
            <div className={styles.loaderGrid}>
              {(["sm", "md", "lg", "xl"] as const).map((size) => (
                <div key={size} className={styles.loaderItem}>
                  <FlaskLoader size={size} />
                  <code>{size}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.demoRow}>
          <span className={styles.demoLabel}>Variants</span>
          <div className={styles.demoContent}>
            <div className={styles.loaderGrid}>
              {(["loading", "processing", "idle"] as FlaskVariant[]).map(
                (v) => (
                  <div key={v} className={styles.loaderItem}>
                    <FlaskLoader size="md" variant={v} />
                    <code>{v}</code>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

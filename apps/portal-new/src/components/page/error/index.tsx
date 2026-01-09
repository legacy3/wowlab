"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import styles from "./index.module.scss";

interface ErrorPageProps {
  error: { digest?: string } & Error;
  reset: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className={styles.page}>
      <div className={styles.icon}>
        <AlertTriangle size={40} />
      </div>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Please try again.</p>
      {error.digest && (
        <p className={styles.digest}>Error ID: {error.digest}</p>
      )}
      <div className={styles.actions}>
        <button onClick={() => reset()}>Try again</button>
        <button
          className="secondary"
          onClick={() => (window.location.href = "/")}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./index.module.scss";

export function NotFoundPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <p>That page doesn&#39;t exist (or it moved).</p>
      <div className={styles.actions}>
        <button
          className="secondary"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button onClick={() => router.push("/")}>Go Home</button>
      </div>
    </div>
  );
}

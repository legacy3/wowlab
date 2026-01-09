"use client";

import * as Progress from "@/components/ui/progress";
import * as Toast from "@/components/ui/toast";
import styles from "../index.module.scss";

export const id = "feedback";
export const title = "Feedback";

function ToastTrigger() {
  const toastManager = Toast.useToastManager();

  return (
    <button
      onClick={() =>
        toastManager.add({
          title: "Notification",
          description: "This is a toast message!",
        })
      }
    >
      Show Toast
    </button>
  );
}

function ToastRenderer() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
      </Toast.Content>
      <Toast.Close>Dismiss</Toast.Close>
    </Toast.Root>
  ));
}

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Progress</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent} style={{ maxWidth: "20rem" }}>
            <Progress.Root value={60}>
              <Progress.Track>
                <Progress.Indicator />
              </Progress.Track>
            </Progress.Root>
          </div>
        </div>
        <div className={styles.demoRow}>
          <div className={styles.demoContent} style={{ maxWidth: "20rem" }}>
            <Progress.Root value={30}>
              <Progress.Label>Loading...</Progress.Label>
              <Progress.Track>
                <Progress.Indicator />
              </Progress.Track>
              <Progress.Value>{(value) => `${value}%`}</Progress.Value>
            </Progress.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Toast</h3>
        <Toast.Provider>
          <div className={styles.demoRow}>
            <div className={styles.demoContent}>
              <ToastTrigger />
            </div>
          </div>
          <Toast.Portal>
            <Toast.Viewport>
              <ToastRenderer />
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>
      </div>
    </>
  );
}

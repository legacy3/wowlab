"use client";

import * as Dialog from "@/components/ui/dialog";
import * as Tooltip from "@/components/ui/tooltip";
import styles from "../index.module.scss";

export const id = "overlays";
export const title = "Overlays";

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Dialog</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Dialog.Root>
              <Dialog.Trigger>Open Dialog</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>Dialog Title</Dialog.Title>
                  <Dialog.Description>
                    This is a dialog description. You can put any content here.
                  </Dialog.Description>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Tooltip</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Tooltip.Root>
              <Tooltip.Trigger>Hover me</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>This is a tooltip!</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </div>
      </div>
    </>
  );
}

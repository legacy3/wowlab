"use client";

import * as AlertDialog from "@/components/ui/alert-dialog";
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
        <h3>Alert Dialog</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <AlertDialog.Root>
              <AlertDialog.Trigger>Delete Item</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                  <AlertDialog.Description>
                    This action cannot be undone. This will permanently delete
                    the item.
                  </AlertDialog.Description>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "1rem",
                    }}
                  >
                    <AlertDialog.Close>Cancel</AlertDialog.Close>
                    <AlertDialog.Close className="contrast">
                      Delete
                    </AlertDialog.Close>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
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

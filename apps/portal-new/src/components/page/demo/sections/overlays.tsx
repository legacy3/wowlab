"use client";

import * as AlertDialog from "@/components/ui/alert-dialog";
import * as ContextMenu from "@/components/ui/context-menu";
import * as Dialog from "@/components/ui/dialog";
import * as PreviewCard from "@/components/ui/preview-card";
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

      <div className={styles.subsection}>
        <h3>Context Menu</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <ContextMenu.Root>
              <ContextMenu.Trigger
                style={{
                  padding: "2rem 3rem",
                  border: "1px dashed var(--pico-muted-border-color)",
                  borderRadius: "var(--pico-border-radius)",
                }}
              >
                Right-click here
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Popup>
                    <ContextMenu.Item>Cut</ContextMenu.Item>
                    <ContextMenu.Item>Copy</ContextMenu.Item>
                    <ContextMenu.Item>Paste</ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item>Delete</ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Preview Card</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <PreviewCard.Root>
              <PreviewCard.Trigger href="https://base-ui.com">
                Hover to preview Base UI
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup>
                    <strong>Base UI</strong>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
                      A library of high-quality unstyled React components.
                    </p>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </div>
        </div>
      </div>
    </>
  );
}

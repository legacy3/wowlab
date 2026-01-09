"use client";

import {
  Bold,
  Italic,
  Link as LinkIcon,
  Redo,
  Undo,
  Underline,
} from "lucide-react";
import * as Avatar from "@/components/ui/avatar";
import { Link } from "@/components/ui/link";
import * as ScrollArea from "@/components/ui/scroll-area";
import * as Separator from "@/components/ui/separator";
import * as Toolbar from "@/components/ui/toolbar";
import styles from "../index.module.scss";

export const id = "layout";
export const title = "Layout";

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Avatar</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Avatar.Root>
              <Avatar.Image
                src="https://i.pravatar.cc/150?u=1"
                alt="User avatar"
              />
              <Avatar.Fallback>JD</Avatar.Fallback>
            </Avatar.Root>
            <Avatar.Root>
              <Avatar.Image
                src="https://i.pravatar.cc/150?u=2"
                alt="User avatar"
              />
              <Avatar.Fallback>AB</Avatar.Fallback>
            </Avatar.Root>
            <Avatar.Root>
              <Avatar.Fallback>CD</Avatar.Fallback>
            </Avatar.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Separator</h3>
        <div className={styles.demoRow}>
          <div
            className={styles.demoContent}
            style={{ flexDirection: "column", alignItems: "stretch" }}
          >
            <span>Content above</span>
            <Separator.Root />
            <span>Content below</span>
          </div>
        </div>
        <div className={styles.demoRow}>
          <div className={styles.demoContent} style={{ height: "2rem" }}>
            <span>Left</span>
            <Separator.Root orientation="vertical" />
            <span>Right</span>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Scroll Area</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <ScrollArea.Root style={{ width: "15rem", height: "8rem" }}>
              <ScrollArea.Viewport>
                <ScrollArea.Content>
                  <div style={{ padding: "0.5rem" }}>
                    <p>
                      This is scrollable content. Scroll down to see more text.
                    </p>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                    <p>
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco
                      laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p>
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur.
                    </p>
                  </div>
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical">
                <ScrollArea.Thumb />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Toolbar</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Toolbar.Root>
              <Toolbar.Group>
                <Toolbar.Button aria-label="Undo">
                  <Undo size={16} />
                </Toolbar.Button>
                <Toolbar.Button aria-label="Redo">
                  <Redo size={16} />
                </Toolbar.Button>
              </Toolbar.Group>
              <Toolbar.Separator />
              <Toolbar.Group>
                <Toolbar.Button aria-label="Bold">
                  <Bold size={16} />
                </Toolbar.Button>
                <Toolbar.Button aria-label="Italic">
                  <Italic size={16} />
                </Toolbar.Button>
                <Toolbar.Button aria-label="Underline">
                  <Underline size={16} />
                </Toolbar.Button>
              </Toolbar.Group>
              <Toolbar.Separator />
              <Toolbar.Link href="#">
                <LinkIcon size={16} />
              </Toolbar.Link>
            </Toolbar.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Link</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Link href="/demo">Default</Link>
            <Link href="/demo" muted>
              Muted
            </Link>
            <Link href="https://base-ui.com" external>
              External
            </Link>
            <Link href="https://base-ui.com" external muted>
              Muted External
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

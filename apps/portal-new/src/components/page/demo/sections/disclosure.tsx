"use client";

import * as Accordion from "@/components/ui/accordion";
import styles from "../index.module.scss";

export const id = "disclosure";
export const title = "Disclosure";

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Accordion</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Accordion.Root>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>What is Base UI?</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  Base UI is a library of high-quality unstyled React
                  components.
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>How do I get started?</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  Head to the quick start guide in the docs.
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        </div>
      </div>
    </>
  );
}

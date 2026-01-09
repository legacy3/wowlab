"use client";

import { useState } from "react";
import * as Accordion from "@/components/ui/accordion";
import * as Checkbox from "@/components/ui/checkbox";
import * as Dialog from "@/components/ui/dialog";
import * as Field from "@/components/ui/field";
import * as Fieldset from "@/components/ui/fieldset";
import * as Form from "@/components/ui/form";
import * as Input from "@/components/ui/input";
import * as Menu from "@/components/ui/menu";
import * as NavigationMenu from "@/components/ui/navigation-menu";
import * as NumberField from "@/components/ui/number-field";
import * as Select from "@/components/ui/select";
import * as Switch from "@/components/ui/switch";
import * as Tabs from "@/components/ui/tabs";
import * as Tooltip from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FlaskLoader,
  FlaskInlineLoader,
  type FlaskVariant,
} from "@/components/ui/flask-loader";
import { ChevronDown, Minus, Plus } from "lucide-react";
import styles from "./index.module.scss";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.subsection}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function DemoRow({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.demoRow}>
      {label && <span className={styles.demoLabel}>{label}</span>}
      <div className={styles.demoContent}>{children}</div>
    </div>
  );
}

export function DemoContent() {
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
    <div className={styles.container}>
      <nav className={styles.toc}>
        <strong>Components</strong>
        <ul>
          <li>
            <a href="#loaders">Loaders</a>
          </li>
          <li>
            <a href="#skeleton">Skeleton</a>
          </li>
          <li>
            <a href="#forms">Forms</a>
          </li>
          <li>
            <a href="#navigation">Navigation</a>
          </li>
          <li>
            <a href="#overlays">Overlays</a>
          </li>
          <li>
            <a href="#disclosure">Disclosure</a>
          </li>
        </ul>
      </nav>

      <Section id="loaders" title="Flask Loaders">
        <p className={styles.description}>
          Branded loading indicators. Use <code>FlaskInlineLoader</code> for
          buttons and inline contexts, <code>FlaskLoader</code> for larger
          displays.
        </p>

        <Subsection title="Inline Loader">
          <p className={styles.description}>
            Inherits color from parent. Use in buttons, labels, or any inline
            context.
          </p>
          <DemoRow label="Variants">
            {(["loading", "processing", "idle"] as FlaskVariant[]).map((v) => (
              <span key={v} className={styles.inlineDemo}>
                <FlaskInlineLoader variant={v} />
                <code>{v}</code>
              </span>
            ))}
          </DemoRow>
          <DemoRow label="Sizes">
            <FlaskInlineLoader className={styles.inlineSm} />
            <FlaskInlineLoader />
            <FlaskInlineLoader className={styles.inlineLg} />
            <FlaskInlineLoader className={styles.inlineXl} />
          </DemoRow>
          <DemoRow label="In buttons">
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
          </DemoRow>
          <DemoRow label="Static">
            <FlaskInlineLoader animate={false} />
            <code>animate=false</code>
          </DemoRow>
        </Subsection>

        <Subsection title="Full Loader">
          <p className={styles.description}>
            Larger loader for page sections or cards.
          </p>
          <DemoRow label="Sizes">
            <div className={styles.loaderGrid}>
              {(["sm", "md", "lg", "xl"] as const).map((size) => (
                <div key={size} className={styles.loaderItem}>
                  <FlaskLoader size={size} />
                  <code>{size}</code>
                </div>
              ))}
            </div>
          </DemoRow>
          <DemoRow label="Variants">
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
          </DemoRow>
        </Subsection>
      </Section>

      <Section id="skeleton" title="Skeleton">
        <p className={styles.description}>
          Placeholder for content loading. Use for layout-preserving loading
          states.
        </p>
        <DemoRow label="Basic">
          <div className={styles.skeletonDemo}>
            <Skeleton width="8rem" height="1.5rem" />
            <Skeleton height="1rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </DemoRow>
        <DemoRow label="Card">
          <article className={styles.skeletonCard}>
            <header>
              <Skeleton width="40%" height="1.25rem" />
            </header>
            <Skeleton height="4rem" />
            <footer>
              <Skeleton width="6rem" height="2rem" />
            </footer>
          </article>
        </DemoRow>
      </Section>

      <Section id="forms" title="Forms">
        <Subsection title="Input">
          <DemoRow>
            <Input.Root placeholder="Type something..." />
          </DemoRow>
        </Subsection>

        <Subsection title="Number Field">
          <DemoRow>
            <NumberField.Root defaultValue={50} min={0} max={100}>
              <NumberField.Group>
                <NumberField.Decrement>
                  <Minus size={14} />
                </NumberField.Decrement>
                <NumberField.Input />
                <NumberField.Increment>
                  <Plus size={14} />
                </NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </DemoRow>
        </Subsection>

        <Subsection title="Select">
          <DemoRow>
            <Select.Root>
              <Select.Trigger>
                <Select.Value>
                  {(value) => value || "Select a fruit..."}
                </Select.Value>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="apple">
                      <Select.ItemText>Apple</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="banana">
                      <Select.ItemText>Banana</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="orange">
                      <Select.ItemText>Orange</Select.ItemText>
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </DemoRow>
        </Subsection>

        <Subsection title="Checkbox">
          <DemoRow>
            <label className={styles.inlineLabel}>
              <Checkbox.Root defaultChecked>
                <Checkbox.Indicator />
              </Checkbox.Root>
              Accept terms and conditions
            </label>
          </DemoRow>
        </Subsection>

        <Subsection title="Switch">
          <DemoRow>
            <label className={styles.inlineLabel}>
              <Switch.Root defaultChecked>
                <Switch.Thumb />
              </Switch.Root>
              Enable notifications
            </label>
          </DemoRow>
        </Subsection>

        <Subsection title="Complete Form">
          <Form.Root onSubmit={(e) => e.preventDefault()}>
            <Field.Root>
              <Field.Label>Username</Field.Label>
              <Input.Root placeholder="Enter username" required />
              <Field.Description>Choose a unique username.</Field.Description>
              <Field.Error match="valueMissing">
                Username is required.
              </Field.Error>
            </Field.Root>

            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input.Root type="email" placeholder="you@example.com" required />
              <Field.Error match="valueMissing">Email is required.</Field.Error>
              <Field.Error match="typeMismatch">
                Enter a valid email.
              </Field.Error>
            </Field.Root>

            <Fieldset.Root>
              <Fieldset.Legend>Preferences</Fieldset.Legend>
              <Field.Root>
                <Field.Label>Iterations</Field.Label>
                <NumberField.Root
                  defaultValue={10000}
                  min={1000}
                  max={100000}
                  step={1000}
                >
                  <NumberField.Group>
                    <NumberField.Decrement>
                      <Minus size={14} />
                    </NumberField.Decrement>
                    <NumberField.Input />
                    <NumberField.Increment>
                      <Plus size={14} />
                    </NumberField.Increment>
                  </NumberField.Group>
                </NumberField.Root>
                <Field.Description>
                  Number of simulation iterations.
                </Field.Description>
              </Field.Root>
            </Fieldset.Root>

            <button type="submit">Submit</button>
          </Form.Root>
        </Subsection>
      </Section>

      <Section id="navigation" title="Navigation">
        <Subsection title="Navigation Menu">
          <DemoRow>
            <NavigationMenu.Root>
              <NavigationMenu.List>
                <NavigationMenu.Item>
                  <NavigationMenu.Link href="#">Home</NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                  <NavigationMenu.Trigger>
                    Products
                    <NavigationMenu.Icon>
                      <ChevronDown size={14} />
                    </NavigationMenu.Icon>
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Portal>
                    <NavigationMenu.Positioner>
                      <NavigationMenu.Popup>
                        <NavigationMenu.Content>
                          <NavigationMenu.Link href="#">
                            Analytics
                          </NavigationMenu.Link>
                          <NavigationMenu.Link href="#">
                            Reporting
                          </NavigationMenu.Link>
                          <NavigationMenu.Link href="#">
                            Dashboard
                          </NavigationMenu.Link>
                        </NavigationMenu.Content>
                      </NavigationMenu.Popup>
                    </NavigationMenu.Positioner>
                  </NavigationMenu.Portal>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                  <NavigationMenu.Link href="#">About</NavigationMenu.Link>
                </NavigationMenu.Item>
              </NavigationMenu.List>
            </NavigationMenu.Root>
          </DemoRow>
        </Subsection>

        <Subsection title="Tabs">
          <DemoRow>
            <Tabs.Root defaultValue="tab1">
              <Tabs.List>
                <Tabs.Tab value="tab1">Account</Tabs.Tab>
                <Tabs.Tab value="tab2">Settings</Tabs.Tab>
                <Tabs.Tab value="tab3">Billing</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="tab1">
                <p>Account settings and profile information.</p>
              </Tabs.Panel>
              <Tabs.Panel value="tab2">
                <p>Application settings and preferences.</p>
              </Tabs.Panel>
              <Tabs.Panel value="tab3">
                <p>Billing information and invoices.</p>
              </Tabs.Panel>
            </Tabs.Root>
          </DemoRow>
        </Subsection>

        <Subsection title="Menu">
          <DemoRow>
            <Menu.Root>
              <Menu.Trigger>Open Menu</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item onSelect={() => console.log("Edit")}>
                      Edit
                    </Menu.Item>
                    <Menu.Item onSelect={() => console.log("Duplicate")}>
                      Duplicate
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onSelect={() => console.log("Delete")}>
                      Delete
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </DemoRow>
        </Subsection>
      </Section>

      <Section id="overlays" title="Overlays">
        <Subsection title="Dialog">
          <DemoRow>
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
          </DemoRow>
        </Subsection>

        <Subsection title="Tooltip">
          <DemoRow>
            <Tooltip.Root>
              <Tooltip.Trigger>Hover me</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>This is a tooltip!</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </DemoRow>
        </Subsection>
      </Section>

      <Section id="disclosure" title="Disclosure">
        <Subsection title="Accordion">
          <DemoRow>
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
          </DemoRow>
        </Subsection>
      </Section>
    </div>
  );
}

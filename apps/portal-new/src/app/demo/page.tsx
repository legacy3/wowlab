"use client";

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
import { ChevronDown, Minus, Plus } from "lucide-react";

export default function DemoPage() {
  return (
    <>
      <h1>UI Components</h1>
      <p>Base UI components wrapped with Pico CSS styling.</p>

      <section>
        <h2>Navigation Menu</h2>
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
      </section>

      <section>
        <h2>Form</h2>
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
            <Field.Error match="typeMismatch">Enter a valid email.</Field.Error>
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
      </section>

      <section>
        <h2>Input</h2>
        <Input.Root placeholder="Type something..." />
      </section>

      <section>
        <h2>Number Field</h2>
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
      </section>

      <section>
        <h2>Select</h2>
        <Select.Root>
          <Select.Trigger>
            <Select.Value>
              {(value) => value || "Select a fruit..."}
            </Select.Value>
          </Select.Trigger>
          <Select.Portal>
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
          </Select.Portal>
        </Select.Root>
      </section>

      <section>
        <h2>Checkbox</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Checkbox.Root defaultChecked>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Accept terms and conditions
        </label>
      </section>

      <section>
        <h2>Switch</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          Enable notifications
        </label>
      </section>

      <section>
        <h2>Tabs</h2>
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
      </section>

      <section>
        <h2>Accordion</h2>
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>What is Base UI?</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              Base UI is a library of high-quality unstyled React components.
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
      </section>

      <section>
        <h2>Dialog</h2>
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
      </section>

      <section>
        <h2>Menu</h2>
        <Menu.Root>
          <Menu.Trigger>Open Menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Popup>
              <Menu.Item onSelect={() => console.log("Edit")}>Edit</Menu.Item>
              <Menu.Item onSelect={() => console.log("Duplicate")}>
                Duplicate
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item onSelect={() => console.log("Delete")}>
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Portal>
        </Menu.Root>
      </section>

      <section>
        <h2>Tooltip</h2>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Popup>This is a tooltip!</Tooltip.Popup>
          </Tooltip.Portal>
        </Tooltip.Root>
      </section>
    </>
  );
}

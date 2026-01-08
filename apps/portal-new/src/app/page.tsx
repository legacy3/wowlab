"use client";

import * as Accordion from "@/components/ui/accordion";
import * as Checkbox from "@/components/ui/checkbox";
import * as Dialog from "@/components/ui/dialog";
import * as Menu from "@/components/ui/menu";
import * as Select from "@/components/ui/select";
import * as Switch from "@/components/ui/switch";
import * as Tabs from "@/components/ui/tabs";
import * as Tooltip from "@/components/ui/tooltip";

export default function Home() {
  return (
    <main className="container">
      <h1>Base UI Components</h1>

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
        <h2>Select</h2>
        <Select.Root>
          <Select.Trigger>
            <Select.Value placeholder="Select a fruit..." />
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
        <h2>Switch</h2>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          Enable notifications
        </label>
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
        <h2>Tooltip</h2>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Popup>This is a tooltip!</Tooltip.Popup>
          </Tooltip.Portal>
        </Tooltip.Root>
      </section>
    </main>
  );
}

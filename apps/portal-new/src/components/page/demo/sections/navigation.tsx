"use client";

import * as Menu from "@/components/ui/menu";
import * as Menubar from "@/components/ui/menubar";
import * as NavigationMenu from "@/components/ui/navigation-menu";
import * as Tabs from "@/components/ui/tabs";
import { ChevronDown } from "lucide-react";
import styles from "../index.module.scss";

export const id = "navigation";
export const title = "Navigation";

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Navigation Menu</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
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
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Tabs</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
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
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Menu</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
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
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Menubar</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Menubar.Root>
              <Menubar.MenuRoot>
                <Menubar.Trigger>File</Menubar.Trigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Popup>
                      <Menubar.Item>New</Menubar.Item>
                      <Menubar.Item>Open</Menubar.Item>
                      <Menubar.Item>Save</Menubar.Item>
                      <Menubar.Separator />
                      <Menubar.Item>Exit</Menubar.Item>
                    </Menubar.Popup>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.MenuRoot>
              <Menubar.MenuRoot>
                <Menubar.Trigger>Edit</Menubar.Trigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Popup>
                      <Menubar.Item>Undo</Menubar.Item>
                      <Menubar.Item>Redo</Menubar.Item>
                      <Menubar.Separator />
                      <Menubar.Item>Cut</Menubar.Item>
                      <Menubar.Item>Copy</Menubar.Item>
                      <Menubar.Item>Paste</Menubar.Item>
                    </Menubar.Popup>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.MenuRoot>
              <Menubar.MenuRoot>
                <Menubar.Trigger>View</Menubar.Trigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Popup>
                      <Menubar.Item>Zoom In</Menubar.Item>
                      <Menubar.Item>Zoom Out</Menubar.Item>
                      <Menubar.Item>Reset Zoom</Menubar.Item>
                    </Menubar.Popup>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.MenuRoot>
            </Menubar.Root>
          </div>
        </div>
      </div>
    </>
  );
}

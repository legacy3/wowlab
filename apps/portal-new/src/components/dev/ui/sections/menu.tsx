import {
  ChevronDownIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { HStack } from "styled-system/jsx";

import { Button, IconButton, Menu } from "@/components/ui";

import { Section } from "../shared";

export function MenuSection() {
  return (
    <Section id="menu" title="Menu">
      <HStack gap="4">
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="outline">
              Open Menu <ChevronDownIcon />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="profile">
                <UserIcon /> Profile
              </Menu.Item>
              <Menu.Item value="settings">
                <SettingsIcon /> Settings
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item value="logout">
                <LogOutIcon /> Logout
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton aria-label="More options" variant="outline">
              <MoreHorizontalIcon />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="edit">Edit</Menu.Item>
              <Menu.Item value="duplicate">Duplicate</Menu.Item>
              <Menu.Separator />
              <Menu.Item value="delete">Delete</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </HStack>
    </Section>
  );
}

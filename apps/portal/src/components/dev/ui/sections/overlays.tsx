"use client";

import {
  ChevronDownIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { HStack, Stack } from "styled-system/jsx";

import {
  Button,
  Dialog,
  Drawer,
  IconButton,
  Input,
  Menu,
  Popover,
  Text,
  Tooltip,
} from "@/components/ui";

import { DemoBox, DemoDescription, Section, Subsection } from "../../shared";

export function OverlaysSection() {
  return (
    <Section id="overlays" title="Overlays" lazy>
      <Stack gap="10">
        <TooltipDemo />
        <DialogDemo />
        <DrawerDemo />
        <PopoverDemo />
        <MenuDemo />
      </Stack>
    </Section>
  );
}

function DialogDemo() {
  return (
    <Subsection title="Dialog">
      <DemoDescription>Modal windows for confirmations.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Dialog.Root key={size} size={size}>
              <Dialog.Trigger asChild>
                <Button variant="outline">Size: {size}</Button>
              </Dialog.Trigger>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>Dialog ({size})</Dialog.Title>
                    <Dialog.Description>
                      This is a {size} dialog example.
                    </Dialog.Description>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Text>Dialog content goes here.</Text>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </Dialog.CloseTrigger>
                    <Dialog.ActionTrigger asChild>
                      <Button>Confirm</Button>
                    </Dialog.ActionTrigger>
                  </Dialog.Footer>
                  <Dialog.CloseTrigger asChild pos="absolute" top="3" right="3">
                    <IconButton variant="plain" size="sm" aria-label="Close">
                      <XIcon />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function DrawerDemo() {
  return (
    <Subsection title="Drawer">
      <DemoDescription>Side panels from any edge.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap">
          {(["start", "end", "top", "bottom"] as const).map((placement) => (
            <Drawer.Root key={placement} placement={placement}>
              <Drawer.Trigger asChild>
                <Button variant="outline">Open {placement}</Button>
              </Drawer.Trigger>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content>
                  <Drawer.Header>
                    <Drawer.Title>Drawer ({placement})</Drawer.Title>
                    <Drawer.Description>
                      This drawer slides in from the {placement}.
                    </Drawer.Description>
                  </Drawer.Header>
                  <Drawer.Body>
                    <Text>Drawer content goes here.</Text>
                  </Drawer.Body>
                  <Drawer.Footer>
                    <Drawer.CloseTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </Drawer.CloseTrigger>
                    <Button>Save</Button>
                  </Drawer.Footer>
                </Drawer.Content>
              </Drawer.Positioner>
            </Drawer.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function MenuDemo() {
  return (
    <Subsection title="Menu">
      <DemoDescription>Dropdown menus with icons.</DemoDescription>
      <DemoBox>
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
      </DemoBox>
    </Subsection>
  );
}

function PopoverDemo() {
  return (
    <Subsection title="Popover">
      <DemoDescription>Floating content on click.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap">
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button variant="outline">Basic</Button>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Arrow />
                <Popover.Body>
                  <Text>Simple popover content</Text>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>

          <Popover.Root>
            <Popover.Trigger asChild>
              <Button>With Form</Button>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="72">
                <Popover.Arrow />
                <Popover.Header>
                  <Popover.Title>Rename Rotation</Popover.Title>
                </Popover.Header>
                <Popover.Body>
                  <Input placeholder="Rotation name..." />
                </Popover.Body>
                <Popover.Footer>
                  <Popover.CloseTrigger asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </Popover.CloseTrigger>
                  <Button size="sm">Save</Button>
                </Popover.Footer>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function TooltipDemo() {
  return (
    <Subsection title="Tooltip">
      <DemoDescription>Hover hints.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap">
          <Tooltip content="Simple tooltip">
            <Button variant="outline">Hover me</Button>
          </Tooltip>
          <Tooltip content="With arrow" showArrow>
            <Button variant="outline">With Arrow</Button>
          </Tooltip>
          <Tooltip content="Opens on top" positioning={{ placement: "top" }}>
            <Button variant="outline">Top</Button>
          </Tooltip>
          <Tooltip
            content="Opens on right"
            positioning={{ placement: "right" }}
          >
            <Button variant="outline">Right</Button>
          </Tooltip>
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

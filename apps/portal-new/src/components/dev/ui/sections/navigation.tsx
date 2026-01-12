"use client";

import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import NextLink from "next/link";
import { HStack, Stack } from "styled-system/jsx";

import {
  Accordion,
  Breadcrumb,
  Collapsible,
  Expandable,
  Link,
  Tabs,
  Text,
} from "@/components/ui";

import { Section, Subsection } from "../../shared";

export function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation">
      <Stack gap="8">
        <BreadcrumbDemo />
        <LinkDemo />
        <TabsDemo />
        <AccordionDemo />
        <CollapsibleDemo />
        <ExpandableDemo />
      </Stack>
    </Section>
  );
}

function AccordionDemo() {
  return (
    <Subsection title="Accordion">
      <Accordion.Root defaultValue={["item-1"]} multiple>
        {["First", "Second", "Third"].map((label, i) => (
          <Accordion.Item key={i} value={`item-${i + 1}`}>
            <Accordion.ItemTrigger>
              {label} Item
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Text>Content for {label.toLowerCase()} accordion item.</Text>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Subsection>
  );
}

function BreadcrumbDemo() {
  return (
    <Subsection title="Breadcrumb">
      <Stack gap="4">
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Link asChild textStyle="sm">
                <NextLink href="/">Home</NextLink>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Link asChild textStyle="sm">
                <NextLink href="/dev">Dev</NextLink>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Text textStyle="sm" color="fg.muted">
                UI
              </Text>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <Text color="fg.muted" textStyle="sm">
          Pass explicit breadcrumbs to PageContainer. Last item has no href
          (current page).
        </Text>
      </Stack>
    </Subsection>
  );
}

function CollapsibleDemo() {
  return (
    <Subsection title="Collapsible">
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle Content</Collapsible.Trigger>
        <Collapsible.Content>
          <Text py="4">
            This content can be expanded and collapsed. It animates smoothly
            when toggling.
          </Text>
        </Collapsible.Content>
      </Collapsible.Root>
    </Subsection>
  );
}

function ExpandableDemo() {
  return (
    <Subsection title="Expandable">
      <Text color="fg.muted" mb="4">
        Click to expand images/diagrams in a fullscreen modal.
      </Text>
      <HStack gap="4" flexWrap="wrap">
        <Expandable title="Sample Image" variant="image">
          <img
            src="https://placehold.co/200x150/1a1a1a/666?text=Click+to+expand"
            alt="Sample"
            style={{ borderRadius: "8px", cursor: "pointer" }}
          />
        </Expandable>
        <Expandable title="Diagram View" variant="diagram">
          <div
            style={{
              alignItems: "center",
              background: "var(--colors-gray-3)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              height: 150,
              justifyContent: "center",
              width: 200,
            }}
          >
            <Text color="fg.muted">Click to expand</Text>
          </div>
        </Expandable>
      </HStack>
    </Subsection>
  );
}

function LinkDemo() {
  return (
    <Subsection title="Link">
      <HStack gap="6" flexWrap="wrap">
        <Link href="#">Default link</Link>
        <Link href="#" colorPalette="amber">
          Colored link
        </Link>
        <Link href="#" textDecoration="underline">
          Underlined link
        </Link>
        <Link href="https://example.com" target="_blank">
          External link <ExternalLinkIcon size={14} />
        </Link>
      </HStack>
    </Subsection>
  );
}

function TabsDemo() {
  return (
    <Subsection title="Tabs">
      <Stack gap="6">
        {(["line", "subtle", "enclosed"] as const).map((variant) => (
          <Tabs.Root key={variant} defaultValue="tab1" variant={variant}>
            <Tabs.List>
              <Tabs.Trigger value="tab1">Account</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Password</Tabs.Trigger>
              <Tabs.Trigger value="tab3">Settings</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
            <Tabs.Content value="tab1">
              <Text py="4">Account content ({variant})</Text>
            </Tabs.Content>
            <Tabs.Content value="tab2">
              <Text py="4">Password content ({variant})</Text>
            </Tabs.Content>
            <Tabs.Content value="tab3">
              <Text py="4">Settings content ({variant})</Text>
            </Tabs.Content>
          </Tabs.Root>
        ))}
      </Stack>
    </Subsection>
  );
}

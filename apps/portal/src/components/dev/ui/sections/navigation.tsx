"use client";

import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Box, HStack, Stack, styled } from "styled-system/jsx";

import {
  Accordion,
  Breadcrumb,
  Button,
  Collapsible,
  Expandable,
  Link,
  Steps,
  Tabs,
  Text,
} from "@/components/ui";
import { href, routes } from "@/lib/routing";

import { DemoBox, DemoDescription, Section, Subsection } from "../../shared";

export function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation">
      <Stack gap="10">
        <BreadcrumbDemo />
        <LinkDemo />
        <TabsDemo />
        <StepsDemo />
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
      <DemoDescription>Expandable content sections.</DemoDescription>
      <DemoBox>
        <Accordion.Root defaultValue={["item-1"]} multiple>
          {["Stats", "Rotation", "Consumables"].map((label, i) => (
            <Accordion.Item key={i} value={`item-${i + 1}`}>
              <Accordion.ItemTrigger>
                {label}
                <Accordion.ItemIndicator>
                  <ChevronDownIcon />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <Text textStyle="sm">{label} configuration options.</Text>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </DemoBox>
    </Subsection>
  );
}

function BreadcrumbDemo() {
  return (
    <Subsection title="Breadcrumb">
      <DemoDescription>Hierarchical navigation path.</DemoDescription>
      <DemoBox>
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Link href={href(routes.home)} textStyle="sm">
                Home
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Link href={href(routes.dev.index)} textStyle="sm">
                Dev
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
      </DemoBox>
    </Subsection>
  );
}

function CollapsibleDemo() {
  return (
    <Subsection title="Collapsible">
      <DemoDescription>Show/hide content toggle.</DemoDescription>
      <DemoBox>
        <Collapsible.Root>
          <Collapsible.Trigger>Toggle Content</Collapsible.Trigger>
          <Collapsible.Content>
            <Text py="3" textStyle="sm">
              This content can be expanded and collapsed with a smooth
              animation.
            </Text>
          </Collapsible.Content>
        </Collapsible.Root>
      </DemoBox>
    </Subsection>
  );
}

function ExpandableDemo() {
  return (
    <Subsection title="Expandable">
      <DemoDescription>Fullscreen expand for images.</DemoDescription>
      <HStack gap="4" flexWrap="wrap">
        <DemoBox>
          <Expandable title="Sample Image" variant="image">
            <styled.div
              alignItems="center"
              bg="gray.3"
              borderRadius="md"
              cursor="pointer"
              display="flex"
              h="100px"
              justifyContent="center"
              w="140px"
            >
              <Text textStyle="xs" color="fg.muted">
                Image
              </Text>
            </styled.div>
          </Expandable>
        </DemoBox>
        <DemoBox>
          <Expandable title="Diagram View" variant="diagram">
            <styled.div
              alignItems="center"
              bg="gray.3"
              borderRadius="md"
              cursor="pointer"
              display="flex"
              h="100px"
              justifyContent="center"
              w="140px"
            >
              <Text textStyle="xs" color="fg.muted">
                Diagram
              </Text>
            </styled.div>
          </Expandable>
        </DemoBox>
      </HStack>
    </Subsection>
  );
}

function LinkDemo() {
  return (
    <Subsection title="Link">
      <DemoDescription>Styled anchor elements.</DemoDescription>
      <DemoBox>
        <HStack gap="6" flexWrap="wrap">
          <Link href="#">Default</Link>
          <Link href="#" colorPalette="amber">
            Colored
          </Link>
          <Link href="#" textDecoration="underline">
            Underlined
          </Link>
          <Link href="https://example.com" target="_blank">
            External <ExternalLinkIcon size={14} />
          </Link>
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function StepsDemo() {
  const [formComplete, setFormComplete] = useState(false);

  const steps = useMemo(
    () => [
      { label: "Import", value: "details" as const },
      {
        canUnlock: () => formComplete,
        label: "Configure",
        value: "review" as const,
      },
      {
        canUnlock: () => formComplete,
        label: "Simulate",
        value: "complete" as const,
      },
    ],
    [formComplete],
  );

  const wizard = Steps.useStepsState({
    initialValue: "details",
    steps,
  });

  const nextStep = steps[wizard.currentIndex + 1];

  return (
    <Subsection title="Steps">
      <DemoDescription>Multi-step wizard navigation.</DemoDescription>
      <DemoBox>
        <Steps.Root {...wizard.rootProps}>
          <Steps.List />

          <Steps.Content value="details">
            <Stack py="4" gap="3">
              <Text textStyle="sm">Import your character from SimC.</Text>
              <Box>
                <Button size="sm" onClick={() => setFormComplete(true)}>
                  Import Character
                </Button>
              </Box>
            </Stack>
          </Steps.Content>

          <Steps.Content value="review">
            <Stack py="4">
              <Text textStyle="sm">Configure simulation settings.</Text>
            </Stack>
          </Steps.Content>

          <Steps.Content value="complete">
            <Stack py="4">
              <Text textStyle="sm">Ready to run simulation.</Text>
            </Stack>
          </Steps.Content>
        </Steps.Root>

        <HStack
          gap="2"
          mt="2"
          pt="3"
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <Button
            size="xs"
            variant="outline"
            onClick={wizard.goBack}
            disabled={wizard.isFirst}
          >
            Back
          </Button>
          <Button
            size="xs"
            onClick={wizard.goNext}
            disabled={
              wizard.isLast || (nextStep && !wizard.isUnlocked(nextStep.value))
            }
          >
            Next
          </Button>
          <Button
            size="xs"
            variant="plain"
            onClick={() => {
              setFormComplete(false);
              wizard.reset();
            }}
          >
            Reset
          </Button>
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function TabsDemo() {
  return (
    <Subsection title="Tabs">
      <DemoDescription>Tab navigation variants.</DemoDescription>
      <Stack gap="4">
        {(["line", "subtle", "enclosed"] as const).map((variant) => (
          <DemoBox key={variant}>
            <Text textStyle="xs" color="fg.subtle" mb="2">
              variant=&quot;{variant}&quot;
            </Text>
            <Tabs.Root defaultValue="tab1" variant={variant}>
              <Tabs.List>
                <Tabs.Trigger value="tab1">Character</Tabs.Trigger>
                <Tabs.Trigger value="tab2">Talents</Tabs.Trigger>
                <Tabs.Trigger value="tab3">Gear</Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
              <Tabs.Content value="tab1">
                <Text py="3" textStyle="sm">
                  Character info and stats
                </Text>
              </Tabs.Content>
              <Tabs.Content value="tab2">
                <Text py="3" textStyle="sm">
                  Talent configuration
                </Text>
              </Tabs.Content>
              <Tabs.Content value="tab3">
                <Text py="3" textStyle="sm">
                  Equipment and item levels
                </Text>
              </Tabs.Content>
            </Tabs.Root>
          </DemoBox>
        ))}
      </Stack>
    </Subsection>
  );
}

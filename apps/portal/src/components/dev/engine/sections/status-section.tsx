"use client";

import { HStack, Stack } from "styled-system/jsx";

import { Badge, Code } from "@/components/ui";
import { useEngine } from "@/providers";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  Section,
  Subsection,
} from "../../shared";

const FEATURES = [
  "Rotation Parsing",
  "Rotation Validation",
  "VarPath Schema",
  "SimC Profile Parsing",
  "Resource Types",
  "Damage Schools",
];

export function StatusSection() {
  return (
    <Section id="status" title="Engine Status">
      <Stack gap="10">
        <InitDemo />
        <FeaturesDemo />
        <ImportsDemo />
      </Stack>
    </Section>
  );
}

function FeaturesDemo() {
  return (
    <Subsection title="Features">
      <DemoDescription>Capabilities in this WASM build.</DemoDescription>
      <DemoBox>
        <HStack gap="2" flexWrap="wrap">
          {FEATURES.map((feature) => (
            <Badge key={feature} variant="outline">
              {feature}
            </Badge>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function ImportsDemo() {
  return (
    <Subsection title="Usage">
      <DemoDescription>Import engine functions from the lib.</DemoDescription>
      <DemoBox>
        <Code language="typescript">{`import { useEngine } from "@/providers";

// In your component
const engine = useEngine();

// Schema
const schema = engine.getVarPathSchema();

// Parsing
const profile = engine.parseSimc(input);
const rotation = engine.parseRotation(json);

// Validation
const result = engine.validateRotation(json);`}</Code>
      </DemoBox>
    </Subsection>
  );
}

function InitDemo() {
  const engine = useEngine();
  const version = engine.getEngineVersion();

  return (
    <Subsection title="Initialization">
      <DemoDescription>
        WASM module status and version information.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Status</DemoLabel>
          <Badge colorPalette="green">Ready</Badge>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Version</DemoLabel>
          <Code>{version}</Code>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

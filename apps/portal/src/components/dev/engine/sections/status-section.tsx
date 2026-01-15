"use client";

import { useEffect, useState } from "react";
import { HStack, Stack } from "styled-system/jsx";

import { Badge, Button, Code, Text } from "@/components/ui";
import { getEngineVersion, useEngine } from "@/lib/engine";

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
        <Code language="typescript">{`import {
  initEngine,
  getEngineVersion,
  parseRotation,
  validateRotation,
  getVarPathSchema,
  parseSimc,
} from "@/lib/engine";`}</Code>
      </DemoBox>
    </Subsection>
  );
}

function InitDemo() {
  const { error, isLoading, isReady, retry } = useEngine();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      getEngineVersion().then(setVersion);
    }
  }, [isReady]);

  return (
    <Subsection title="Initialization">
      <DemoDescription>
        WASM module status and version information.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Status</DemoLabel>
          <HStack gap="3">
            {isLoading && <Badge colorPalette="amber">Initializing...</Badge>}
            {isReady && <Badge colorPalette="green">Ready</Badge>}
            {error && (
              <>
                <Badge colorPalette="red">Error</Badge>
                <Button size="xs" variant="outline" onClick={retry}>
                  Retry
                </Button>
              </>
            )}
          </HStack>
          {error && (
            <Text color="fg.error" textStyle="xs" mt="2">
              {error.message}
            </Text>
          )}
        </DemoBox>
        <DemoBox>
          <DemoLabel>Version</DemoLabel>
          {version ? (
            <Code>{version}</Code>
          ) : (
            <Text color="fg.muted" textStyle="sm">
              {isReady ? "Loading..." : "Engine not ready"}
            </Text>
          )}
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

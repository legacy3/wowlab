"use client";

import { useEffect, useState } from "react";
import { HStack, Stack } from "styled-system/jsx";

import { Badge, Button, Code, Text } from "@/components/ui";
import { engine } from "@/lib/engine";

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
        <Code language="typescript">{`import { engine } from "@/lib/engine";

// Schema
const schema = await engine.schema.varPaths();

// Parsing
const profile = await engine.parseSimc(input);
const rotation = await engine.parseRotation(json);

// Validation
const result = await engine.validate(json);`}</Code>
      </DemoBox>
    </Subsection>
  );
}

function InitDemo() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const load = () => {
    setStatus("loading");
    setError(null);
    engine
      .version()
      .then((v) => {
        setVersion(v);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err);
        setStatus("error");
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Subsection title="Initialization">
      <DemoDescription>
        WASM module status and version information.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Status</DemoLabel>
          <HStack gap="3">
            {status === "loading" && (
              <Badge colorPalette="amber">Initializing...</Badge>
            )}
            {status === "ready" && <Badge colorPalette="green">Ready</Badge>}
            {status === "error" && (
              <>
                <Badge colorPalette="red">Error</Badge>
                <Button size="xs" variant="outline" onClick={load}>
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
              {status === "loading" ? "Loading..." : "Engine not ready"}
            </Text>
          )}
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

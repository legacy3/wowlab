"use client";

import { useEffect, useState } from "react";
import { Box, Grid, Stack } from "styled-system/jsx";

import { Badge, Code, InlineLoader, Text } from "@/components/ui";
import { getEngineVersion, useEngine } from "@/lib/engine";

import { DemoBox, Section, Subsection } from "../../shared";

export function StatusSection() {
  const { error, isLoading, isReady, retry } = useEngine();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      getEngineVersion().then(setVersion);
    }
  }, [isReady]);

  return (
    <Section id="status" title="Engine Status">
      <Subsection title="Initialization">
        <DemoBox>
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">
                Status
              </Text>
              {isLoading && (
                <Stack direction="row" align="center" gap="2">
                  <InlineLoader />
                  <Text color="fg.muted">Initializing WASM...</Text>
                </Stack>
              )}
              {error && (
                <Stack gap="2">
                  <Badge colorPalette="red">Error</Badge>
                  <Text color="fg.error" textStyle="sm">
                    {error.message}
                  </Text>
                  <button onClick={retry}>Retry</button>
                </Stack>
              )}
              {isReady && !error && <Badge colorPalette="green">Ready</Badge>}
            </Stack>

            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">
                Version
              </Text>
              {version ? (
                <Code>{version}</Code>
              ) : (
                <Text color="fg.muted" textStyle="sm">
                  Loading...
                </Text>
              )}
            </Stack>
          </Grid>
        </DemoBox>
      </Subsection>

      <Subsection title="Features">
        <DemoBox>
          <Text color="fg.muted" textStyle="sm" mb="3">
            Engine capabilities in this WASM build:
          </Text>
          <Stack direction="row" gap="2" flexWrap="wrap">
            <Badge>Rotation Parsing</Badge>
            <Badge>Rotation Validation</Badge>
            <Badge>VarPath Schema</Badge>
            <Badge>SimC Profile Parsing</Badge>
            <Badge>Resource Types</Badge>
            <Badge>Damage Schools</Badge>
          </Stack>
        </DemoBox>
      </Subsection>

      <Subsection title="Module Info">
        <DemoBox>
          <Box overflow="auto">
            <Code language="typescript">{`import {
  initEngine,
  getEngineVersion,
  parseRotation,
  validateRotation,
  getVarPathSchema,
  parseSimc,
} from "@/lib/engine";`}</Code>
          </Box>
        </DemoBox>
      </Subsection>
    </Section>
  );
}

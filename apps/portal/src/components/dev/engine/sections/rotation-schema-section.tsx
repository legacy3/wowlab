"use client";

import { useEffect, useState } from "react";
import { Box, Grid, Stack } from "styled-system/jsx";

import { Badge, Code, Text } from "@/components/ui";
import {
  getVarPathSchema,
  useEngine,
  type VarPathCategory,
  type VarPathInfo,
} from "@/lib/engine";

import { DemoBox, JsonOutput, Section, Subsection } from "../../shared";

export function RotationSchemaSection() {
  const { isReady } = useEngine();
  const [schema, setSchema] = useState<VarPathCategory[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isReady) {
      setIsLoading(true);
      getVarPathSchema()
        .then(setSchema)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [isReady]);

  const totalPaths =
    schema?.reduce((sum, cat) => sum + cat.paths.length, 0) ?? 0;

  return (
    <Section id="rotation-schema" title="Rotation Schema">
      <Subsection title="VarPath Categories">
        <DemoBox>
          <Text color="fg.muted" textStyle="sm" mb="4">
            Available variable paths for rotation conditions. These are the
            values you can reference in rotation expressions.
          </Text>

          {!isReady ? (
            <Text color="fg.muted">Engine not ready...</Text>
          ) : isLoading ? (
            <Text color="fg.muted">Loading schema...</Text>
          ) : error ? (
            <Text color="fg.error">{error.message}</Text>
          ) : schema ? (
            <>
              <Stack direction="row" gap="2" mb="4">
                <Badge colorPalette="blue">{schema.length} Categories</Badge>
                <Badge colorPalette="green">{totalPaths} Total Paths</Badge>
              </Stack>
              <Stack gap="2">
                {schema.map((category) => (
                  <VarPathCard key={category.name} category={category} />
                ))}
              </Stack>
            </>
          ) : null}
        </DemoBox>
      </Subsection>

      <Subsection title="Raw Schema">
        <DemoBox>
          <JsonOutput data={schema} error={error} isLoading={isLoading} />
        </DemoBox>
      </Subsection>
    </Section>
  );
}

function VarPathCard({ category }: { category: VarPathCategory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="l2"
      overflow="hidden"
    >
      <Box
        as="button"
        w="full"
        p="3"
        bg="bg.subtle"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        _hover={{ bg: "gray.3" }}
      >
        <Stack direction="row" align="center" gap="2">
          <Text fontWeight="medium">{category.name}</Text>
          <Badge size="sm" variant="outline">
            {category.paths.length}
          </Badge>
        </Stack>
        <Text color="fg.muted" textStyle="sm">
          {expanded ? "−" : "+"}
        </Text>
      </Box>

      {expanded && (
        <Box p="3" borderTopWidth="1px" borderColor="border.subtle">
          <Text color="fg.muted" textStyle="sm" mb="3">
            {category.description}
          </Text>
          <Stack gap="2">
            {category.paths.map((path: VarPathInfo) => (
              <Box
                key={path.name}
                p="2"
                bg="bg.canvas"
                borderRadius="l1"
                borderWidth="1px"
                borderColor="border.default"
              >
                <Stack
                  direction="row"
                  justify="space-between"
                  align="start"
                  mb="1"
                >
                  <Code>{path.name}</Code>
                  <Badge
                    size="sm"
                    colorPalette={
                      path.valueType === "bool"
                        ? "blue"
                        : path.valueType === "int"
                          ? "purple"
                          : "green"
                    }
                  >
                    {path.valueType}
                  </Badge>
                </Stack>
                <Text color="fg.muted" textStyle="xs">
                  {path.description}
                </Text>
                {path.hasArg && (
                  <Text color="fg.subtle" textStyle="xs" mt="1">
                    Arg: <Code>{path.argName}</Code>
                  </Text>
                )}
                <Text color="fg.subtle" textStyle="xs" mt="1">
                  Example: <Code>{path.example}</Code>
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

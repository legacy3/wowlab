"use client";

import { useState } from "react";
import { HStack, Stack } from "styled-system/jsx";

import { Badge, Button, Code, Text, Textarea } from "@/components/ui";
import {
  parseRotation,
  type Rotation,
  useEngine,
  validateRotation,
  type ValidationResult,
} from "@/lib/engine";

import {
  DataCard,
  DemoBox,
  DemoDescription,
  DemoLabel,
  JsonOutput,
  Section,
  Subsection,
} from "../../shared";

const EXAMPLE_VALID = `{
  "actions": [
    { "type": "cast", "spell": "kill_command" },
    { "type": "cast", "spell": "barbed_shot" },
    { "type": "cast", "spell": "cobra_shot" }
  ],
  "lists": {},
  "variables": {}
}`;

const EXAMPLE_INVALID = `{
  "actions": [],
  "variables": {
    "bad": { "type": "userVar", "name": "nonexistent" }
  }
}`;

export function ValidatorSection() {
  return (
    <Section id="validator" title="Rotation Validator">
      <Stack gap="10">
        <ParserDemo />
        <ValidatorDemo />
      </Stack>
    </Section>
  );
}

function ParserDemo() {
  const { isReady } = useEngine();
  const [input, setInput] = useState(EXAMPLE_VALID);
  const [result, setResult] = useState<Rotation | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleParse = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const parsed = await parseRotation(input);
      setResult(parsed);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Subsection title="Parser">
      <DemoDescription>
        Parse rotation JSON into a structured Rotation object.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Input</DemoLabel>
          <Stack gap="3">
            <HStack gap="2">
              <Badge
                as="button"
                cursor="pointer"
                onClick={() => setInput(EXAMPLE_VALID)}
                _hover={{ opacity: 0.8 }}
              >
                Valid
              </Badge>
              <Badge
                as="button"
                cursor="pointer"
                colorPalette="red"
                onClick={() => setInput(EXAMPLE_INVALID)}
                _hover={{ opacity: 0.8 }}
              >
                Invalid
              </Badge>
            </HStack>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              fontFamily="mono"
              fontSize="sm"
            />
            <Button
              size="sm"
              onClick={handleParse}
              disabled={!isReady}
              loading={isLoading}
            >
              Parse
            </Button>
          </Stack>
        </DemoBox>
        <DataCard title="parseRotation(json)" description="Parsed result">
          <JsonOutput data={result} error={error} isLoading={isLoading} />
        </DataCard>
      </Stack>
    </Subsection>
  );
}

function ValidationDisplay({ result }: { result: ValidationResult }) {
  return (
    <Stack gap="4">
      <HStack gap="2">
        <Text fontWeight="medium">Status:</Text>
        <Badge colorPalette={result.valid ? "green" : "red"} size="lg">
          {result.valid ? "Valid" : "Invalid"}
        </Badge>
      </HStack>

      {result.errors.length > 0 && (
        <Stack gap="2">
          <Text fontWeight="medium" textStyle="sm">
            Errors ({result.errors.length})
          </Text>
          {result.errors.map((err, i) => (
            <Code key={i}>{JSON.stringify(err)}</Code>
          ))}
        </Stack>
      )}

      {result.warnings.length > 0 && (
        <Stack gap="2">
          <Text fontWeight="medium" textStyle="sm">
            Warnings ({result.warnings.length})
          </Text>
          {result.warnings.map((warn, i) => (
            <Code key={i}>{JSON.stringify(warn)}</Code>
          ))}
        </Stack>
      )}

      {result.valid && !result.errors.length && !result.warnings.length && (
        <Text color="fg.muted">No errors or warnings.</Text>
      )}
    </Stack>
  );
}

function ValidatorDemo() {
  const { isReady } = useEngine();
  const [input, setInput] = useState(EXAMPLE_VALID);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const validated = await validateRotation(input);
      setResult(validated);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Subsection title="Validator">
      <DemoDescription>
        Validate rotation JSON and check for errors and warnings.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Input</DemoLabel>
          <Stack gap="3">
            <HStack gap="2">
              <Badge
                as="button"
                cursor="pointer"
                onClick={() => setInput(EXAMPLE_VALID)}
                _hover={{ opacity: 0.8 }}
              >
                Valid
              </Badge>
              <Badge
                as="button"
                cursor="pointer"
                colorPalette="red"
                onClick={() => setInput(EXAMPLE_INVALID)}
                _hover={{ opacity: 0.8 }}
              >
                Invalid
              </Badge>
            </HStack>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              fontFamily="mono"
              fontSize="sm"
            />
            <Button
              size="sm"
              onClick={handleValidate}
              disabled={!isReady}
              loading={isLoading}
            >
              Validate
            </Button>
          </Stack>
        </DemoBox>
        <DataCard
          title="validateRotation(json)"
          description="Validation result"
        >
          {error ? (
            <Text color="fg.error">{error.message}</Text>
          ) : result ? (
            <ValidationDisplay result={result} />
          ) : (
            <JsonOutput data={null} error={null} isLoading={isLoading} />
          )}
        </DataCard>
      </Stack>
    </Subsection>
  );
}

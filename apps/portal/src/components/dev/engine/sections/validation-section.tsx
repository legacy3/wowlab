"use client";

import { useState } from "react";
import { Box, Stack } from "styled-system/jsx";

import { Badge, Button, Code, Text, Textarea } from "@/components/ui";
import {
  parseRotation,
  type Rotation,
  useEngine,
  validateRotation,
  type ValidationResult,
} from "@/lib/engine";

import { DemoBox, JsonOutput, Section, Subsection } from "../../shared";

const EXAMPLE_ROTATION = `{
  "actions": [
    { "type": "cast", "spell": "kill_command", "condition": { "type": "cdReady", "spell": "kill_command" } },
    { "type": "cast", "spell": "barbed_shot", "condition": { "type": "buffRemaining", "aura": "frenzy" } },
    { "type": "cast", "spell": "cobra_shot" }
  ],
  "lists": {
    "cooldowns": [
      { "type": "cast", "spell": "bestial_wrath" }
    ]
  },
  "variables": {}
}`;

const INVALID_ROTATION = `{
  "actions": [],
  "variables": {
    "undefined_var": { "type": "userVar", "name": "nonexistent" }
  }
}`;

export function ValidationSection() {
  const { isReady } = useEngine();
  const [input, setInput] = useState(EXAMPLE_ROTATION);
  const [parseResult, setParseResult] = useState<Rotation | null>(null);
  const [parseError, setParseError] = useState<Error | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleParse = async () => {
    setIsLoading(true);
    setParseResult(null);
    setParseError(null);
    setValidationResult(null);
    setValidationError(null);

    try {
      const result = await parseRotation(input);
      setParseResult(result);
    } catch (e) {
      setParseError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    setIsLoading(true);
    setValidationResult(null);
    setValidationError(null);

    try {
      const result = await validateRotation(input);
      setValidationResult(result);
    } catch (e) {
      setValidationError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (json: string) => {
    setInput(json);
    setParseResult(null);
    setParseError(null);
    setValidationResult(null);
    setValidationError(null);
  };

  return (
    <Section id="validation" title="Rotation Validation">
      <Subsection title="Input">
        <DemoBox>
          <Text color="fg.muted" textStyle="sm" mb="3">
            Enter rotation JSON to parse and validate:
          </Text>
          <Stack direction="row" gap="2" mb="3">
            <Badge
              as="button"
              cursor="pointer"
              onClick={() => loadExample(EXAMPLE_ROTATION)}
              _hover={{ opacity: 0.8 }}
            >
              Load Valid Example
            </Badge>
            <Badge
              as="button"
              cursor="pointer"
              colorPalette="red"
              onClick={() => loadExample(INVALID_ROTATION)}
              _hover={{ opacity: 0.8 }}
            >
              Load Invalid Example
            </Badge>
          </Stack>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            fontFamily="mono"
            fontSize="sm"
          />
          <Stack direction="row" gap="2" mt="3">
            <Button
              size="sm"
              variant="solid"
              onClick={handleParse}
              disabled={!isReady || isLoading}
              loading={isLoading}
            >
              Parse
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidate}
              disabled={!isReady || isLoading}
              loading={isLoading}
            >
              Validate
            </Button>
          </Stack>
        </DemoBox>
      </Subsection>

      <Subsection title="Parse Result">
        <DemoBox>
          {parseError ? (
            <Box
              p="3"
              bg="red.2"
              borderRadius="l2"
              borderWidth="1px"
              borderColor="red.6"
            >
              <Text color="red.11" fontWeight="medium" mb="1">
                Parse Error
              </Text>
              <Code>{parseError.message}</Code>
            </Box>
          ) : (
            <JsonOutput
              data={parseResult}
              error={null}
              isLoading={isLoading && !validationResult}
            />
          )}
        </DemoBox>
      </Subsection>

      <Subsection title="Validation Result">
        <DemoBox>
          {validationError ? (
            <Box
              p="3"
              bg="red.2"
              borderRadius="l2"
              borderWidth="1px"
              borderColor="red.6"
            >
              <Text color="red.11" fontWeight="medium" mb="1">
                Validation Error
              </Text>
              <Code>{validationError.message}</Code>
            </Box>
          ) : validationResult ? (
            <Stack gap="4">
              <Stack direction="row" gap="2" align="center">
                <Text fontWeight="medium">Status:</Text>
                <Badge
                  colorPalette={validationResult.valid ? "green" : "red"}
                  size="lg"
                >
                  {validationResult.valid ? "Valid" : "Invalid"}
                </Badge>
              </Stack>

              {validationResult.errors.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb="2">
                    Errors ({validationResult.errors.length}):
                  </Text>
                  <Stack gap="2">
                    {validationResult.errors.map((err: unknown, i: number) => (
                      <Box
                        key={i}
                        p="2"
                        bg="red.2"
                        borderRadius="l1"
                        borderWidth="1px"
                        borderColor="red.6"
                      >
                        <Code>{JSON.stringify(err)}</Code>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {validationResult.warnings.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb="2">
                    Warnings ({validationResult.warnings.length}):
                  </Text>
                  <Stack gap="2">
                    {validationResult.warnings.map(
                      (warn: unknown, i: number) => (
                        <Box
                          key={i}
                          p="2"
                          bg="amber.2"
                          borderRadius="l1"
                          borderWidth="1px"
                          borderColor="amber.6"
                        >
                          <Code>{JSON.stringify(warn)}</Code>
                        </Box>
                      ),
                    )}
                  </Stack>
                </Box>
              )}

              {validationResult.valid &&
                validationResult.errors.length === 0 &&
                validationResult.warnings.length === 0 && (
                  <Text color="fg.muted">
                    No errors or warnings. Rotation is valid.
                  </Text>
                )}
            </Stack>
          ) : (
            <Text color="fg.muted" fontStyle="italic">
              Click "Validate" to check the rotation
            </Text>
          )}
        </DemoBox>
      </Subsection>
    </Section>
  );
}

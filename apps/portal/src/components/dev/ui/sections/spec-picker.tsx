"use client";

import { useState } from "react";
import { Flex, Stack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { Badge, Card, Text } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";

import { Section, Subsection } from "../../shared";

export function SpecPickerSection() {
  const [selectedSpec, setSelectedSpec] = useState<number | null>(62);
  const { getClassColor, getSpecLabel } = useClassesAndSpecs();

  return (
    <Section id="spec-picker" title="Spec Picker" lazy>
      <Subsection title="Interactive spec selector">
        <Stack gap="6">
          <Card.Root>
            <Card.Header>
              <Card.Title>Compact Mode</Card.Title>
              <Card.Description>
                Button that opens a popover for spec selection
              </Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex gap="4" alignItems="center" flexWrap="wrap">
                <SpecPicker
                  compact
                  specId={selectedSpec}
                  onSelect={setSelectedSpec}
                />
                {selectedSpec && (
                  <Badge variant="outline">Selected: {selectedSpec}</Badge>
                )}
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title>Full Mode</Card.Title>
              <Card.Description>
                Card-based picker for prominent placement
              </Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex justify="center">
                <SpecPicker specId={selectedSpec} onSelect={setSelectedSpec} />
              </Flex>
            </Card.Body>
          </Card.Root>

          {selectedSpec && (
            <Card.Root>
              <Card.Header>
                <Card.Title fontFamily="mono">Selection Result</Card.Title>
              </Card.Header>
              <Card.Body>
                <Stack gap="2">
                  <Text fontFamily="mono" textStyle="sm">
                    specId: {selectedSpec}
                  </Text>
                  <Text fontFamily="mono" textStyle="sm">
                    getSpecLabel({selectedSpec}): &quot;
                    {getSpecLabel(selectedSpec)}&quot;
                  </Text>
                  <Flex gap="2" alignItems="center">
                    <Text fontFamily="mono" textStyle="sm">
                      getClassColor({selectedSpec}):
                    </Text>
                    <Badge
                      style={{
                        backgroundColor: `${getClassColor(selectedSpec) ?? ""}20`,
                        borderColor: getClassColor(selectedSpec) ?? undefined,
                      }}
                    >
                      {getClassColor(selectedSpec) ?? "null"}
                    </Badge>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>
          )}
        </Stack>
      </Subsection>
    </Section>
  );
}

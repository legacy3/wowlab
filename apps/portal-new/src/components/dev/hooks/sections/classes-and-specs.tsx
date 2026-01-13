"use client";

import { useState } from "react";
import { Box, Flex, Grid, HStack, Stack } from "styled-system/jsx";

import { GameIcon } from "@/components/game/game-icon";
import { Badge, Card, Skeleton, Text } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";

import { Section, Subsection } from "../../shared";

export function ClassesAndSpecsSection() {
  const {
    classes,
    getClassColor,
    getSpecIcon,
    getSpecIdsForClass,
    getSpecLabel,
    isLoading,
    specs,
  } = useClassesAndSpecs();

  const [selectedSpec, setSelectedSpec] = useState<number | null>(62);

  if (isLoading) {
    return (
      <Section id="classes-and-specs" title="useClassesAndSpecs">
        <Stack gap="4">
          <Skeleton h="4" w="60%" />
          <Skeleton h="32" w="100%" />
        </Stack>
      </Section>
    );
  }

  return (
    <Section id="classes-and-specs" title="useClassesAndSpecs">
      <Subsection title="Combined hook with helper functions">
        <Stack gap="6">
          <Card.Root>
            <Card.Header>
              <Card.Title fontFamily="mono">getClassColor(specId)</Card.Title>
              <Card.Description>
                Returns the class color for a given spec ID
              </Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex gap="2" flexWrap="wrap">
                {specs.slice(0, 12).map((spec) => (
                  <Badge
                    key={spec.id}
                    variant="surface"
                    cursor="pointer"
                    onClick={() => setSelectedSpec(spec.id)}
                    style={{
                      backgroundColor:
                        selectedSpec === spec.id
                          ? `${getClassColor(spec.id)}20`
                          : undefined,
                      borderColor:
                        selectedSpec === spec.id
                          ? getClassColor(spec.id)
                          : undefined,
                    }}
                  >
                    <Box
                      w="2"
                      h="2"
                      rounded="full"
                      style={{ backgroundColor: getClassColor(spec.id) }}
                    />
                    {spec.label}
                  </Badge>
                ))}
              </Flex>
              {selectedSpec && (
                <Text mt="4" fontFamily="mono" textStyle="sm">
                  getClassColor({selectedSpec}) = &quot;
                  {getClassColor(selectedSpec)}
                  &quot;
                </Text>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title fontFamily="mono">getSpecLabel(specId)</Card.Title>
              <Card.Description>
                Returns &quot;Class - Spec&quot; label for a given spec ID
              </Card.Description>
            </Card.Header>
            <Card.Body>
              {selectedSpec && (
                <Text fontFamily="mono" textStyle="sm">
                  getSpecLabel({selectedSpec}) = &quot;
                  {getSpecLabel(selectedSpec)}
                  &quot;
                </Text>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title fontFamily="mono">getSpecIcon(specId)</Card.Title>
              <Card.Description>
                Returns the icon name for a given spec ID
              </Card.Description>
            </Card.Header>
            <Card.Body>
              {selectedSpec && (
                <HStack gap="4">
                  <GameIcon iconName={getSpecIcon(selectedSpec)} size="lg" />
                  <Text fontFamily="mono" textStyle="sm">
                    getSpecIcon({selectedSpec}) = &quot;
                    {getSpecIcon(selectedSpec)}
                    &quot;
                  </Text>
                </HStack>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Card.Title fontFamily="mono">
                getSpecIdsForClass(classId)
              </Card.Title>
              <Card.Description>
                Returns array of spec IDs for a given class
              </Card.Description>
            </Card.Header>
            <Card.Body>
              <Grid columns={{ base: 1, lg: 3, md: 2 }} gap="4">
                {classes.map((cls) => (
                  <Box key={cls.id}>
                    <Flex gap="2" alignItems="center" mb="2">
                      <Box
                        w="3"
                        h="3"
                        rounded="full"
                        style={{ backgroundColor: cls.color }}
                      />
                      <Text fontWeight="medium">{cls.label}</Text>
                    </Flex>
                    <Flex gap="1" flexWrap="wrap">
                      {getSpecIdsForClass(cls.id).map((specId) => {
                        const spec = specs.find((s) => s.id === specId);
                        return (
                          <Badge key={specId} variant="outline" size="sm">
                            {spec?.label ?? specId}
                          </Badge>
                        );
                      })}
                    </Flex>
                  </Box>
                ))}
              </Grid>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Subsection>
    </Section>
  );
}

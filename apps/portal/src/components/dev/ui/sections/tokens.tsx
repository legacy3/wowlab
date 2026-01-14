"use client";

import { FlameIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Box, Grid, HStack, Stack, VStack } from "styled-system/jsx";

import {
  AbsoluteCenter,
  Badge,
  Button,
  Group,
  Heading,
  Icon,
  Link,
  Loader,
  Text,
} from "@/components/ui";

import { ComponentCard, Section, Subsection } from "../../shared";

export function TokensSection() {
  return (
    <Section id="tokens" title="Tokens">
      <Stack gap="8">
        <Subsection title="Typography">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="Heading">
              <VStack gap="2" alignItems="stretch">
                {(["3xl", "2xl", "xl", "lg", "md", "sm"] as const).map(
                  (size) => (
                    <HStack key={size} justify="space-between" py="0.5">
                      <Heading size={size}>Heading</Heading>
                      <Text color="fg.muted" textStyle="xs">
                        {size}
                      </Text>
                    </HStack>
                  ),
                )}
              </VStack>
            </ComponentCard>
            <ComponentCard title="Text">
              <VStack gap="2" alignItems="stretch">
                {(["lg", "md", "sm", "xs"] as const).map((size) => (
                  <HStack key={size} justify="space-between" py="0.5">
                    <Text textStyle={size}>Text {size}</Text>
                    <Text color="fg.muted" textStyle="xs">
                      {size}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </ComponentCard>
            <ComponentCard title="Colors">
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <HStack justify="space-between" py="1.5">
                  <Text color="fg.default">fg.default</Text>
                  <Text color="fg.muted" textStyle="xs">
                    default
                  </Text>
                </HStack>
                <HStack justify="space-between" py="1.5">
                  <Text color="fg.muted">fg.muted</Text>
                  <Text color="fg.muted" textStyle="xs">
                    muted
                  </Text>
                </HStack>
                <HStack justify="space-between" py="1.5">
                  <Text color="fg.subtle">fg.subtle</Text>
                  <Text color="fg.muted" textStyle="xs">
                    subtle
                  </Text>
                </HStack>
              </Stack>
            </ComponentCard>
            <ComponentCard title="Link">
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between" py="0.5">
                  <Link href="#">Default Link</Link>
                  <Text color="fg.muted" textStyle="xs">
                    default
                  </Text>
                </HStack>
                <HStack justify="space-between" py="0.5">
                  <Link href="#" colorPalette="amber">
                    Amber Link
                  </Link>
                  <Text color="fg.muted" textStyle="xs">
                    amber
                  </Text>
                </HStack>
                <HStack justify="space-between" py="0.5">
                  <Link href="#" colorPalette="red">
                    Red Link
                  </Link>
                  <Text color="fg.muted" textStyle="xs">
                    red
                  </Text>
                </HStack>
              </VStack>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Color Palettes">
          <Grid columns={{ base: 1, lg: 4, sm: 2 }} gap="4">
            {(["amber", "green", "red", "gray"] as const).map((color) => (
              <ComponentCard key={color} title={color}>
                <VStack gap="3" alignItems="stretch">
                  <Button colorPalette={color} size="sm">
                    Button
                  </Button>
                  <Button colorPalette={color} variant="outline" size="sm">
                    Outline
                  </Button>
                  <HStack justify="space-between">
                    <Badge colorPalette={color}>Badge</Badge>
                    <Box color={`${color}.solid.bg`}>
                      <Loader size="sm" />
                    </Box>
                  </HStack>
                </VStack>
              </ComponentCard>
            ))}
          </Grid>
        </Subsection>

        <Subsection title="Icon">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="sizes">
              <HStack gap="4" alignItems="end" justify="center" py="2">
                {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                  <VStack key={size} gap="1" alignItems="center">
                    <Icon size={size}>
                      <FlameIcon />
                    </Icon>
                    <Text textStyle="xs" color="fg.muted">
                      {size}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </ComponentCard>
            <ComponentCard title="colors">
              <HStack gap="4" justify="center" py="2">
                <Icon size="lg" color="amber.solid.bg">
                  <FlameIcon />
                </Icon>
                <Icon size="lg" color="green.solid.bg">
                  <UserIcon />
                </Icon>
                <Icon size="lg" color="red.solid.bg">
                  <SettingsIcon />
                </Icon>
              </HStack>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Group">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="default">
              <Group>
                <Button variant="outline">One</Button>
                <Button variant="outline">Two</Button>
                <Button variant="outline">Three</Button>
              </Group>
            </ComponentCard>
            <ComponentCard title="attached">
              <Group attached>
                <Button variant="outline">One</Button>
                <Button variant="outline">Two</Button>
                <Button variant="outline">Three</Button>
              </Group>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="AbsoluteCenter">
          <Grid columns={{ base: 1, md: 3 }} gap="4">
            <ComponentCard title="both axes">
              <Box position="relative" h="24" bg="gray.3" rounded="md">
                <AbsoluteCenter>
                  <Loader size="md" />
                </AbsoluteCenter>
              </Box>
            </ComponentCard>
            <ComponentCard title="horizontal">
              <Box position="relative" h="24" bg="gray.3" rounded="md">
                <AbsoluteCenter axis="horizontal">
                  <Badge>Centered X</Badge>
                </AbsoluteCenter>
              </Box>
            </ComponentCard>
            <ComponentCard title="vertical">
              <Box position="relative" h="24" bg="gray.3" rounded="md">
                <AbsoluteCenter axis="vertical">
                  <Badge>Centered Y</Badge>
                </AbsoluteCenter>
              </Box>
            </ComponentCard>
          </Grid>
        </Subsection>
      </Stack>
    </Section>
  );
}

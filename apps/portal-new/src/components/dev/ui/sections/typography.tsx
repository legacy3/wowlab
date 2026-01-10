import { HStack, Stack } from "styled-system/jsx";

import { Heading, Link, Text } from "@/components/ui";

import { Section, Subsection } from "../shared";

export function TypographySection() {
  return (
    <Section id="typography" title="Typography">
      <Subsection title="Headings">
        <Stack gap="4">
          {(["3xl", "2xl", "xl", "lg", "md", "sm"] as const).map((size) => (
            <Heading key={size} size={size}>
              Heading {size}
            </Heading>
          ))}
        </Stack>
      </Subsection>

      <Subsection title="Text">
        <Stack gap="3">
          {(["lg", "md", "sm", "xs"] as const).map((size) => (
            <Text key={size} textStyle={size}>
              Text {size} - The quick brown fox jumps over the lazy dog.
            </Text>
          ))}
        </Stack>
      </Subsection>

      <Subsection title="Colors">
        <Stack gap="2">
          <Text color="fg.default">fg.default</Text>
          <Text color="fg.muted">fg.muted</Text>
          <Text color="fg.subtle">fg.subtle</Text>
        </Stack>
      </Subsection>

      <Subsection title="Links">
        <HStack gap="4">
          <Link href="#">Default</Link>
          <Link href="#" colorPalette="amber">
            Amber
          </Link>
          <Link href="#" colorPalette="red">
            Red
          </Link>
        </HStack>
      </Subsection>
    </Section>
  );
}

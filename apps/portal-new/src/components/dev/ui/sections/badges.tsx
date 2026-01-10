import { HStack } from "styled-system/jsx";

import { Badge } from "@/components/ui";

import { Section, Subsection } from "../shared";

export function BadgesSection() {
  return (
    <Section id="badges" title="Badges">
      <Subsection title="Variants">
        <HStack gap="3" flexWrap="wrap">
          <Badge variant="solid">Solid</Badge>
          <Badge variant="surface">Surface</Badge>
          <Badge variant="subtle">Subtle</Badge>
          <Badge variant="outline">Outline</Badge>
        </HStack>
      </Subsection>

      <Subsection title="Colors">
        <HStack gap="3" flexWrap="wrap">
          <Badge colorPalette="amber">Amber</Badge>
          <Badge colorPalette="green">Green</Badge>
          <Badge colorPalette="red">Red</Badge>
          <Badge colorPalette="gray">Gray</Badge>
        </HStack>
      </Subsection>

      <Subsection title="Sizes">
        <HStack gap="3" flexWrap="wrap" alignItems="center">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </HStack>
      </Subsection>
    </Section>
  );
}

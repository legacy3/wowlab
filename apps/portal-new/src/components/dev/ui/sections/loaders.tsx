import { Grid, HStack, VStack } from "styled-system/jsx";

import { CardLoader, InlineLoader, Loader, Text } from "@/components/ui";

import { ComponentCard, Section, Subsection } from "../shared";

export function LoadersSection() {
  return (
    <Section id="loaders" title="Loaders">
      <Subsection title="Sizes">
        <HStack gap="8" flexWrap="wrap" alignItems="end">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <VStack key={size} gap="2">
              <Loader size={size} />
              <Text textStyle="xs" color="fg.muted">
                {size}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Subsection>

      <Subsection title="Variants">
        <HStack gap="8" flexWrap="wrap" alignItems="end">
          {(["loading", "processing", "idle"] as const).map((variant) => (
            <VStack key={variant} gap="2">
              <Loader size="lg" variant={variant} />
              <Text textStyle="xs" color="fg.muted">
                {variant}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Subsection>

      <Subsection title="With Color">
        <HStack gap="8" flexWrap="wrap" alignItems="end">
          {(["amber", "green", "red", "gray"] as const).map((color) => (
            <VStack key={color} gap="2" color={`${color}.solid.bg`}>
              <Loader size="lg" />
              <Text textStyle="xs" color="fg.muted">
                {color}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Subsection>

      <Subsection title="Wrappers">
        <Grid columns={{ base: 1, md: 2 }} gap="6">
          <ComponentCard title="CardLoader">
            <CardLoader message="Loading data..." />
          </ComponentCard>
          <ComponentCard title="InlineLoader">
            <HStack gap="4" justifyContent="center" py="8">
              <InlineLoader />
              <Text textStyle="sm" color="fg.muted">
                For buttons
              </Text>
            </HStack>
          </ComponentCard>
        </Grid>
      </Subsection>
    </Section>
  );
}

import { ChevronDownIcon } from "lucide-react";
import { Box } from "styled-system/jsx";

import { Button, Collapsible, Text } from "@/components/ui";

import { Section } from "../shared";

export function CollapsibleSection() {
  return (
    <Section id="collapsible" title="Collapsible">
      <Box maxW="lg">
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <Button variant="outline" w="full" justifyContent="space-between">
              Click to expand
              <ChevronDownIcon />
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box
              p="4"
              mt="2"
              borderWidth="1px"
              borderColor="border"
              borderRadius="l2"
            >
              <Text color="fg.muted">Hidden content revealed on click.</Text>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </Section>
  );
}

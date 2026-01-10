import { ChevronDownIcon } from "lucide-react";
import { Box } from "styled-system/jsx";

import { Accordion, Text } from "@/components/ui";

import { Section } from "../shared";

export function AccordionSection() {
  return (
    <Section id="accordion" title="Accordion">
      <Box maxW="lg">
        <Accordion.Root defaultValue={["item-1"]} multiple>
          <Accordion.Item value="item-1">
            <Accordion.ItemTrigger>
              What is this component library?
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Text color="fg.muted">
                Built with Park UI (Ark UI + Panda CSS).
              </Text>
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.ItemTrigger>
              How do I use these components?
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Text color="fg.muted">Import from @/components/ui.</Text>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
    </Section>
  );
}

import { ArrowRight } from "lucide-react";
import { Box, Flex, VStack } from "styled-system/jsx";

import type { NavItem } from "@/lib/content/types";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";

type NextStepsProps = {
  items: NonNullable<NavItem>[];
};

export function NextSteps({ items }: NextStepsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box mt="10" pt="6" borderTopWidth="1px" borderColor="border.default">
      <Text fontWeight="semibold" mb="3">
        Next steps
      </Text>
      <VStack gap="2" alignItems="stretch">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            variant="plain"
            color="fg.muted"
            _hover={{ color: "fg.default" }}
          >
            <Flex alignItems="center" gap="2">
              <Icon size="sm" color="fg.subtle">
                <ArrowRight />
              </Icon>
              <Text as="span">{item.title}</Text>
            </Flex>
          </Link>
        ))}
      </VStack>
    </Box>
  );
}

import NextLink from "next/link";
import { VStack } from "styled-system/jsx";

import { Heading } from "@/components/ui/heading";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { getFirstSlug } from "@/lib/docs";

export default function DocsIndexPage() {
  return (
    <VStack alignItems="flex-start" gap="6">
      <Heading as="h1" size="4xl">
        Documentation
      </Heading>
      <Text color="fg.muted" textStyle="lg">
        Learn how to use WoW Lab for theorycrafting and simulation.
      </Text>
      <Link asChild>
        <NextLink href={`/docs/${getFirstSlug()}`}>
          Get started with the overview →
        </NextLink>
      </Link>
    </VStack>
  );
}

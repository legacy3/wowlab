"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { Box, HStack, Stack } from "styled-system/jsx";

import { Badge, HoverCard, Link, Text } from "@/components/ui";
import { type Term, terms } from "@/content/terms";

type MdTermProps = {
  id: string;
  children?: React.ReactNode;
};

export function MdGlossary() {
  const allTerms = Object.values(terms).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (allTerms.length === 0) {
    return null;
  }

  const grouped = groupByLetter(allTerms);
  const letters = Object.keys(grouped).sort();

  return (
    <Stack gap="5">
      {letters.map((letter) => (
        <Box key={letter} id={`letter-${letter}`}>
          <Text
            textStyle="xs"
            fontWeight="bold"
            color="fg.subtle"
            mb="1"
            ml="1"
          >
            {letter}
          </Text>
          <Stack
            gap="0"
            borderLeftWidth="2px"
            borderColor="border.muted"
            ml="1"
          >
            {grouped[letter].map((term, idx) => (
              <HStack
                key={term.id}
                id={`term-${term.id}`}
                gap="2"
                py="1.5"
                px="3"
                bg={idx % 2 === 0 ? "transparent" : "bg.subtle"}
                _hover={{ bg: "bg.muted" }}
                alignItems="baseline"
              >
                <Text
                  fontWeight="semibold"
                  textStyle="sm"
                  minW="28"
                  flexShrink={0}
                  title={term.long}
                  cursor={term.long ? "help" : undefined}
                >
                  {term.name}
                </Text>
                <Text textStyle="sm" flex="1">
                  {term.description}
                </Text>
                {term.link && (
                  <Link href={term.link} colorPalette="amber" flexShrink={0}>
                    <ExternalLinkIcon size={12} />
                  </Link>
                )}
              </HStack>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function MdTerm({ children, id }: MdTermProps) {
  const [open, setOpen] = useState(false);
  const term = terms[id];

  if (!term) {
    return (
      <Text as="span" textStyle="xs" color="red.11">
        {children ?? id} (?)
      </Text>
    );
  }

  const displayText = children ?? term.name;

  return (
    <HoverCard.Root
      openDelay={200}
      closeDelay={100}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <HoverCard.Trigger asChild>
        <Link
          href={`/dev/docs/glossary#term-${id}`}
          fontWeight="medium"
          borderBottomWidth="1"
          borderStyle="dashed"
          borderColor="fg.subtle"
        >
          {displayText}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content w="72" py="2" px="3">
          <HoverCard.Arrow>
            <HoverCard.ArrowTip />
          </HoverCard.Arrow>
          <Stack gap="2">
            <HStack gap="2" justify="space-between" alignItems="start">
              <Stack gap="0">
                <Text textStyle="sm" fontWeight="semibold">
                  {term.name}
                </Text>
                {term.long && (
                  <Text textStyle="xs" color="fg.muted">
                    {term.long}
                  </Text>
                )}
              </Stack>
              {term.link && (
                <Link
                  href={term.link}
                  textStyle="xs"
                  colorPalette="amber"
                  onClick={() => setOpen(false)}
                >
                  <HStack gap="1">
                    <Text as="span">Docs</Text>
                    <ExternalLinkIcon size={12} />
                  </HStack>
                </Link>
              )}
            </HStack>
            <Text textStyle="sm" color="fg.muted">
              {term.description}
            </Text>
          </Stack>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
}

function groupByLetter(list: Term[]): Record<string, Term[]> {
  return list.reduce<Record<string, Term[]>>((acc, t) => {
    const letter = t.name[0].toUpperCase();
    (acc[letter] ??= []).push(t);

    return acc;
  }, {});
}

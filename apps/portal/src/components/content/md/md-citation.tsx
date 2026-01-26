"use client";

import { ExternalLinkIcon } from "lucide-react";
import { HStack, Stack } from "styled-system/jsx";

import { Badge, Heading, HoverCard, Link, Text } from "@/components/ui";
import * as Table from "@/components/ui/table";
import { references } from "@/content/references";

type MdCiteProps = {
  id: string;
  children?: React.ReactNode;
};

export function MdBibliography() {
  const allRefs = Object.entries(references);

  if (allRefs.length === 0) {
    return null;
  }

  return (
    <Stack gap="3">
      <Table.Root size="sm" w="full" tableLayout="fixed">
        <Table.Body>
          {allRefs.map(([id, ref], idx) => (
            <Table.Row key={id} id={`ref-${id}`}>
              <Table.Cell w="10" verticalAlign="top" pr="0">
                <Badge variant="surface" colorPalette="amber" size="sm">
                  {idx + 1}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text fontWeight="medium">{ref.title}</Text>
                <Text textStyle="xs" color="fg.muted">
                  {ref.authors} ({ref.year}).{" "}
                  <Text as="span" fontStyle="italic">
                    {ref.source}
                  </Text>
                </Text>
              </Table.Cell>
              <Table.Cell w="8" verticalAlign="top" pl="0">
                {(ref.doi || ref.url) && (
                  <Link
                    href={ref.doi ? `https://doi.org/${ref.doi}` : ref.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon size={14} />
                  </Link>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Stack>
  );
}

export function MdCite({ children, id }: MdCiteProps) {
  const ref = references[id];
  const allIds = Object.keys(references);
  const num = allIds.indexOf(id) + 1;

  if (!ref) {
    return (
      <Text as="span" textStyle="xs" color="red.11">
        {children} (?)
      </Text>
    );
  }

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <Link
          href={`/dev/docs/references#ref-${id}`}
          colorPalette="amber"
          whiteSpace="nowrap"
        >
          {children} ({num})
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content w="72" py="2" px="3">
          <HoverCard.Arrow>
            <HoverCard.ArrowTip />
          </HoverCard.Arrow>
          <Stack gap="1">
            <Text textStyle="sm" fontWeight="semibold">
              {ref.title}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {ref.authors} ({ref.year})
            </Text>
            <HStack gap="2" justify="space-between">
              <Text textStyle="xs" color="fg.subtle" fontStyle="italic">
                {ref.source}
              </Text>
              {(ref.doi || ref.url) && (
                <Link
                  href={ref.doi ? `https://doi.org/${ref.doi}` : ref.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  textStyle="xs"
                  colorPalette="amber"
                >
                  <HStack gap="1">
                    <Text as="span">{ref.doi ? "DOI" : "Link"}</Text>
                    <ExternalLinkIcon size={12} />
                  </HStack>
                </Link>
              )}
            </HStack>
          </Stack>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
}

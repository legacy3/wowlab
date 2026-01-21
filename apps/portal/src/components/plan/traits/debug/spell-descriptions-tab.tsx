"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "styled-system/css";
import { HStack, Stack } from "styled-system/jsx";

import { FragmentRenderer } from "@/components/game";
import { Accordion, Badge, Card, Input, Text } from "@/components/ui";
import {
  fragmentsToPlainText,
  type SpellDescFragment,
  tokenizeSpellDescription,
} from "@/lib/engine";
import { defaultPaperdoll, useSpellDescription } from "@/lib/state";

import type { DebugTabProps } from "./types";

interface TraitSpell {
  description: string;
  maxRanks: number;
  name: string;
  nodeId: number;
  nodeType: "single" | "tiered" | "choice";
  spellId: number;
  subTreeName?: string;
}

const scrollContainerStyles = css({
  h: "500px",
  overflow: "auto",
});

export function SpellDescriptionsTab({ nodes, subTrees }: DebugTabProps) {
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const subTreeMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const st of subTrees) {
      map.set(st.id, st.name);
    }
    return map;
  }, [subTrees]);

  const allSpells = useMemo((): TraitSpell[] => {
    const spells: TraitSpell[] = [];

    for (const node of nodes) {
      const nodeType =
        node.type === 0 ? "single" : node.type === 1 ? "tiered" : "choice";
      const subTreeName = subTreeMap.get(node.subTreeId);

      for (const entry of node.entries) {
        if (!entry.description) {
          continue;
        }

        spells.push({
          description: entry.description,
          maxRanks: node.maxRanks,
          name: entry.name,
          nodeId: node.id,
          nodeType,
          spellId: entry.spellId,
          subTreeName,
        });
      }
    }

    return spells.sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, subTreeMap]);

  const filteredSpells = useMemo(() => {
    if (!search.trim()) {
      return allSpells;
    }

    const searchLower = search.toLowerCase();
    return allSpells.filter(
      (spell) =>
        spell.name.toLowerCase().includes(searchLower) ||
        spell.spellId.toString().includes(search) ||
        spell.subTreeName?.toLowerCase().includes(searchLower),
    );
  }, [allSpells, search]);

  const virtualizer = useVirtualizer({
    count: filteredSpells.length,
    estimateSize: () => 48,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  return (
    <Stack gap={4} w="full">
      <HStack gap={4} justify="space-between">
        <Input
          placeholder="Search by name or spell ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
          maxW="xs"
        />
        <Text textStyle="xs" color="fg.muted">
          {filteredSpells.length} of {allSpells.length} spells
        </Text>
      </HStack>

      <div ref={parentRef} className={scrollContainerStyles}>
        <Accordion.Root multiple>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const spell = filteredSpells[virtualRow.index];

              return (
                <div
                  key={`${spell.nodeId}-${spell.spellId}`}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    left: 0,
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                  }}
                >
                  <SpellCard spell={spell} />
                </div>
              );
            })}
          </div>
        </Accordion.Root>
      </div>

      {filteredSpells.length === 0 && (
        <Text textStyle="sm" color="fg.muted" textAlign="center" py={8}>
          No spells found matching &ldquo;{search}&rdquo;
        </Text>
      )}
    </Stack>
  );
}

function SpellCard({ spell }: { spell: TraitSpell }) {
  const { isLoading, result } = useSpellDescription(
    spell.spellId,
    spell.description,
    defaultPaperdoll,
  );

  const [rawFragments, setRawFragments] = useState<SpellDescFragment[] | null>(
    null,
  );

  useEffect(() => {
    tokenizeSpellDescription(spell.description).then(setRawFragments);
  }, [spell.description]);

  const rendered = result ? fragmentsToPlainText(result.fragments) : null;

  return (
    <Accordion.Item value={`${spell.nodeId}-${spell.spellId}`}>
      <Accordion.ItemTrigger>
        <HStack gap={2} flex={1}>
          <Text fontWeight="medium">{spell.name}</Text>
          <Text textStyle="xs" color="fg.muted" fontFamily="mono">
            {spell.spellId}
          </Text>
          {spell.nodeType === "choice" && (
            <Badge size="sm" variant="outline">
              Choice
            </Badge>
          )}
          {spell.maxRanks > 1 && (
            <Badge size="sm" variant="subtle">
              {spell.maxRanks}R
            </Badge>
          )}
        </HStack>
        <Accordion.ItemIndicator>
          <ChevronDownIcon />
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody>
          <Stack gap={3}>
            {spell.subTreeName && (
              <Text textStyle="xs" color="fg.muted">
                Hero Tree: {spell.subTreeName}
              </Text>
            )}
            <Stack gap={1}>
              <Text textStyle="xs" color="fg.muted" fontWeight="medium">
                Raw
              </Text>
              <Card.Root>
                <Card.Body py={2} px={3}>
                  <Text textStyle="xs" fontFamily="mono" color="fg.muted">
                    {rawFragments ? (
                      <FragmentRenderer fragments={rawFragments} />
                    ) : (
                      spell.description
                    )}
                  </Text>
                </Card.Body>
              </Card.Root>
            </Stack>
            <Stack gap={1}>
              <Text textStyle="xs" color="fg.muted" fontWeight="medium">
                Parsed
              </Text>
              <Card.Root>
                <Card.Body py={2} px={3}>
                  {isLoading ? (
                    <Text textStyle="sm" color="fg.subtle">
                      Parsing...
                    </Text>
                  ) : rendered ? (
                    <Text textStyle="sm">{rendered}</Text>
                  ) : (
                    <Text textStyle="sm" color="fg.subtle">
                      No result
                    </Text>
                  )}
                </Card.Body>
              </Card.Root>
            </Stack>
          </Stack>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

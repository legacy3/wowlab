"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HStack, Stack } from "styled-system/jsx";

import { Button, Text, Textarea } from "@/components/ui";
import { defaultPaperdoll, useSpellDescription } from "@/lib/state";
import { fragmentsToPlainText } from "@/lib/wasm";

import type { DebugTabProps } from "./types";

interface TraitSpell {
  description: string;
  maxRanks: number;
  name: string;
  nodeType: "single" | "tiered" | "choice";
  spellId: number;
  subTreeName?: string;
}

export function ExportTab({ nodes, subTrees }: DebugTabProps) {
  const [renderedMap, setRenderedMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [copied, setCopied] = useState(false);

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
          nodeType,
          spellId: entry.spellId,
          subTreeName,
        });
      }
    }

    return spells.sort((a, b) => {
      if (a.subTreeName !== b.subTreeName) {
        if (!a.subTreeName) {
          return 1;
        }
        if (!b.subTreeName) {
          return -1;
        }
        return a.subTreeName.localeCompare(b.subTreeName);
      }
      return a.name.localeCompare(b.name);
    });
  }, [nodes, subTreeMap]);

  const uniqueSpells = useMemo(() => {
    const seen = new Set<number>();
    return allSpells.filter((s) => {
      if (seen.has(s.spellId)) {
        return false;
      }
      seen.add(s.spellId);
      return true;
    });
  }, [allSpells]);

  const handleRendered = useCallback((spellId: number, rendered: string) => {
    setRenderedMap((prev) => new Map(prev).set(spellId, rendered));
  }, []);

  const output = useMemo(() => {
    const lines: string[] = [];
    let currentSubTree = "";

    for (const spell of allSpells) {
      if (spell.subTreeName && spell.subTreeName !== currentSubTree) {
        if (lines.length > 0) {
          lines.push("");
        }
        lines.push(`=== ${spell.subTreeName} ===`);
        lines.push("");
        currentSubTree = spell.subTreeName;
      } else if (!spell.subTreeName && currentSubTree !== "Class/Spec") {
        if (lines.length > 0) {
          lines.push("");
        }
        lines.push("=== Class/Spec ===");
        lines.push("");
        currentSubTree = "Class/Spec";
      }

      const rendered = renderedMap.get(spell.spellId) ?? "...";
      const rankInfo = spell.maxRanks > 1 ? ` [${spell.maxRanks} ranks]` : "";
      const typeInfo = spell.nodeType === "choice" ? " (Choice)" : "";

      lines.push(`${spell.name} (${spell.spellId})${rankInfo}${typeInfo}`);
      lines.push(`Raw: ${spell.description}`);
      lines.push(`Parsed: ${rendered}`);
      lines.push("");
    }

    return lines.join("\n").trim();
  }, [allSpells, renderedMap]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const renderedCount = Array.from(renderedMap.values()).filter(Boolean).length;

  return (
    <Stack gap={3} w="full">
      {uniqueSpells.map((spell) => (
        <DescriptionRenderer
          key={spell.spellId}
          spell={spell}
          onRendered={handleRendered}
        />
      ))}

      <HStack justify="space-between">
        <Text textStyle="xs" color="fg.muted">
          {renderedCount}/{allSpells.length} parsed
        </Text>
        <Button variant="outline" size="xs" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied ? "Copied!" : "Copy All"}
        </Button>
      </HStack>

      <Textarea
        value={output}
        readOnly
        fontFamily="mono"
        fontSize="xs"
        rows={30}
        w="full"
        resize="vertical"
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
      />
    </Stack>
  );
}

function DescriptionRenderer({
  onRendered,
  spell,
}: {
  spell: TraitSpell;
  onRendered: (spellId: number, rendered: string) => void;
}) {
  const { result } = useSpellDescription(
    spell.spellId,
    spell.description,
    defaultPaperdoll,
  );

  useEffect(() => {
    if (result) {
      const plainText = fragmentsToPlainText(result.fragments);
      onRendered(spell.spellId, plainText);
    }
  }, [result, spell.spellId, onRendered]);

  return null;
}

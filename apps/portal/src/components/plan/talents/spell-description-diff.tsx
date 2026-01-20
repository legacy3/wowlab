"use client";

// TODO Redo this entire thing

import { Check, ClipboardCopy, Code2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";

import { Button, IconButton } from "@/components/ui";
import * as Dialog from "@/components/ui/dialog";
import { fragmentsToPlainText } from "@/lib/engine";
import { defaultPaperdoll, useSpellDescription } from "@/lib/state";

import type { TalentNode, TalentSubTree } from "./talent-tree";

// =============================================================================
// Styles
// =============================================================================

const textareaStyles = css({
  _focus: {
    borderColor: "accent.500",
    outline: "none",
  },
  bg: "gray.900",
  border: "1px solid",
  borderColor: "gray.700",
  borderRadius: "md",
  color: "gray.100",
  fontFamily: "mono",
  fontSize: "xs",
  h: "full",
  minH: "400px",
  p: "3",
  resize: "none",
  w: "full",
});

const sectionHeaderStyles = css({
  borderBottom: "1px solid",
  borderColor: "gray.700",
  color: "gray.400",
  fontSize: "xs",
  fontWeight: "semibold",
  pb: "1",
  textTransform: "uppercase",
});

// =============================================================================
// Types
// =============================================================================

interface SerializedTalent {
  description: string;
  maxRanks: number;
  name: string;
  nodeId: number;
  nodeType: "single" | "tiered" | "choice";
  rendered?: string;
  spellId: number;
  subTreeName?: string;
}

interface SpellDescriptionViewerProps {
  nodes: TalentNode[];
  subTrees?: TalentSubTree[];
}

// =============================================================================
// Main Component - Viewer Button + Modal
// =============================================================================

export function SpellDescriptionViewer({
  nodes,
  subTrees = [],
}: SpellDescriptionViewerProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          <Code2 size={16} />
          View Spell Descriptions
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="4xl" w="90vw">
          <Dialog.Header>
            <HStack justify="space-between" w="full">
              <Dialog.Title>Talent Tree Spell Descriptions</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="plain" size="sm">
                  <X size={16} />
                </IconButton>
              </Dialog.CloseTrigger>
            </HStack>
            <Dialog.Description>
              Raw and parsed spell descriptions for all talents in the tree
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <SpellDescriptionViewerContent nodes={nodes} subTrees={subTrees} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// =============================================================================
// Description Renderer (invisible)
// =============================================================================

function DescriptionRenderer({
  description,
  onRendered,
  spellId,
}: {
  description: string;
  onRendered: (spellId: number, rendered: string) => void;
  spellId: number;
}) {
  const { result } = useSpellDescription(
    spellId,
    description,
    defaultPaperdoll,
  );

  useEffect(() => {
    if (result) {
      const plainText = fragmentsToPlainText(result.fragments);
      onRendered(spellId, plainText);
    }
  }, [result, spellId, onRendered]);

  return null;
}

// =============================================================================
// Content Component
// =============================================================================

function SpellDescriptionViewerContent({
  nodes,
  subTrees,
}: SpellDescriptionViewerProps) {
  const [renderedMap, setRenderedMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [copied, setCopied] = useState(false);

  // Build subtree lookup
  const subTreeMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const st of subTrees ?? []) {
      map.set(st.id, st.name);
    }
    return map;
  }, [subTrees]);

  // Serialize all talents with metadata
  const serializedTalents = useMemo((): SerializedTalent[] => {
    const talents: SerializedTalent[] = [];

    for (const node of nodes) {
      const nodeType =
        node.type === 0 ? "single" : node.type === 1 ? "tiered" : "choice";
      const subTreeName = subTreeMap.get(node.subTreeId);

      for (const entry of node.entries) {
        if (!entry.description) continue;

        talents.push({
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

    // Sort by subtree, then alphabetically
    return talents.sort((a, b) => {
      if (a.subTreeName !== b.subTreeName) {
        if (!a.subTreeName) return 1;
        if (!b.subTreeName) return -1;
        return a.subTreeName.localeCompare(b.subTreeName);
      }
      return a.name.localeCompare(b.name);
    });
  }, [nodes, subTreeMap]);

  // Unique spells for rendering
  const uniqueSpells = useMemo(() => {
    const seen = new Set<number>();
    return serializedTalents.filter((t) => {
      if (seen.has(t.spellId)) return false;
      seen.add(t.spellId);
      return true;
    });
  }, [serializedTalents]);

  const handleRendered = useCallback((spellId: number, rendered: string) => {
    setRenderedMap((prev) => new Map(prev).set(spellId, rendered));
  }, []);

  // Generate output text
  const output = useMemo(() => {
    const lines: string[] = [];
    let currentSubTree = "";

    for (const talent of serializedTalents) {
      // Add subtree header
      if (talent.subTreeName && talent.subTreeName !== currentSubTree) {
        if (lines.length > 0) lines.push("");
        lines.push(`=== ${talent.subTreeName} ===`);
        lines.push("");
        currentSubTree = talent.subTreeName;
      } else if (!talent.subTreeName && currentSubTree !== "Class/Spec") {
        if (lines.length > 0) lines.push("");
        lines.push("=== Class/Spec ===");
        lines.push("");
        currentSubTree = "Class/Spec";
      }

      const rendered = renderedMap.get(talent.spellId) ?? "...";
      const rankInfo =
        talent.maxRanks > 1 ? ` [Max ${talent.maxRanks} ranks]` : "";
      const typeInfo =
        talent.nodeType === "choice"
          ? " (Choice)"
          : talent.nodeType === "tiered"
            ? " (Tiered)"
            : "";

      lines.push(`${talent.name} (${talent.spellId})${rankInfo}${typeInfo}`);
      lines.push(talent.description);
      lines.push(`→ ${rendered}`);
      lines.push("");
    }

    return lines.join("\n").trim();
  }, [serializedTalents, renderedMap]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Stats
  const stats = useMemo(() => {
    const total = serializedTalents.length;
    const rendered = Array.from(renderedMap.values()).filter(
      (v) => v && v !== "...",
    ).length;
    return { rendered, total };
  }, [serializedTalents, renderedMap]);

  return (
    <VStack alignItems="stretch" gap="3" h="full">
      {/* Hidden renderers */}
      {uniqueSpells.map((talent) => (
        <DescriptionRenderer
          key={talent.spellId}
          description={talent.description}
          spellId={talent.spellId}
          onRendered={handleRendered}
        />
      ))}

      {/* Header */}
      <HStack justify="space-between">
        <Box className={sectionHeaderStyles}>
          {stats.rendered}/{stats.total} descriptions parsed
        </Box>
        <Button
          variant="outline"
          size="xs"
          onClick={handleCopy}
          disabled={stats.rendered < stats.total}
        >
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied ? "Copied!" : "Copy All"}
        </Button>
      </HStack>

      {/* Output */}
      <textarea
        className={textareaStyles}
        readOnly
        value={output}
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
      />
    </VStack>
  );
}

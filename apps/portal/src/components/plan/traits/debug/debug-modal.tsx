"use client";

import { Portal } from "@ark-ui/react/portal";
import { Bug, XIcon } from "lucide-react";
import { useState } from "react";

import type { TraitNode, TraitSubTree } from "@/lib/trait";

import { Dialog, IconButton, Tabs, Tooltip } from "@/components/ui";

import { ExportTab } from "./export-tab";
import { SpellDescriptionsTab } from "./spell-descriptions-tab";
import { TreeDataTab } from "./tree-data-tab";

interface DebugModalProps {
  nodes: TraitNode[];
  subTrees: TraitSubTree[];
}

export function DebugModal({ nodes, subTrees }: DebugModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Tooltip content="Debug Tools">
        <Dialog.Trigger asChild>
          <IconButton variant="outline" size="sm">
            <Bug size={16} />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="4xl" w="90vw" maxH="80vh" overflow="auto">
            <Dialog.Header>
              <Dialog.Title>Debug Tools</Dialog.Title>
              <Dialog.Description>
                Inspect trait tree data and spell descriptions
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <Tabs.Root defaultValue="spells" variant="line" w="full">
                <Tabs.List>
                  <Tabs.Trigger value="spells">Browse</Tabs.Trigger>
                  <Tabs.Trigger value="export">Export</Tabs.Trigger>
                  <Tabs.Trigger value="tree">Tree Data</Tabs.Trigger>
                  <Tabs.Indicator />
                </Tabs.List>
                <Tabs.Content value="spells" pt={4}>
                  <SpellDescriptionsTab nodes={nodes} subTrees={subTrees} />
                </Tabs.Content>
                <Tabs.Content value="export" pt={4}>
                  <ExportTab nodes={nodes} subTrees={subTrees} />
                </Tabs.Content>
                <Tabs.Content value="tree" pt={4}>
                  <TreeDataTab nodes={nodes} subTrees={subTrees} />
                </Tabs.Content>
              </Tabs.Root>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild pos="absolute" top="3" right="3">
              <IconButton variant="plain" size="sm" aria-label="Close">
                <XIcon />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

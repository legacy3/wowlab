"use client";

import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Box, Flex, VStack } from "styled-system/jsx";

import { useEditor } from "@/lib/state/editor";

import type { ActionType } from "../types";

import { Button, Dialog, IconButton, Tabs, Text } from "../../ui";
import { SelectField } from "../common";
import { ACTION_TYPES } from "../constants";
import { ItemPicker, SpellPicker } from "../pickers";

interface ActionPickerProps {
  listId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ActionPicker({
  listId,
  onOpenChange,
  open,
}: ActionPickerProps) {
  const addAction = useEditor((s) => s.addAction);
  const actionLists = useEditor((s) => s.actionLists);
  const [activeTab, setActiveTab] = useState<ActionType>("spell");

  const availableLists = actionLists.filter((l) => l.id !== listId);

  const listOptions = useMemo(
    () => availableLists.map((l) => ({ label: l.label, value: l.id })),
    [availableLists],
  );

  const handleAddSpell = (spellId: number) => {
    addAction(listId, { spellId, type: "spell" });
    onOpenChange(false);
  };

  const handleAddItem = (itemId: number) => {
    addAction(listId, { itemId, type: "item" });
    onOpenChange(false);
  };

  const handleAddCallList = (targetListId: string) => {
    addAction(listId, { listId: targetListId, type: "call_action_list" });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content minW="md">
          <Dialog.Header>
            <Dialog.Title>Add Action</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <IconButton variant="plain" size="sm">
                <XIcon size={16} />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body>
            <Tabs.Root
              value={activeTab}
              onValueChange={(e) => setActiveTab(e.value as ActionType)}
            >
              <Tabs.List>
                {ACTION_TYPES.map((type) => (
                  <Tabs.Trigger key={type.value} value={type.value}>
                    <Flex align="center" gap="2">
                      <type.icon size={16} />
                      {type.label}
                    </Flex>
                  </Tabs.Trigger>
                ))}
                <Tabs.Indicator />
              </Tabs.List>

              <Box pt="4">
                <Tabs.Content value="spell">
                  <VStack gap="3" alignItems="stretch">
                    <Text textStyle="sm" color="fg.muted">
                      Search for a spell to add to the rotation
                    </Text>
                    <SpellPicker onSelect={handleAddSpell} />
                  </VStack>
                </Tabs.Content>

                <Tabs.Content value="item">
                  <VStack gap="3" alignItems="stretch">
                    <Text textStyle="sm" color="fg.muted">
                      Search for an item to use in the rotation
                    </Text>
                    <ItemPicker onSelect={handleAddItem} />
                  </VStack>
                </Tabs.Content>

                <Tabs.Content value="call_action_list">
                  <VStack gap="3" alignItems="stretch">
                    <Text textStyle="sm" color="fg.muted">
                      Select an action list to call
                    </Text>
                    {availableLists.length === 0 ? (
                      <Text textStyle="sm" color="fg.warning">
                        No other action lists available. Create a new list
                        first.
                      </Text>
                    ) : (
                      <SelectField
                        value={undefined}
                        options={listOptions}
                        onChange={handleAddCallList}
                        placeholder="Select a list..."
                      />
                    )}
                  </VStack>
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

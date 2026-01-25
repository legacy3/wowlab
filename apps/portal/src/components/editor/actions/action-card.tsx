"use client";

import type { RuleGroupType } from "react-querybuilder";

import { useBoolean } from "ahooks";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  ListIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { memo, useMemo, useState } from "react";
import { Box, Flex, HStack } from "styled-system/jsx";

import type { Action, ActionType } from "@/lib/engine";
import type { Item, Spell } from "@/lib/supabase";

import { ACTION_TYPES } from "@/lib/engine";
import { items, spells, useResource } from "@/lib/refine";
import { useEditor } from "@/lib/state";

import {
  GameIcon,
  type ItemQuality,
  ItemTooltip,
  type ItemTooltipData,
  SpellTooltip,
  type SpellTooltipData,
} from "../../game";
import { Badge, Card, Collapsible, IconButton, Text, Tooltip } from "../../ui";
import { SelectField } from "../common";
import { ConditionBuilder } from "../conditions";
import { ItemPicker, SpellPicker } from "../pickers";

function toItemTooltipData(item: Item): ItemTooltipData {
  const classification = item.classification as {
    inventoryTypeName?: string;
  } | null;
  return {
    effects:
      item.description && Array.isArray(item.effects) && item.effects.length > 0
        ? [{ isUse: true, text: item.description }]
        : item.description
          ? [{ text: item.description }]
          : undefined,
    iconName: item.file_name,
    itemLevel: item.item_level,
    name: item.name,
    quality: item.quality as ItemQuality,
    slot: classification?.inventoryTypeName,
  };
}

function toSpellTooltipData(spell: Spell): SpellTooltipData {
  return {
    castTime:
      spell.cast_time === 0 ? "Instant" : `${spell.cast_time / 1000} sec`,
    cooldown:
      spell.recovery_time > 0 ? `${spell.recovery_time / 1000} sec` : undefined,
    cost: spell.power_cost > 0 ? String(spell.power_cost) : undefined,
    description: spell.description,
    iconName: spell.file_name,
    id: spell.id,
    name: spell.name,
    range: spell.range_max_0 > 0 ? `${spell.range_max_0} yd range` : undefined,
  };
}

const ActionIcon = memo(function ActionIcon({
  action,
  size = "lg",
}: {
  action: Action;
  size?: "md" | "lg";
}) {
  const spellId = action.type === "spell" ? action.spellId : null;
  const itemId = action.type === "item" ? action.itemId : null;

  const { data: spell, isLoading: isSpellLoading } = useResource<Spell>({
    ...spells,
    id: spellId ?? "",
    queryOptions: { enabled: spellId != null },
  });
  const { data: item, isLoading: isItemLoading } = useResource<Item>({
    ...items,
    id: itemId ?? "",
    queryOptions: { enabled: itemId != null },
  });

  const dimension = size === "lg" ? "14" : "9";

  if (action.type === "call_action_list") {
    return (
      <Flex
        align="center"
        justify="center"
        w={dimension}
        h={dimension}
        rounded="md"
        borderWidth="1"
        bg="blue.500/10"
        color="blue.500"
      >
        <ListIcon size={size === "lg" ? 28 : 20} />
      </Flex>
    );
  }

  if (action.type === "item") {
    if (isItemLoading || !item) {
      return <GameIcon iconName={null} size={size} />;
    }
    return (
      <ItemTooltip item={toItemTooltipData(item)}>
        <Box rounded="md" overflow="hidden" borderWidth="1" cursor="default">
          <GameIcon iconName={item.file_name} size={size} />
        </Box>
      </ItemTooltip>
    );
  }

  if (isSpellLoading || !spell) {
    return <GameIcon iconName={null} size={size} />;
  }
  return (
    <SpellTooltip spell={toSpellTooltipData(spell)}>
      <Box rounded="md" overflow="hidden" borderWidth="1" cursor="default">
        <GameIcon iconName={spell.file_name} size={size} />
      </Box>
    </SpellTooltip>
  );
});

function useActionName(
  action: Action,
  content: { selectSpell: string; selectItem: string; callActionList: string },
): string {
  const spellId = action.type === "spell" ? action.spellId : null;
  const itemId = action.type === "item" ? action.itemId : null;

  const { data: spell } = useResource<Spell>({
    ...spells,
    id: spellId ?? "",
    queryOptions: { enabled: spellId != null },
  });
  const { data: item } = useResource<Item>({
    ...items,
    id: itemId ?? "",
    queryOptions: { enabled: itemId != null },
  });

  if (action.type === "spell") {
    return spell?.name ?? content.selectSpell;
  }

  if (action.type === "item") {
    return item?.name ?? content.selectItem;
  }

  return content.callActionList;
}

const ACTION_TYPE_OPTIONS = ACTION_TYPES.map((t) => ({
  label: t.label,
  value: t.value,
}));

interface ActionCardProps {
  action: Action;
  dragHandleProps?: {
    ref?: (node: HTMLElement | null) => void;
  } & Record<string, unknown>;
  index: number;
  listId: string;
}

function ListSelector({
  listId,
  onChange,
  value,
}: {
  value?: string;
  listId: string;
  onChange: (listId: string) => void;
}) {
  const { actionCard: content } = useIntlayer("editor");
  const actionLists = useEditor((s) => s.actionLists);
  const availableLists = actionLists.filter((l) => l.id !== listId);

  const options = useMemo(
    () => availableLists.map((l) => ({ label: l.label, value: l.id })),
    [availableLists],
  );

  return (
    <SelectField
      value={value}
      options={options}
      onChange={onChange}
      placeholder={content.selectList.value}
      minW="32"
      emptyMessage={content.noOtherLists}
    />
  );
}

function TypeSelector({
  onChange,
  value,
}: {
  value: ActionType;
  onChange: (type: ActionType) => void;
}) {
  return (
    <SelectField
      value={value}
      options={ACTION_TYPE_OPTIONS}
      onChange={(v) => onChange(v as ActionType)}
      w="24"
    />
  );
}

export const ActionCard = memo(function ActionCard({
  action,
  dragHandleProps,
  index,
  listId,
}: ActionCardProps) {
  const { actionCard: content } = useIntlayer("editor");
  const { ref: dragRef, ...dragListeners } = dragHandleProps ?? {};
  const updateAction = useEditor((s) => s.updateAction);
  const deleteAction = useEditor((s) => s.deleteAction);
  const duplicateAction = useEditor((s) => s.duplicateAction);
  const [isExpanded, { set: setIsExpanded }] = useBoolean(false);

  const update = <K extends keyof Action>(field: K, value: Action[K]) =>
    updateAction(listId, action.id, { [field]: value });

  const handleSpellChange = (spellId: number, _name: string) =>
    update("spellId", spellId);
  const handleItemChange = (itemId: number, _name: string) =>
    update("itemId", itemId);

  const actionName = useActionName(action, content);

  return (
    <Collapsible.Root
      open={isExpanded}
      onOpenChange={(e) => setIsExpanded(e.open)}
    >
      <Card.Root opacity={action.enabled ? 1 : 0.5} transition="opacity 0.2s">
        <Card.Body p="3">
          <Flex align="center" gap="3">
            <Flex
              ref={dragRef}
              align="center"
              justify="center"
              cursor="grab"
              color="fg.muted"
              opacity={0.4}
              _hover={{ opacity: 1 }}
              {...dragListeners}
            >
              <GripVerticalIcon size={16} />
            </Flex>

            <Badge size="sm" variant="outline" w="6" justifyContent="center">
              {index + 1}
            </Badge>

            <ActionIcon action={action} size="lg" />

            <Collapsible.Trigger asChild>
              <Flex
                align="center"
                gap="2"
                cursor="pointer"
                _hover={{ color: "fg.default" }}
                color="fg.emphasized"
              >
                <Text fontWeight="medium" textStyle="sm">
                  {actionName}
                </Text>
                {isExpanded ? (
                  <ChevronDownIcon size={16} />
                ) : (
                  <ChevronRightIcon size={16} />
                )}
              </Flex>
            </Collapsible.Trigger>

            <Box flex="1" />

            <Tooltip
              content={
                action.enabled ? content.disableAction : content.enableAction
              }
            >
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => update("enabled", !action.enabled)}
                color={action.enabled ? "green.500" : "fg.muted"}
                aria-label={action.enabled ? content.disable : content.enable}
              >
                <SparklesIcon size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip content={content.duplicate}>
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => duplicateAction(listId, action.id)}
                aria-label={content.duplicate.value}
              >
                <CopyIcon size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip content={content.delete}>
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => deleteAction(listId, action.id)}
                _hover={{ color: "red.500" }}
                aria-label={content.delete.value}
              >
                <TrashIcon size={14} />
              </IconButton>
            </Tooltip>
          </Flex>
        </Card.Body>

        <Collapsible.Content>
          <Box px="4" pb="4" pt="3" borderTopWidth="1" bg="bg.subtle">
            <Flex gap="3" mb="4" wrap="wrap">
              <Box>
                <Text
                  textStyle="xs"
                  fontWeight="medium"
                  color="fg.muted"
                  mb="1"
                >
                  {content.type}
                </Text>
                <TypeSelector
                  value={action.type}
                  onChange={(v) => update("type", v)}
                />
              </Box>
              <Box flex="1" minW="48">
                <Text
                  textStyle="xs"
                  fontWeight="medium"
                  color="fg.muted"
                  mb="1"
                >
                  {action.type === "spell"
                    ? content.spell
                    : action.type === "item"
                      ? content.item
                      : content.targetList}
                </Text>
                {action.type === "spell" && (
                  <SpellPicker
                    value={action.spellId}
                    onSelect={handleSpellChange}
                  />
                )}
                {action.type === "item" && (
                  <ItemPicker
                    value={action.itemId}
                    onSelect={handleItemChange}
                  />
                )}
                {action.type === "call_action_list" && (
                  <ListSelector
                    value={action.listId}
                    listId={listId}
                    onChange={(v) => update("listId", v)}
                  />
                )}
              </Box>
            </Flex>

            <Box>
              <Text textStyle="xs" fontWeight="medium" color="fg.muted" mb="2">
                {content.conditions}
              </Text>
              <ConditionBuilder
                query={action.condition}
                onQueryChange={(v) => update("condition", v)}
              />
            </Box>
          </Box>
        </Collapsible.Content>
      </Card.Root>
    </Collapsible.Root>
  );
});

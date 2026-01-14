"use client";

import type { Item as ItemType, Spell } from "@wowlab/core/Schemas";
import type { RuleGroupType } from "react-querybuilder";

import { Enums } from "@wowlab/core/Schemas";
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
import { useExtracted } from "next-intl";
import { memo, useMemo, useState } from "react";
import { Box, Flex, HStack } from "styled-system/jsx";

import { useEditor, useItem, useSpell } from "@/lib/state";

import type { Action, ActionType } from "../types";

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
import { ACTION_TYPES } from "../constants";
import { ItemPicker, SpellPicker } from "../pickers";

function toItemTooltipData(item: ItemType.ItemDataFlat): ItemTooltipData {
  return {
    effects:
      item.description && item.effects.length > 0
        ? [{ isUse: true, text: item.description }]
        : item.description
          ? [{ text: item.description }]
          : undefined,
    iconName: item.fileName,
    itemLevel: item.itemLevel,
    name: item.name,
    quality: item.quality as ItemQuality,
    slot: item.classification?.inventoryTypeName,
  };
}

function toSpellTooltipData(spell: Spell.SpellDataFlat): SpellTooltipData {
  return {
    castTime: spell.castTime === 0 ? "Instant" : `${spell.castTime / 1000} sec`,
    cooldown:
      spell.recoveryTime > 0 ? `${spell.recoveryTime / 1000} sec` : undefined,
    cost:
      spell.powerCost > 0
        ? `${spell.powerCost} ${Enums.PowerType[spell.powerType] ?? ""}`.trim()
        : undefined,
    description: spell.description,
    iconName: spell.fileName,
    id: spell.id,
    name: spell.name,
    range: spell.rangeMax0 > 0 ? `${spell.rangeMax0} yd range` : undefined,
  };
}

const ActionIcon = memo(function ActionIcon({
  action,
  size = "lg",
}: {
  action: Action;
  size?: "md" | "lg";
}) {
  const { data: spell, isLoading: isSpellLoading } = useSpell(
    action.type === "spell" ? action.spellId : null,
  );
  const { data: item, isLoading: isItemLoading } = useItem(
    action.type === "item" ? action.itemId : null,
  );

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
          <GameIcon iconName={item.fileName} size={size} />
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
        <GameIcon iconName={spell.fileName} size={size} />
      </Box>
    </SpellTooltip>
  );
});

function useActionName(action: Action, t: (key: string) => string): string {
  const { data: spell } = useSpell(
    action.type === "spell" ? action.spellId : null,
  );
  const { data: item } = useItem(action.type === "item" ? action.itemId : null);

  if (action.type === "spell") {
    return spell?.name ?? t("Select spell...");
  }

  if (action.type === "item") {
    return item?.name ?? t("Select item...");
  }

  return t("Call action list");
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
  const t = useExtracted();
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
      placeholder={t("Select list...")}
      minW="32"
      emptyMessage={t("No other lists")}
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
  const t = useExtracted();
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

  const actionName = useActionName(action, t);

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
                action.enabled ? t("Disable action") : t("Enable action")
              }
            >
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => update("enabled", !action.enabled)}
                color={action.enabled ? "green.500" : "fg.muted"}
                aria-label={action.enabled ? t("Disable") : t("Enable")}
              >
                <SparklesIcon size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip content={t("Duplicate")}>
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => duplicateAction(listId, action.id)}
                aria-label={t("Duplicate")}
              >
                <CopyIcon size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip content={t("Delete")}>
              <IconButton
                variant="plain"
                size="xs"
                onClick={() => deleteAction(listId, action.id)}
                _hover={{ color: "red.500" }}
                aria-label={t("Delete")}
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
                  {t("Type")}
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
                    ? t("Spell")
                    : action.type === "item"
                      ? t("Item")
                      : t("Target List")}
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
                {t("Conditions")}
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

"use client";

import { useBoolean } from "ahooks";
import {
  CheckIcon,
  EditIcon,
  GripVerticalIcon,
  ListTreeIcon,
  PlayIcon,
  StarIcon,
  TrashIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useCallback, useState } from "react";
import { Box, Flex, HStack } from "styled-system/jsx";

import type { ActionList } from "@/lib/editor";

import { Badge, IconButton, Input, Text, Tooltip } from "@/components/ui";

import { DragHandle, ItemActionsMenu, useSortableItem } from "../common";

interface SortableListItemProps {
  isDefault: boolean;
  isSelected: boolean;
  list: ActionList;
  onDelete: () => void;
  onRename: (label: string) => void;
  onSelect: () => void;
  onSetDefault: () => void;
}

export function SortableListItem({
  isDefault,
  isSelected,
  list,
  onDelete,
  onRename,
  onSelect,
  onSetDefault,
}: SortableListItemProps) {
  const { sortableListItem: content } = useIntlayer("editor");
  const [isEditing, { setFalse: stopEditing, setTrue: startEditing }] =
    useBoolean(false);
  const [editValue, setEditValue] = useState(list.label);

  const { attributes, listeners, setActivatorNodeRef, setNodeRef, style } =
    useSortableItem(list.id);

  const handleStartEdit = useCallback(() => {
    setEditValue(list.label);
    startEditing();
  }, [list.label, startEditing]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== list.label) {
      onRename(trimmed);
    }
    stopEditing();
  }, [editValue, list.label, onRename, stopEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        stopEditing();
      } else if (e.key === "F2" && !isEditing) {
        e.preventDefault();
        handleStartEdit();
      }
    },
    [handleSaveEdit, handleStartEdit, isEditing, stopEditing],
  );

  const ListTypeIcon =
    list.listType === "precombat"
      ? ZapIcon
      : list.listType === "main"
        ? PlayIcon
        : ListTreeIcon;

  const listTypeColor =
    list.listType === "precombat"
      ? "amber.500"
      : list.listType === "main"
        ? "green.500"
        : "fg.muted";

  if (isEditing) {
    return (
      <Flex align="center" gap="1.5" px="2" py="1">
        <Input
          size="sm"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          autoFocus
          flex="1"
        />
        <IconButton variant="plain" size="xs" onClick={handleSaveEdit}>
          <CheckIcon size={14} />
        </IconButton>
        <IconButton variant="plain" size="xs" onClick={stopEditing}>
          <XIcon size={14} />
        </IconButton>
      </Flex>
    );
  }

  const canDelete = !isDefault;

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      align="center"
      justify="space-between"
      px="2"
      py="1.5"
      rounded="md"
      cursor="pointer"
      bg={isSelected ? "bg.muted" : "transparent"}
      _hover={{ bg: isSelected ? "bg.muted" : "bg.subtle" }}
      onClick={onSelect}
      onDoubleClick={handleStartEdit}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      <HStack gap="2" flex="1" minW="0">
        <DragHandle
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
        <Box color={listTypeColor}>
          <ListTypeIcon size={14} />
        </Box>
        <Text textStyle="sm" truncate fontWeight="medium">
          {list.label}
        </Text>
        {list.listType === "precombat" && (
          <Badge size="sm" variant="outline" colorPalette="amber">
            {content.pre}
          </Badge>
        )}
        {list.listType === "main" && (
          <Badge size="sm" variant="outline" colorPalette="green">
            {content.main}
          </Badge>
        )}
        {isDefault && (
          <Tooltip content={content.defaultList}>
            <Box color="amber.500">
              <StarIcon size={12} fill="currentColor" />
            </Box>
          </Tooltip>
        )}
      </HStack>

      <HStack gap="1">
        <Text textStyle="xs" color="fg.muted" fontFamily="mono">
          {list.actions.length}
        </Text>
        <ItemActionsMenu
          ariaLabel={content.listActions}
          actions={[
            {
              icon: EditIcon,
              label: content.rename,
              onClick: handleStartEdit,
              value: "rename",
            },
            {
              disabled: isDefault,
              icon: StarIcon,
              label: content.setAsDefault,
              onClick: onSetDefault,
              value: "default",
            },
            {
              destructive: true,
              disabled: !canDelete,
              icon: TrashIcon,
              label: content.delete,
              onClick: onDelete,
              value: "delete",
            },
          ]}
        />
      </HStack>
    </Flex>
  );
}

"use client";

import {
  EyeIcon,
  LockIcon,
  PencilIcon,
  SaveIcon,
  UnlockIcon,
} from "lucide-react";
import { Box, Flex, HStack } from "styled-system/jsx";

import { useEditor } from "@/lib/state/editor";
import { useSaveRotation } from "@/lib/state/rotation";

import {
  Badge,
  Button,
  IconButton,
  Input,
  Loader,
  Switch,
  Text,
  Tooltip,
} from "../../ui";
import { useCanEdit, useIsOwner } from "../hooks";
import { countTotalActions } from "../utils";

export function EditorHeader() {
  const name = useEditor((s) => s.name);
  const setName = useEditor((s) => s.setName);
  const viewMode = useEditor((s) => s.viewMode);
  const setViewMode = useEditor((s) => s.setViewMode);
  const isPublic = useEditor((s) => s.isPublic);
  const setIsPublic = useEditor((s) => s.setIsPublic);
  const isDirty = useEditor((s) => s.isDirty);
  const actionLists = useEditor((s) => s.actionLists);
  const variables = useEditor((s) => s.variables);
  const isLocked = useEditor((s) => s.isLocked);
  const setLocked = useEditor((s) => s.setLocked);
  const rotationId = useEditor((s) => s.rotationId);

  const { isLoading: isSaving, isNew, save } = useSaveRotation();

  const isOwner = useIsOwner();
  const canEdit = useCanEdit();

  const listCount = actionLists.length;
  const actionCount = countTotalActions(actionLists);
  const varCount = variables.length;

  const handleSave = () => {
    void save();
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      px="4"
      py="2"
      borderBottomWidth="1"
      borderColor="border.default"
      bg="bg.default"
      gap="4"
      flexShrink={0}
    >
      <HStack gap="3" flex="1">
        {canEdit ? (
          <Input
            placeholder="Rotation name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            w="64"
          />
        ) : (
          <Text fontWeight="medium" fontSize="lg">
            {name || "Untitled Rotation"}
          </Text>
        )}

        {isLocked && !isOwner && (
          <Badge size="sm" variant="subtle" colorPalette="amber">
            <LockIcon size={12} />
            Read-only
          </Badge>
        )}
        {isLocked && isOwner && (
          <Badge size="sm" variant="outline">
            <LockIcon size={12} />
            Locked
          </Badge>
        )}
        {isDirty && canEdit && (
          <Badge size="sm" variant="outline">
            Unsaved
          </Badge>
        )}
        {isNew && (
          <Badge size="sm" variant="subtle">
            New
          </Badge>
        )}

        <HStack gap="2" color="fg.muted" display={{ base: "none", md: "flex" }}>
          <Text textStyle="xs" fontFamily="mono">
            {listCount} list{listCount !== 1 ? "s" : ""}
          </Text>
          <Text textStyle="xs" color="fg.subtle">
            -
          </Text>
          <Text textStyle="xs" fontFamily="mono">
            {actionCount} action{actionCount !== 1 ? "s" : ""}
          </Text>
          <Text textStyle="xs" color="fg.subtle">
            -
          </Text>
          <Text textStyle="xs" fontFamily="mono">
            {varCount} var{varCount !== 1 ? "s" : ""}
          </Text>
        </HStack>
      </HStack>

      <HStack gap="3">
        {isOwner && rotationId && (
          <Tooltip content={isLocked ? "Unlock to edit" : "Lock rotation"}>
            <IconButton
              variant={isLocked ? "outline" : "plain"}
              size="sm"
              onClick={() => setLocked(!isLocked)}
              aria-label={isLocked ? "Unlock" : "Lock"}
            >
              {isLocked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
            </IconButton>
          </Tooltip>
        )}

        {canEdit && (
          <HStack gap="2">
            <Switch.Root
              checked={isPublic}
              onCheckedChange={(details) => setIsPublic(details.checked)}
            >
              <Switch.Control />
              <Switch.Label>Public</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
          </HStack>
        )}

        <HStack gap="1" bg="bg.muted" p="1" rounded="md">
          <Tooltip content="Edit">
            <IconButton
              variant={viewMode === "edit" ? "solid" : "plain"}
              size="sm"
              onClick={() => setViewMode("edit")}
              aria-label="Edit mode"
              disabled={!canEdit && viewMode !== "edit"}
            >
              <PencilIcon size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip content="Preview">
            <IconButton
              variant={viewMode === "preview" ? "solid" : "plain"}
              size="sm"
              onClick={() => setViewMode("preview")}
              aria-label="Preview mode"
            >
              <EyeIcon size={16} />
            </IconButton>
          </Tooltip>
        </HStack>

        {canEdit && (
          <Tooltip content={isNew ? "Create rotation" : "Save changes"}>
            <Button
              size="sm"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader size="sm" /> : <SaveIcon size={16} />}
              {isNew ? "Create" : "Save"}
            </Button>
          </Tooltip>
        )}
      </HStack>
    </Flex>
  );
}

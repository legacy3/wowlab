"use client";

import {
  EyeIcon,
  LockIcon,
  PencilIcon,
  SaveIcon,
  UnlockIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
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
  const { header: content } = useIntlayer("editor");
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
            placeholder={content.rotationNamePlaceholder.value}
            value={name}
            onChange={(e) => setName(e.target.value)}
            w="64"
          />
        ) : (
          <Text fontWeight="medium" fontSize="lg">
            {name || content.untitledRotation}
          </Text>
        )}

        {isLocked && !isOwner && (
          <Badge size="sm" variant="subtle" colorPalette="amber">
            <LockIcon size={12} />
            {content.readOnly}
          </Badge>
        )}
        {isLocked && isOwner && (
          <Badge size="sm" variant="outline">
            <LockIcon size={12} />
            {content.locked}
          </Badge>
        )}
        {isDirty && canEdit && (
          <Badge size="sm" variant="outline">
            {content.unsaved}
          </Badge>
        )}
        {isNew && (
          <Badge size="sm" variant="subtle">
            {content.new}
          </Badge>
        )}

        <HStack gap="2" color="fg.muted" display={{ base: "none", md: "flex" }}>
          <Text textStyle="xs" fontFamily="mono">
            {listCount === 1 ? "1 list" : `${listCount} lists`}
          </Text>
          <Text textStyle="xs" color="fg.subtle">
            -
          </Text>
          <Text textStyle="xs" fontFamily="mono">
            {actionCount === 1 ? "1 action" : `${actionCount} actions`}
          </Text>
          <Text textStyle="xs" color="fg.subtle">
            -
          </Text>
          <Text textStyle="xs" fontFamily="mono">
            {varCount === 1 ? "1 variable" : `${varCount} variables`}
          </Text>
        </HStack>
      </HStack>

      <HStack gap="3">
        {isOwner && rotationId && (
          <Tooltip
            content={isLocked ? content.unlockToEdit : content.lockRotation}
          >
            <IconButton
              variant={isLocked ? "outline" : "plain"}
              size="sm"
              onClick={() => setLocked(!isLocked)}
              aria-label={isLocked ? content.unlock : content.lock}
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
              <Switch.Label>{content.public}</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
          </HStack>
        )}

        <HStack gap="1" bg="bg.muted" p="1" rounded="md">
          <Tooltip content={content.edit}>
            <IconButton
              variant={viewMode === "edit" ? "solid" : "plain"}
              size="sm"
              onClick={() => setViewMode("edit")}
              aria-label={content.editMode.value}
              disabled={!canEdit && viewMode !== "edit"}
            >
              <PencilIcon size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip content={content.preview}>
            <IconButton
              variant={viewMode === "preview" ? "solid" : "plain"}
              size="sm"
              onClick={() => setViewMode("preview")}
              aria-label={content.previewMode.value}
            >
              <EyeIcon size={16} />
            </IconButton>
          </Tooltip>
        </HStack>

        {canEdit && (
          <Tooltip
            content={isNew ? content.createRotation : content.saveChanges}
          >
            <Button
              size="sm"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader size="sm" /> : <SaveIcon size={16} />}
              {isNew ? content.create : content.save}
            </Button>
          </Tooltip>
        )}
      </HStack>
    </Flex>
  );
}

"use client";

import {
  EyeIcon,
  LockIcon,
  PencilIcon,
  SaveIcon,
  UnlockIcon,
  XIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Flex, HStack } from "styled-system/jsx";

import { SpecPicker } from "@/components/game";
import { useEditor } from "@/lib/state/editor";
import { useSaveRotation } from "@/lib/state/rotation";

import {
  Badge,
  Button,
  IconButton,
  Loader,
  Switch,
  Text,
  Tooltip,
} from "../../ui";
import { useCanEdit, useIsOwner } from "../hooks";

export function EditorHeader() {
  const { header: content } = useIntlayer("editor");
  const name = useEditor((s) => s.name);
  const viewMode = useEditor((s) => s.viewMode);
  const setViewMode = useEditor((s) => s.setViewMode);
  const isPublic = useEditor((s) => s.isPublic);
  const setIsPublic = useEditor((s) => s.setIsPublic);
  const isDirty = useEditor((s) => s.isDirty);
  const isLocked = useEditor((s) => s.isLocked);
  const setLocked = useEditor((s) => s.setLocked);
  const rotationId = useEditor((s) => s.rotationId);
  const specId = useEditor((s) => s.specId);
  const setSpecId = useEditor((s) => s.setSpecId);

  const { isLoading: isSaving, isNew, save } = useSaveRotation();

  const isOwner = useIsOwner();
  const canEdit = useCanEdit();

  const handleSave = () => {
    void save();
  };

  const handleClose = () => {
    setSpecId(null);
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      px="3"
      h="12"
      borderBottomWidth="1"
      borderColor="border.default"
      bg="bg.default"
      gap="3"
      flexShrink={0}
    >
      <HStack gap="3">
        <Tooltip content={content.close}>
          <IconButton
            variant="plain"
            size="sm"
            onClick={handleClose}
            aria-label={content.close.value}
          >
            <XIcon size={16} />
          </IconButton>
        </Tooltip>

        <SpecPicker compact specId={specId} onSelect={setSpecId} />

        <Text fontWeight="medium" textStyle="sm" color="fg.muted">
          /
        </Text>
        <Text fontWeight="medium" textStyle="sm">
          {name || content.untitledRotation}
        </Text>

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

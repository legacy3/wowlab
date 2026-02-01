"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useBoolean } from "ahooks";
import { Trash2Icon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { HStack, Stack, styled } from "styled-system/jsx";

import {
  Button,
  Code,
  Dialog,
  Field,
  Input,
  Select,
  Slider,
  Switch,
  Text,
} from "@/components/ui";
import {
  NODE_ACCESS_OPTIONS,
  type NodeAccessType,
  type NodeWithMeta,
  type SaveNodeData,
} from "@/lib/state";

import { PlatformIcon } from "./platform-icon";

const accessCollection = createListCollection({ items: NODE_ACCESS_OPTIONS });

interface NodeSettingsDialogProps {
  isDeleting?: boolean;
  isSaving?: boolean;
  node: NodeWithMeta;
  onDelete: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SaveNodeData) => Promise<void>;
  open: boolean;
}

export function NodeSettingsDialog({
  isDeleting = false,
  isSaving = false,
  node,
  onDelete,
  onOpenChange,
  onSave,
  open,
}: NodeSettingsDialogProps) {
  const content = useIntlayer("account").settingsDialog;
  const [name, setName] = useState(node.name);
  const [workers, setWorkers] = useState([node.max_parallel]);
  const [accessType, setAccessType] = useState<NodeAccessType>(
    node.accessType ?? "private",
  );
  const [enabled, setEnabled] = useState(node.status !== "offline");
  const [
    showDeleteConfirm,
    { setFalse: closeDeleteConfirm, setTrue: openDeleteConfirm },
  ] = useBoolean(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleSave = async () => {
    await onSave({
      accessType,
      maxParallel: workers[0],
      name,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await onDelete();
    closeDeleteConfirm();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{content.nodeSettings}</Dialog.Title>
              <Dialog.Description>
                {content.configureYourNodeSettings}
              </Dialog.Description>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="5">
                <HStack gap="3">
                  <PlatformIcon platform={node.platform} />
                  <Text textStyle="sm" color="fg.muted">
                    {node.platform} - v{node.version}
                  </Text>
                </HStack>

                <Field.Root>
                  <Field.Label>{content.nodeName}</Field.Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root>
                  <HStack justify="space-between">
                    <Field.Label>{content.workers}</Field.Label>
                    <styled.span textStyle="sm" color="fg.muted">
                      {content.workersOfCores({
                        totalCores: node.total_cores,
                        workers: workers[0],
                      })}
                    </styled.span>
                  </HStack>
                  <Slider.Root
                    min={1}
                    max={node.total_cores}
                    value={workers}
                    onValueChange={(e) => setWorkers(e.value)}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumbs />
                    </Slider.Control>
                  </Slider.Root>
                </Field.Root>

                <Select.Root
                  collection={accessCollection}
                  value={[accessType]}
                  onValueChange={(e) =>
                    setAccessType(e.value[0] as NodeAccessType)
                  }
                  positioning={{ sameWidth: true }}
                >
                  <Select.Label>{content.access}</Select.Label>
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText
                        placeholder={content.selectAccessLevel.value}
                      />
                      <Select.Indicator />
                    </Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {accessCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>

                <HStack justify="space-between">
                  <Stack gap="0">
                    <Text fontWeight="medium">{content.power}</Text>
                    <Text textStyle="sm" color="fg.muted">
                      {content.enableThisNode}
                    </Text>
                  </Stack>
                  <Switch.Root
                    checked={enabled}
                    onCheckedChange={(e) => setEnabled(e.checked)}
                  >
                    <Switch.Control />
                    <Switch.HiddenInput />
                  </Switch.Root>
                </HStack>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="outline"
                colorPalette="red"
                onClick={openDeleteConfirm}
              >
                <Trash2Icon size={14} />
                {content.delete}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {content.cancel}
              </Button>
              <Button onClick={handleSave} loading={isSaving}>
                {content.saveChanges}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root
        open={showDeleteConfirm}
        onOpenChange={(e) => {
          if (e.open) {
            openDeleteConfirm();
          } else {
            closeDeleteConfirm();
            setDeleteConfirmName("");
          }
        }}
      >
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{content.deleteNode}</Dialog.Title>
              <Dialog.Description>{content.cannotBeUndone}</Dialog.Description>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="4">
                <Text textStyle="sm">{content.typeNodeNameToConfirm}</Text>
                <Code>{node.name}</Code>
                <Input
                  placeholder={node.name}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                />
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={closeDeleteConfirm}>
                {content.cancel}
              </Button>
              <Button
                colorPalette="red"
                disabled={deleteConfirmName !== node.name}
                onClick={handleDelete}
                loading={isDeleting}
              >
                {content.deleteNode}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

"use client";

import { createListCollection } from "@ark-ui/react/select";
import { Trash2Icon } from "lucide-react";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { HStack, Stack, styled } from "styled-system/jsx";

import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Slider,
  Switch,
  Text,
} from "@/components/ui";

import type { Node, NodeAccessType } from "./types";

import { PlatformIcon } from "./platform-icon";
import { NODE_ACCESS_OPTIONS } from "./types";

const accessCollection = createListCollection({ items: NODE_ACCESS_OPTIONS });

export interface NodeSettingsData {
  accessType: NodeAccessType;
  enabled: boolean;
  name: string;
  workers: number;
}

interface NodeSettingsDialogProps {
  isDeleting?: boolean;
  isSaving?: boolean;
  node: Node;
  onDelete: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: NodeSettingsData) => Promise<void>;
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
  const t = useExtracted();
  const [name, setName] = useState(node.name);
  const [workers, setWorkers] = useState([node.workers]);
  const [accessType, setAccessType] = useState<NodeAccessType>(
    node.accessType ?? "private",
  );
  const [enabled, setEnabled] = useState(node.status !== "offline");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleSave = async () => {
    await onSave({
      accessType,
      enabled,
      name,
      workers: workers[0],
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("Node Settings")}</Dialog.Title>
              <Dialog.Description>
                {t("Configure your node settings")}
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
                  <Field.Label>{t("Node Name")}</Field.Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field.Root>

                <Field.Root>
                  <HStack justify="space-between">
                    <Field.Label>{t("Workers")}</Field.Label>
                    <styled.span textStyle="sm" color="fg.muted">
                      {t("{workers, number} / {totalCores, number} cores", {
                        totalCores: node.totalCores,
                        workers: workers[0],
                      })}
                    </styled.span>
                  </HStack>
                  <Slider.Root
                    min={1}
                    max={node.totalCores}
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
                  <Select.Label>{t("Access")}</Select.Label>
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText
                        placeholder={t("Select access level")}
                      />
                      <Select.Indicator />
                    </Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {accessCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{t(item.label)}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>

                <HStack justify="space-between">
                  <Stack gap="0">
                    <Text fontWeight="medium">{t("Power")}</Text>
                    <Text textStyle="sm" color="fg.muted">
                      {t("Enable this node for simulations")}
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
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2Icon size={14} />
                {t("Delete")}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSave} loading={isSaving}>
                {t("Save Changes")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root
        open={showDeleteConfirm}
        onOpenChange={(e) => {
          setShowDeleteConfirm(e.open);
          setDeleteConfirmName("");
        }}
      >
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("Delete Node")}</Dialog.Title>
              <Dialog.Description>
                {t("This action cannot be undone.")}
              </Dialog.Description>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="4">
                <Text textStyle="sm">
                  {t("Type {name} to confirm deletion.", { name: node.name })}
                </Text>
                <Input
                  placeholder={node.name}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                />
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("Cancel")}
              </Button>
              <Button
                colorPalette="red"
                disabled={deleteConfirmName !== node.name}
                onClick={handleDelete}
                loading={isDeleting}
              >
                {t("Delete Node")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

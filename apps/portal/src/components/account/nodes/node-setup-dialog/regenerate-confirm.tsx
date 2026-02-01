"use client";

import { useIntlayer } from "next-intlayer";

import { Button, Dialog, Text } from "@/components/ui";

interface RegenerateConfirmProps {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function RegenerateConfirm({
  loading,
  onClose,
  onConfirm,
  onOpenChange,
  open,
}: RegenerateConfirmProps) {
  const content = useIntlayer("account").setupDialog;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{content.regenerateConfirmTitle}</Dialog.Title>
            <Dialog.Description>
              {content.regenerateConfirmDescription}
            </Dialog.Description>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <Text textStyle="sm">{content.regenerateWarning}</Text>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="outline" onClick={onClose}>
              {content.cancel}
            </Button>
            <Button colorPalette="red" onClick={onConfirm} loading={loading}>
              {content.regenerate}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

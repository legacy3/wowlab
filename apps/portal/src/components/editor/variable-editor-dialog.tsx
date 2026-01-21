"use client";

import { useIntlayer } from "next-intlayer";
import { useEffect, useState } from "react";
import { Box, VStack } from "styled-system/jsx";

import type { Variable } from "@/lib/engine";

import { Button, Code, Dialog, Input, Text } from "../ui";

export interface VariableEditorDialogProps {
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Variable, "id">) => void;
  open: boolean;
  variable: Variable | null;
}

export function VariableEditorDialog({
  onOpenChange,
  onSave,
  open,
  variable,
}: VariableEditorDialogProps) {
  const { variableEditorDialog: content } = useIntlayer("editor");
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");

  useEffect(() => {
    if (open) {
      setName(variable?.name ?? "");
      setExpression(variable?.expression ?? "");
    }
  }, [open, variable]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ expression: expression.trim(), name: name.trim() });
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const isEdit = variable !== null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {isEdit ? content.editVariable : content.addVariable}
            </Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap="4" alignItems="stretch">
              <Box>
                <Text textStyle="sm" fontWeight="medium" mb="1">
                  {content.name}
                </Text>
                <Input
                  placeholder={content.variableNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Text textStyle="xs" color="fg.muted" mt="1">
                  {content.useSnakeCaseHint}
                </Text>
              </Box>
              <Box>
                <Text textStyle="sm" fontWeight="medium" mb="1">
                  {content.expression}
                </Text>
                <Input
                  placeholder={content.expressionPlaceholder}
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Text textStyle="xs" color="fg.muted" mt="1">
                  {content.expressionEvaluatedAtRuntime}
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {content.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {isEdit ? content.save : content.add}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

"use client";

import { useBoolean } from "ahooks";
import { Box, Flex } from "styled-system/jsx";

import { RotationStartScreen } from "@/components/rotations";
import { useEditor } from "@/lib/state/editor";

import { ActionList, ActionPicker } from "../actions";
import { EditorSidebar } from "../editor-sidebar";
import { useCanEdit, useKeyboardShortcuts } from "../hooks";
import { Preview } from "../preview";
import { EditorHeader } from "./editor-header";

export function EditorPage() {
  const viewMode = useEditor((s) => s.viewMode);
  const selectedListId = useEditor((s) => s.selectedListId);
  const specId = useEditor((s) => s.specId);
  const [pickerOpen, { set: setPickerOpen, setTrue: openPicker }] =
    useBoolean(false);

  const canEdit = useCanEdit();

  useKeyboardShortcuts({}, () => {
    if (selectedListId && canEdit) {
      openPicker();
    }
  });

  // Show start screen if no spec is selected (new rotation)
  if (specId === null) {
    return <RotationStartScreen />;
  }

  const effectiveViewMode = canEdit ? viewMode : "preview";

  return (
    <Flex flexDirection="column" h="100vh" overflow="hidden">
      <EditorHeader />
      <Flex flex="1" overflow="hidden">
        {effectiveViewMode === "edit" && canEdit && <EditorSidebar />}
        <Box flex="1" p="4" overflowY="auto" bg="bg.canvas">
          {effectiveViewMode === "edit" && canEdit ? (
            <ActionList />
          ) : (
            <Preview />
          )}
        </Box>
      </Flex>

      {selectedListId && canEdit && (
        <ActionPicker
          listId={selectedListId}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
        />
      )}
    </Flex>
  );
}

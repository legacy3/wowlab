"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBoolean } from "ahooks";
import {
  ChevronLeftIcon,
  GripVerticalIcon,
  ListIcon,
  PlusIcon,
  VariableIcon,
} from "lucide-react";
import { useExtracted } from "next-intl";
import { useRef, useState } from "react";
import { Box, Flex, HStack, VStack } from "styled-system/jsx";

import type { Variable } from "@/lib/engine";

import { useEditor } from "@/lib/state/editor";

import { Button, Code, IconButton, Tabs, Text, Tooltip } from "../ui";
import {
  CollapsedSidebar,
  SortableListItem,
  type TabId,
  VariableItem,
} from "./sidebar";
import { VariableEditorDialog } from "./variable-editor-dialog";

export function EditorSidebar() {
  const t = useExtracted();
  const [collapsed, { setFalse: expand, setTrue: collapse }] =
    useBoolean(false);
  const [activeTab, setActiveTab] = useState<TabId>("lists");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [
    variableDialogOpen,
    { set: setVariableDialogOpen, setTrue: openVariableDialog },
  ] = useBoolean(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);

  const actionLists = useEditor((s) => s.actionLists);
  const selectedListId = useEditor((s) => s.selectedListId);
  const defaultListId = useEditor((s) => s.defaultListId);
  const selectList = useEditor((s) => s.selectList);
  const addList = useEditor((s) => s.addList);
  const deleteList = useEditor((s) => s.deleteList);
  const renameList = useEditor((s) => s.renameList);
  const setDefaultList = useEditor((s) => s.setDefaultList);
  const reorderLists = useEditor((s) => s.reorderLists);
  const variables = useEditor((s) => s.variables);
  const addVariable = useEditor((s) => s.addVariable);
  const updateVariable = useEditor((s) => s.updateVariable);
  const deleteVariable = useEditor((s) => s.deleteVariable);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddList = () => {
    addList({
      label: `List ${actionLists.length + 1}`,
      listType: "sub",
      name: `list_${actionLists.length + 1}`,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = actionLists.findIndex((l) => l.id === active.id);
      const newIndex = actionLists.findIndex((l) => l.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderLists(oldIndex, newIndex);
      }
    }
  };

  const activeList = activeId
    ? actionLists.find((l) => l.id === activeId)
    : null;

  const handleAddVariable = () => {
    setEditingVariable(null);
    openVariableDialog();
  };

  const handleEditVariable = (variable: Variable) => {
    setEditingVariable(variable);
    openVariableDialog();
  };

  const handleSaveVariable = (data: Omit<Variable, "id">) => {
    if (editingVariable) {
      updateVariable(editingVariable.id, data);
    } else {
      addVariable(data);
    }
  };

  const listsParentRef = useRef<HTMLDivElement>(null);
  const listsVirtualizer = useVirtualizer({
    count: actionLists.length,
    estimateSize: () => 36,
    getScrollElement: () => listsParentRef.current,
    overscan: 5,
  });

  const varsParentRef = useRef<HTMLDivElement>(null);
  const varsVirtualizer = useVirtualizer({
    count: variables.length,
    estimateSize: () => 40,
    getScrollElement: () => varsParentRef.current,
    overscan: 5,
  });

  if (collapsed) {
    return (
      <CollapsedSidebar
        activeTab={activeTab}
        listCount={actionLists.length}
        variableCount={variables.length}
        onTabClick={(tab) => {
          setActiveTab(tab);
          expand();
        }}
        onExpand={expand}
      />
    );
  }

  return (
    <Flex
      direction="column"
      w="60"
      borderRightWidth="1"
      borderColor="border.default"
      bg="bg.default"
      h="full"
      overflow="hidden"
    >
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value as TabId)}
        display="flex"
        flexDirection="column"
        h="full"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="space-between"
          borderBottomWidth="1"
          px="2"
          py="1.5"
          flexShrink={0}
        >
          <Tabs.List bg="transparent" h="8" gap="1">
            <Tabs.Trigger value="lists" h="7" px="2.5" rounded="md" gap="1.5">
              <ListIcon size={14} />
              <Text textStyle="xs">{t("Lists")}</Text>
              <Text textStyle="xs" color="fg.muted">
                {actionLists.length}
              </Text>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="variables"
              h="7"
              px="2.5"
              rounded="md"
              gap="1.5"
            >
              <VariableIcon size={14} />
              <Text textStyle="xs">{t("Vars")}</Text>
              <Text textStyle="xs" color="fg.muted">
                {variables.length}
              </Text>
            </Tabs.Trigger>
          </Tabs.List>
          <IconButton variant="plain" size="xs" onClick={collapse}>
            <ChevronLeftIcon size={16} />
          </IconButton>
        </Flex>

        <Tabs.Content
          value="lists"
          flex="1"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Flex
            align="center"
            justify="space-between"
            px="3"
            py="2"
            borderBottomWidth="1"
          >
            <Text
              textStyle="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {t("Action Lists")}
            </Text>
            <Tooltip content={t("Add list")}>
              <IconButton variant="plain" size="xs" onClick={handleAddList}>
                <PlusIcon size={14} />
              </IconButton>
            </Tooltip>
          </Flex>
          <Box ref={listsParentRef} flex="1" overflowY="auto" p="2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={actionLists.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {actionLists.length > 0 && (
                  <Box
                    h={`${listsVirtualizer.getTotalSize()}px`}
                    position="relative"
                  >
                    {listsVirtualizer.getVirtualItems().map((virtualRow) => {
                      const list = actionLists[virtualRow.index];

                      return (
                        <Box
                          key={list.id}
                          position="absolute"
                          top="0"
                          left="0"
                          w="full"
                          style={{
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <SortableListItem
                            list={list}
                            isSelected={list.id === selectedListId}
                            isDefault={list.id === defaultListId}
                            onSelect={() => selectList(list.id)}
                            onRename={(label) => renameList(list.id, label)}
                            onSetDefault={() => setDefaultList(list.id)}
                            onDelete={() => deleteList(list.id)}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </SortableContext>
              <DragOverlay>
                {activeList && (
                  <Flex
                    align="center"
                    px="2"
                    py="1.5"
                    rounded="md"
                    bg="bg.muted"
                    borderWidth="1"
                    shadow="lg"
                  >
                    <HStack gap="2">
                      <GripVerticalIcon size={14} />
                      <ListIcon size={14} />
                      <Text textStyle="sm">{activeList.label}</Text>
                    </HStack>
                  </Flex>
                )}
              </DragOverlay>
            </DndContext>
            {actionLists.length === 0 && (
              <Box textAlign="center" py="8">
                <Text textStyle="sm" color="fg.muted">
                  {t("No lists yet")}
                </Text>
                <Button
                  variant="plain"
                  size="sm"
                  onClick={handleAddList}
                  mt="1"
                >
                  {t("Add your first list")}
                </Button>
              </Box>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content
          value="variables"
          flex="1"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Flex
            align="center"
            justify="space-between"
            px="3"
            py="2"
            borderBottomWidth="1"
          >
            <Text
              textStyle="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {t("Variables")}
            </Text>
            <Tooltip content={t("Add variable")}>
              <IconButton variant="plain" size="xs" onClick={handleAddVariable}>
                <PlusIcon size={14} />
              </IconButton>
            </Tooltip>
          </Flex>
          <Box ref={varsParentRef} flex="1" overflowY="auto" p="2">
            {variables.length > 0 && (
              <Box
                h={`${varsVirtualizer.getTotalSize()}px`}
                position="relative"
              >
                {varsVirtualizer.getVirtualItems().map((virtualRow) => {
                  const variable = variables[virtualRow.index];

                  return (
                    <Box
                      key={variable.id}
                      position="absolute"
                      top="0"
                      left="0"
                      w="full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <VariableItem
                        variable={variable}
                        onEdit={() => handleEditVariable(variable)}
                        onDelete={() => deleteVariable(variable.id)}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
            {variables.length === 0 && (
              <Box textAlign="center" py="8">
                <Text textStyle="sm" color="fg.muted">
                  {t("No variables yet")}
                </Text>
                <Text textStyle="xs" color="fg.muted" mt="2">
                  {t("Use {code} in conditions", { code: "$name" })}
                </Text>
                <Button
                  variant="plain"
                  size="sm"
                  onClick={handleAddVariable}
                  mt="2"
                >
                  {t("Add your first variable")}
                </Button>
              </Box>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      <VariableEditorDialog
        variable={editingVariable}
        open={variableDialogOpen}
        onOpenChange={setVariableDialogOpen}
        onSave={handleSaveVariable}
      />
    </Flex>
  );
}

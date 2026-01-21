"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBoolean } from "ahooks";
import { ListTreeIcon, PlusIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo, useRef, useState } from "react";
import { Box, Center, VStack } from "styled-system/jsx";

import type { Action } from "@/lib/engine";

import { useEditor, useSelectedList } from "@/lib/state/editor";

import { Badge, Button, Heading, Text } from "../../ui";
import { ActionCard } from "./action-card";
import { ActionPicker } from "./action-picker";

interface SortableActionCardProps {
  action: Action;
  index: number;
  listId: string;
}

export function ActionList() {
  const { actionList: content } = useIntlayer("editor");
  const selectedList = useSelectedList();
  const reorderActions = useEditor((s) => s.reorderActions);
  const [pickerOpen, { set: setPickerOpen, setTrue: openPicker }] =
    useBoolean(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const measuring = useMemo(
    () => ({
      droppable: {
        strategy: MeasuringStrategy.BeforeDragging,
      },
    }),
    [],
  );

  if (!selectedList) {
    return (
      <Center h="full">
        <VStack gap="2">
          <ListTreeIcon size={48} strokeWidth={1} />
          <Text color="fg.muted">{content.selectListFromSidebar}</Text>
        </VStack>
      </Center>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = selectedList.actions.findIndex(
        (a) => a.id === active.id,
      );
      const newIndex = selectedList.actions.findIndex((a) => a.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderActions(selectedList.id, oldIndex, newIndex);
      }
    }
  };

  const activeAction = activeId
    ? selectedList.actions.find((a) => a.id === activeId)
    : null;
  const activeIndex = activeAction
    ? selectedList.actions.findIndex((a) => a.id === activeId)
    : -1;

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: selectedList.actions.length,
    estimateSize: () => 72,
    getScrollElement: () => parentRef.current,
    overscan: 3,
  });

  return (
    <Box maxW="4xl" mx="auto">
      <VStack gap="4" alignItems="stretch">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          pb="2"
          borderBottomWidth="1"
        >
          <Box display="flex" alignItems="center" gap="2.5">
            <Heading size="md">{selectedList.label}</Heading>
            {selectedList.listType === "main" && (
              <Badge size="sm" variant="outline">
                {content.entryPoint}
              </Badge>
            )}
            {selectedList.listType === "precombat" && (
              <Badge size="sm" variant="subtle" colorPalette="amber">
                {content.precombat}
              </Badge>
            )}
          </Box>
          <Text textStyle="xs" color="fg.muted" fontFamily="mono">
            {selectedList.actions.length === 1
              ? "1 action"
              : `${selectedList.actions.length} actions`}
          </Text>
        </Box>

        {selectedList.actions.length === 0 ? (
          <Center py="12" borderWidth="1" borderStyle="dashed" rounded="lg">
            <VStack gap="4">
              <Box p="4" rounded="full" bg="bg.muted">
                <ListTreeIcon size={32} strokeWidth={1.5} />
              </Box>
              <VStack gap="1">
                <Text fontWeight="medium">{content.noActionsYet}</Text>
                <Text
                  textStyle="sm"
                  color="fg.muted"
                  textAlign="center"
                  maxW="52"
                >
                  {content.addSpellsItemsOrCallOther}
                </Text>
              </VStack>
              <Button size="sm" onClick={() => openPicker()}>
                <PlusIcon size={16} />
                {content.addAction}
              </Button>
            </VStack>
          </Center>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            measuring={measuring}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedList.actions.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box
                ref={parentRef}
                maxH="calc(100vh - 280px)"
                overflow="auto"
                pr="2"
              >
                <Box
                  h={`${virtualizer.getTotalSize()}px`}
                  position="relative"
                  w="full"
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const action = selectedList.actions[virtualRow.index];

                    return (
                      <Box
                        key={action.id}
                        position="absolute"
                        top="0"
                        left="0"
                        w="full"
                        pb="2"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <SortableActionCard
                          action={action}
                          listId={selectedList.id}
                          index={virtualRow.index}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </SortableContext>

            <DragOverlay>
              {activeAction && (
                <Box opacity={0.8}>
                  <ActionCard
                    action={activeAction}
                    listId={selectedList.id}
                    index={activeIndex}
                  />
                </Box>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {selectedList.actions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPicker()}
            borderStyle="dashed"
            w="full"
          >
            <PlusIcon size={16} />
            {content.addAction}
          </Button>
        )}
      </VStack>

      <ActionPicker
        listId={selectedList.id}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />
    </Box>
  );
}

function SortableActionCard({
  action,
  index,
  listId,
}: SortableActionCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: action.id });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <ActionCard
        action={action}
        listId={listId}
        index={index}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners,
        }}
      />
    </Box>
  );
}

"use client";

import type { Modifier } from "@dnd-kit/core";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { List } from "immutable";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import type { TabSectionLayout } from "@/types/ui";

import { SortableSection } from "./sortable-section";

const SortableSectionWrapper = ({
  disabled,
  isDragging,
  onDragHandlePointerDown,
  onToggle,
  renderContent,
  section,
}: SortableSectionWrapperProps) => {
  const effectiveVisible = isDragging ? false : section.visible;

  return (
    <SortableSection
      id={section.id}
      title={section.title}
      visible={effectiveVisible}
      keepAlive={section.keepAlive}
      onToggle={onToggle}
      onDragHandlePointerDown={onDragHandlePointerDown}
      disabled={disabled}
      renderContent={renderContent}
    />
  );
};

interface DraggableTabLayoutProps {
  readonly disabledSectionIds?: ReadonlyArray<string>;
  readonly onReorder: (sections: List<TabSectionLayout>) => void;
  readonly onToggleSection: (sectionId: string) => void;
  readonly renderSection: (section: TabSectionLayout) => ReactNode;
  readonly sections: List<TabSectionLayout>;
}

interface SortableSectionWrapperProps {
  readonly disabled: boolean;
  readonly isDragging: boolean;
  readonly onDragHandlePointerDown: () => void;
  readonly onToggle: () => void;
  readonly renderContent: () => ReactNode;
  readonly section: TabSectionLayout;
}

const reorderSections = (
  sections: List<TabSectionLayout>,
  activeId: string,
  overId: string,
): List<TabSectionLayout> => {
  const currentIndex = sections.findIndex((section) => section.id === activeId);
  const targetIndex = sections.findIndex((section) => section.id === overId);

  if (currentIndex === -1 || targetIndex === -1) {
    return sections;
  }

  if (currentIndex === targetIndex) {
    return sections;
  }

  const items = sections.toArray();
  const [moved] = items.splice(currentIndex, 1);
  items.splice(targetIndex, 0, moved);

  return List<TabSectionLayout>(items)
    .map((section, index) => ({
      ...section,
      order: index,
    }))
    .toList();
};

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

export const DraggableTabLayout = ({
  disabledSectionIds = [],
  onReorder,
  onToggleSection,
  renderSection,
  sections,
}: DraggableTabLayoutProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedSections = useMemo(
    () => sections.toArray(),
    [sections.size, sections.hashCode()],
  );

  const items = useMemo(
    () => orderedSections.map((section) => section.id),
    [orderedSections],
  );

  const disabled = useMemo(
    () => new Set<string>(disabledSectionIds),
    [disabledSectionIds],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setIsDragging(false);

      if (!over || active.id === over.id) {
        return;
      }

      const next = reorderSections(
        sections,
        String(active.id),
        String(over.id),
      );
      onReorder(next);
    },
    [sections, onReorder],
  );

  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const activeSection = useMemo(
    () => (activeId ? orderedSections.find((s) => s.id === activeId) : null),
    [activeId, orderedSections],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {orderedSections.map((section) => (
            <SortableSectionWrapper
              key={section.id}
              section={section}
              isDragging={isDragging}
              disabled={disabled.has(section.id)}
              onToggle={() => onToggleSection(section.id)}
              onDragHandlePointerDown={handlePointerDown}
              renderContent={() => renderSection(section)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeSection ? (
          <div className="bg-card rounded-lg border border-primary p-4 opacity-90 shadow-xl ring-2 ring-primary">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                <GripVertical className="h-4 w-4" />
              </div>
              <span className="text-card-foreground font-semibold">
                {activeSection.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

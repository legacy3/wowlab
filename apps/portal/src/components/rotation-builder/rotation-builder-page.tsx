"use client";

import * as React from "react";
import { useCallback, useMemo, memo, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  RotateCcwIcon,
  DownloadIcon,
  UploadIcon,
  EyeIcon,
  PencilIcon,
  PanelLeftIcon,
  ExpandIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useZenMode } from "@/hooks/use-zen-mode";
import { useJsonExport } from "@/hooks/use-json-export";

import {
  // State atoms
  rotationSpecIdAtom,
  rotationVariablesAtom,
  rotationDefaultListIdAtom,
  selectedListIdAtom,
  viewModeAtom,
  // Derived atoms
  selectedListAtom,
  actionListInfosAtom,
  rotationStatsAtom,
  rotationDataAtom,
  // Action atoms
  setSpecIdAtom,
  setVariablesAtom,
  addActionListAtom,
  renameActionListAtom,
  deleteActionListAtom,
  setDefaultListAtom,
  selectListAtom,
  setActionsForListAtom,
  resetRotationBuilderAtom,
} from "@/atoms/rotation-builder";

import { SpecPicker } from "@/components/ui/spec-picker";
import { RotationSidebar } from "./rotation-sidebar";
import { ActionList } from "./action-editor";
import { RotationPreview } from "./rotation-preview";
import { BM_HUNTER_SPELLS, type SpellInfo } from "./data";
import type { Action, ActionListInfo, Variable, ListType } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Main Component
// =============================================================================

export function RotationBuilderPage() {
  // ---------------------------------------------------------------------------
  // Jotai State
  // ---------------------------------------------------------------------------

  const specId = useAtomValue(rotationSpecIdAtom);
  const variables = useAtomValue(rotationVariablesAtom);
  const defaultListId = useAtomValue(rotationDefaultListIdAtom);
  const selectedListId = useAtomValue(selectedListIdAtom);
  const [viewMode, setViewModeLocal] = useAtom(viewModeAtom);
  const selectedList = useAtomValue(selectedListAtom);
  const actionListInfos = useAtomValue(actionListInfosAtom);
  const stats = useAtomValue(rotationStatsAtom);
  const rotationData = useAtomValue(rotationDataAtom);

  // Action setters
  const setSpecId = useSetAtom(setSpecIdAtom);
  const setVariables = useSetAtom(setVariablesAtom);
  const addList = useSetAtom(addActionListAtom);
  const renameList = useSetAtom(renameActionListAtom);
  const deleteList = useSetAtom(deleteActionListAtom);
  const setDefaultList = useSetAtom(setDefaultListAtom);
  const selectList = useSetAtom(selectListAtom);
  const setActionsForList = useSetAtom(setActionsForListAtom);
  const resetBuilder = useSetAtom(resetRotationBuilderAtom);

  // Local state
  const [showSidebar, setShowSidebar] = useState(true);
  const { isZen, toggleZen } = useZenMode();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSpecChange = useCallback(
    (newSpecId: number) => {
      setSpecId(newSpecId);
    },
    [setSpecId],
  );

  const handleVariablesChange = useCallback(
    (newVariables: Variable[]) => {
      setVariables(newVariables);
    },
    [setVariables],
  );

  const handleSelectList = useCallback(
    (id: string) => {
      selectList(id);
    },
    [selectList],
  );

  const handleAddList = useCallback(
    (list: { name: string; label: string; listType: ListType }) => {
      addList({ name: list.name, label: list.label, listType: list.listType });
    },
    [addList],
  );

  const handleRenameList = useCallback(
    (id: string, label: string) => {
      renameList({ id, label });
    },
    [renameList],
  );

  const handleDeleteList = useCallback(
    (id: string) => {
      deleteList(id);
    },
    [deleteList],
  );

  const handleSetDefaultList = useCallback(
    (id: string) => {
      setDefaultList(id);
    },
    [setDefaultList],
  );

  const handleActionsChange = useCallback(
    (actions: Action[]) => {
      if (!selectedListId) return;
      setActionsForList({ listId: selectedListId, actions });
    },
    [selectedListId, setActionsForList],
  );

  const handleReset = useCallback(() => {
    resetBuilder();
  }, [resetBuilder]);

  // Export hook
  const { downloadJson } = useJsonExport({
    data: rotationData,
    filenamePrefix: "rotation",
    filenameTag: specId?.toString(),
    patchVersion: "11.1",
    label: "rotation",
    resetKey: specId,
  });

  // Memoize spells array to prevent unnecessary re-renders
  const spells = useMemo<SpellInfo[]>(
    () => BM_HUNTER_SPELLS.map((s) => ({ name: s.name, label: s.label })),
    [],
  );

  // Memoize action lists for call_action_list selector (only sub lists can be called)
  const callableActionLists = useMemo(
    () =>
      actionListInfos
        .filter((list) => list.listType === "sub")
        .map((list) => ({ name: list.name, label: list.label })),
    [actionListInfos],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        isZen
          ? "fixed inset-0 z-50 bg-background animate-in fade-in duration-200"
          : "h-[calc(100vh-4rem)]",
      )}
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-2 bg-background shrink-0">
        {/* Left: Sidebar toggle + Title */}
        <div className="flex items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showSidebar ? "secondary" : "ghost"}
                size="icon"
                className="size-7"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <PanelLeftIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showSidebar ? "Hide sidebar" : "Show sidebar"}
            </TooltipContent>
          </Tooltip>

          <h1 className="text-sm font-semibold tracking-tight">
            Rotation Builder
          </h1>
          <Badge
            variant="secondary"
            className="text-[10px] h-5 px-1.5 font-medium"
          >
            Demo
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Center: Spec selector (compact) using existing components */}
        <SpecPicker specId={specId} onSpecSelect={handleSpecChange} compact />

        {/* Stats inline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          <span>{actionListInfos.length} lists</span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            {stats.enabledActions}/{stats.totalActions} actions
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>{variables.length} vars</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: View toggle + actions */}
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 gap-1.5 text-xs px-2.5 rounded-md"
              onClick={() => setViewModeLocal("edit")}
            >
              <PencilIcon className="size-3.5" />
              Edit
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 gap-1.5 text-xs px-2.5 rounded-md"
              onClick={() => setViewModeLocal("preview")}
            >
              <EyeIcon className="size-3.5" />
              Preview
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={downloadJson}
              >
                <DownloadIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" disabled>
                <UploadIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import (coming soon)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleReset}
              >
                <RotateCcwIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isZen ? "secondary" : "ghost"}
                size="icon"
                className="size-7"
                onClick={toggleZen}
              >
                {isZen ? (
                  <XIcon className="size-3.5" />
                ) : (
                  <ExpandIcon className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isZen ? "Exit fullscreen (ESC)" : "Fullscreen"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "edit" ? (
          <>
            {/* Sidebar - toggleable */}
            {showSidebar && (
              <RotationSidebar
                lists={actionListInfos}
                selectedListId={selectedListId}
                onSelectList={handleSelectList}
                onAddList={handleAddList}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
                onSetDefaultList={handleSetDefaultList}
                variables={variables}
                onVariablesChange={handleVariablesChange}
              />
            )}

            {/* Center - Action editor (full width when sidebar hidden) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* List header */}
              <ListHeader
                selectedList={selectedList}
                isDefault={selectedList?.id === defaultListId}
              />

              {/* Actions */}
              <div className="flex-1 overflow-y-auto p-5">
                {selectedList ? (
                  <ActionList
                    actions={selectedList.actions}
                    onChange={handleActionsChange}
                    spells={spells}
                    actionLists={callableActionLists}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-16 text-sm">
                    Select an action list from the sidebar to edit its actions.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Preview mode */
          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-4xl mx-auto">
              <RotationPreview data={rotationData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Memoized Subcomponents
// =============================================================================

interface ListHeaderProps {
  selectedList: { label: string; actions: Action[] } | null;
  isDefault: boolean;
}

const ListHeader = memo(function ListHeader({
  selectedList,
  isDefault,
}: ListHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5 bg-background shrink-0">
      {selectedList ? (
        <>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold">{selectedList.label}</h2>
            {isDefault && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-normal"
              >
                Default
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {selectedList.actions.length} action
            {selectedList.actions.length !== 1 ? "s" : ""}
          </span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">
          Select an action list
        </span>
      )}
    </div>
  );
});

// =============================================================================
// Skeleton for loading state
// =============================================================================

export function RotationBuilderSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <header className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        <Skeleton className="size-7 rounded" />
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-24 rounded-lg" />
      </header>

      {/* Main content skeleton */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-60 border-r bg-muted/30 p-2 space-y-1.5">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        {/* Center */}
        <div className="flex-1 p-5 space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

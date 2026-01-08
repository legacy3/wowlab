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
import type { Action, ActionListInfo, Variable } from "./types";
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
    (list: Omit<ActionListInfo, "id">) => {
      addList({ name: list.name, label: list.label });
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

  const handleExport = useCallback(() => {
    const json = JSON.stringify(rotationData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotation-${specId ?? "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rotationData, specId]);

  // Memoize spells array to prevent unnecessary re-renders
  const spells = useMemo<SpellInfo[]>(
    () => BM_HUNTER_SPELLS.map((s) => ({ name: s.name, label: s.label })),
    [],
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
      {/* Compact Header - spec + stats + actions all in one row */}
      <header className="flex items-center gap-2 border-b px-3 py-1.5 bg-background shrink-0">
        {/* Left: Sidebar toggle + Title */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showSidebar ? "secondary" : "ghost"}
                size="icon"
                className="size-6"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <PanelLeftIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showSidebar ? "Hide sidebar" : "Show sidebar"}
            </TooltipContent>
          </Tooltip>

          <h1 className="text-sm font-semibold">Rotation Builder</h1>
          <Badge variant="secondary" className="text-[10px] h-4 px-1">
            Demo
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Center: Spec selector (compact) using existing components */}
        <SpecPicker specId={specId} onSpecSelect={handleSpecChange} compact />

        {/* Stats inline */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span>{actionListInfos.length} lists</span>
          <span className="opacity-40">·</span>
          <span>
            {stats.enabledActions}/{stats.totalActions} actions
          </span>
          <span className="opacity-40">·</span>
          <span>{variables.length} vars</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: View toggle + actions */}
        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-5 gap-1 text-[10px] px-1.5"
              onClick={() => setViewModeLocal("edit")}
            >
              <PencilIcon className="size-3" />
              Edit
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-5 gap-1 text-[10px] px-1.5"
              onClick={() => setViewModeLocal("preview")}
            >
              <EyeIcon className="size-3" />
              Preview
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleExport}
              >
                <DownloadIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6" disabled>
                <UploadIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import (coming soon)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleReset}
              >
                <RotateCcwIcon className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isZen ? "secondary" : "ghost"}
                size="icon"
                className="size-6"
                onClick={toggleZen}
              >
                {isZen ? (
                  <XIcon className="size-3" />
                ) : (
                  <ExpandIcon className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
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
              <div className="flex-1 overflow-y-auto p-4">
                {selectedList ? (
                  <ActionList
                    actions={selectedList.actions}
                    onChange={handleActionsChange}
                    spells={spells}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-12 text-sm">
                    Select an action list from the sidebar to edit its actions.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Preview mode */
          <div className="flex-1 overflow-y-auto p-4">
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
    <div className="flex items-center justify-between border-b px-4 py-1.5 bg-background shrink-0">
      {selectedList ? (
        <>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">{selectedList.label}</h2>
            {isDefault && (
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                Default
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
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
      <header className="flex items-center gap-2 border-b px-3 py-1.5 shrink-0">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-10 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-5 w-20 rounded" />
      </header>

      {/* Main content skeleton */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-56 border-r bg-muted/30 p-2 space-y-1">
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-full rounded" />
        </div>

        {/* Center */}
        <div className="flex-1 p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

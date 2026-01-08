"use client";

import * as React from "react";
import { useCallback, useMemo, memo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  RotateCcwIcon,
  DownloadIcon,
  UploadIcon,
  EyeIcon,
  PencilIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  // State atoms
  rotationSpecAtom,
  rotationVariablesAtom,
  rotationDefaultListIdAtom,
  selectedListIdAtom,
  viewModeAtom,
  // Derived atoms
  selectedListAtom,
  specNameAtom,
  actionListInfosAtom,
  rotationStatsAtom,
  rotationDataAtom,
  // Action atoms
  setSpecAtom,
  setVariablesAtom,
  addActionListAtom,
  renameActionListAtom,
  deleteActionListAtom,
  setDefaultListAtom,
  selectListAtom,
  setActionsForListAtom,
  setViewModeAtom,
  resetRotationBuilderAtom,
} from "@/atoms/rotation-builder";

import { SpecSelector, type SpecSelectorValue } from "./spec-selector";
import { VariableManager } from "./variable-manager";
import { ActionListPanel } from "./action-list-panel";
import { ActionList } from "./action-editor";
import { RotationPreview } from "./rotation-preview";
import { toFilename } from "./utils";
import { BM_HUNTER_SPELLS, type SpellInfo } from "./data";
import type { Action, ActionListInfo, Variable } from "./types";

// =============================================================================
// Main Component
// =============================================================================

export function RotationBuilderPage() {
  // ---------------------------------------------------------------------------
  // Jotai State
  // ---------------------------------------------------------------------------

  const spec = useAtomValue(rotationSpecAtom);
  const variables = useAtomValue(rotationVariablesAtom);
  const defaultListId = useAtomValue(rotationDefaultListIdAtom);
  const selectedListId = useAtomValue(selectedListIdAtom);
  const [viewMode, setViewModeLocal] = useAtom(viewModeAtom);
  const selectedList = useAtomValue(selectedListAtom);
  const specName = useAtomValue(specNameAtom);
  const actionListInfos = useAtomValue(actionListInfosAtom);
  const stats = useAtomValue(rotationStatsAtom);
  const rotationData = useAtomValue(rotationDataAtom);

  // Action setters
  const setSpec = useSetAtom(setSpecAtom);
  const setVariables = useSetAtom(setVariablesAtom);
  const addList = useSetAtom(addActionListAtom);
  const renameList = useSetAtom(renameActionListAtom);
  const deleteList = useSetAtom(deleteActionListAtom);
  const setDefaultList = useSetAtom(setDefaultListAtom);
  const selectList = useSetAtom(selectListAtom);
  const setActionsForList = useSetAtom(setActionsForListAtom);
  const setViewMode = useSetAtom(setViewModeAtom);
  const resetBuilder = useSetAtom(resetRotationBuilderAtom);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSpecChange = useCallback(
    (newSpec: SpecSelectorValue | null) => {
      setSpec(newSpec);
    },
    [setSpec],
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
    a.download = `${toFilename(specName)}-rotation.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rotationData, specName]);

  // Memoize spells array to prevent unnecessary re-renders
  const spells = useMemo<SpellInfo[]>(
    () => BM_HUNTER_SPELLS.map((s) => ({ name: s.name, label: s.label })),
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewModeLocal}
        onExport={handleExport}
        onReset={handleReset}
      />

      {/* Spec selector */}
      <SpecBar
        spec={spec}
        onSpecChange={handleSpecChange}
        listCount={actionListInfos.length}
        stats={stats}
        variableCount={variables.length}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "edit" ? (
          <>
            {/* Left sidebar - Action lists */}
            <div className="w-56 shrink-0 border-r overflow-y-auto">
              <ActionListPanel
                lists={actionListInfos}
                selectedListId={selectedListId}
                onSelect={handleSelectList}
                onAdd={handleAddList}
                onRename={handleRenameList}
                onDelete={handleDeleteList}
                onSetDefault={handleSetDefaultList}
              />
            </div>

            {/* Center - Action editor */}
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
                  <div className="text-center text-muted-foreground py-12">
                    Select an action list from the sidebar to edit its actions.
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar - Variables */}
            <div className="w-80 shrink-0 border-l overflow-y-auto p-4">
              <VariableManager
                variables={variables}
                onChange={handleVariablesChange}
              />
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

interface HeaderProps {
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  onExport: () => void;
  onReset: () => void;
}

const Header = memo(function Header({
  viewMode,
  onViewModeChange,
  onExport,
  onReset,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3 bg-background shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Rotation Builder</h1>
        <Badge variant="secondary" className="text-xs">
          Demo
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
          <Button
            variant={viewMode === "edit" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => onViewModeChange("edit")}
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => onViewModeChange("preview")}
          >
            <EyeIcon className="size-3.5" />
            Preview
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" onClick={onExport}>
              <DownloadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export rotation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" disabled>
              <UploadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import rotation (coming soon)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" onClick={onReset}>
              <RotateCcwIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset to default</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
});

interface SpecBarProps {
  spec: SpecSelectorValue | null;
  onSpecChange: (spec: SpecSelectorValue | null) => void;
  listCount: number;
  stats: { totalActions: number; enabledActions: number };
  variableCount: number;
}

const SpecBar = memo(function SpecBar({
  spec,
  onSpecChange,
  listCount,
  stats,
  variableCount,
}: SpecBarProps) {
  return (
    <div className="border-b px-4 py-3 bg-muted/20 shrink-0">
      <div className="flex items-center gap-4">
        <SpecSelector value={spec} onChange={onSpecChange} />
        <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
          <span>{listCount} lists</span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            {stats.enabledActions}/{stats.totalActions} actions
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>{variableCount} variables</span>
        </div>
      </div>
    </div>
  );
});

interface ListHeaderProps {
  selectedList: { label: string; actions: Action[] } | null;
  isDefault: boolean;
}

const ListHeader = memo(function ListHeader({
  selectedList,
  isDefault,
}: ListHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3 bg-background shrink-0">
      {selectedList ? (
        <>
          <div className="flex items-center gap-2">
            <h2 className="font-medium">{selectedList.label}</h2>
            {isDefault && (
              <Badge variant="outline" className="text-[10px]">
                Default
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedList.actions.length} action
            {selectedList.actions.length !== 1 ? "s" : ""}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground">Select an action list</span>
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
      <header className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-6 w-36 bg-muted rounded" />
          <div className="h-5 w-12 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </header>

      {/* Spec selector skeleton */}
      <div className="border-b px-4 py-3 bg-muted/20 shrink-0">
        <div className="h-12 w-96 bg-muted rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex">
        {/* Left sidebar */}
        <div className="w-52 border-r bg-muted/30 p-4 space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>

        {/* Center */}
        <div className="flex-1 p-4 space-y-3">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>

        {/* Right sidebar */}
        <div className="w-72 border-l p-4">
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  RotateCcwIcon,
  SaveIcon,
  DownloadIcon,
  UploadIcon,
  SettingsIcon,
  PlayIcon,
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
import { cn } from "@/lib/utils";
import { generateListId } from "@/lib/id";

import {
  SpecSelector,
  type SpecSelectorValue,
} from "./spec-selector";
import { VariableManager } from "./variable-manager";
import { ActionListPanel } from "./action-list-panel";
import { ActionList, createAction } from "./action-editor";
import { RotationPreview } from "./rotation-preview";
import type {
  Action,
  ActionListInfo,
  ActionListWithActions,
  RotationData,
  Variable,
} from "./types";
import { BM_HUNTER_SPELLS } from "./data";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RotationState {
  spec: SpecSelectorValue | null;
  variables: Variable[];
  actionLists: ActionListWithActions[];
  defaultListId: string;
}

function createInitialState(): RotationState {
  const defaultListId = "list-default";

  return {
    spec: {
      class: "hunter",
      spec: {
        class: "hunter",
        spec: "beast-mastery",
        label: "Beast Mastery",
      },
    },
    variables: [
      {
        id: "var-1",
        name: "burst_phase",
        expression: "aura.bloodlust.up | aura.bestial_wrath.up",
      },
      {
        id: "var-2",
        name: "pooling",
        expression: "cooldown.bestial_wrath.remains < 3",
      },
    ],
    actionLists: [
      {
        id: defaultListId,
        name: "default",
        label: "Default",
        isDefault: true,
        actions: [
          createAction("bestial_wrath", {
            conditions: { combinator: "and", rules: [] },
          }),
          createAction("kill_command", {
            conditions: {
              combinator: "and",
              rules: [{ field: "focus", operator: ">=", value: "30" }],
            },
          }),
          createAction("barbed_shot", {
            conditions: {
              combinator: "and",
              rules: [{ field: "charges", operator: ">=", value: "1" }],
            },
          }),
          createAction("cobra_shot", {
            conditions: {
              combinator: "and",
              rules: [{ field: "focus", operator: ">=", value: "35" }],
            },
          }),
        ],
      },
      {
        id: "list-cooldowns",
        name: "cooldowns",
        label: "Cooldowns",
        actions: [
          createAction("call_of_the_wild", {
            conditions: {
              combinator: "and",
              rules: [
                { field: "aura_active", operator: "=", value: "bestial_wrath" },
              ],
            },
          }),
          createAction("bloodshed"),
        ],
      },
      {
        id: "list-aoe",
        name: "aoe",
        label: "AoE",
        actions: [
          createAction("multi_shot", {
            conditions: {
              combinator: "and",
              rules: [
                { field: "aura_remaining", operator: "<", value: "2" },
              ],
            },
          }),
        ],
      },
    ],
    defaultListId,
  };
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

type ViewMode = "edit" | "preview";

export function RotationBuilderPage() {
  const [state, setState] = useState<RotationState>(createInitialState);
  const [selectedListId, setSelectedListId] = useState<string | null>(
    state.actionLists[0]?.id ?? null
  );
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  // -----------------------------------------------------------------------------
  // Computed Values
  // -----------------------------------------------------------------------------

  const selectedList = useMemo(
    () => state.actionLists.find((l) => l.id === selectedListId) ?? null,
    [state.actionLists, selectedListId]
  );

  const specName = useMemo(() => {
    if (!state.spec) return "Rotation";
    return `${state.spec.spec.label} ${
      state.spec.class.charAt(0).toUpperCase() + state.spec.class.slice(1)
    }`;
  }, [state.spec]);

  const actionListInfos = useMemo<ActionListInfo[]>(
    () =>
      state.actionLists.map((list) => ({
        id: list.id,
        name: list.name,
        label: list.label,
        isDefault: list.id === state.defaultListId,
      })),
    [state.actionLists, state.defaultListId]
  );

  const rotationData = useMemo<RotationData>(
    () => ({
      specName,
      variables: state.variables,
      defaultList:
        state.actionLists.find((l) => l.id === state.defaultListId)?.name ??
        "default",
      actionLists: state.actionLists.map((list) => ({
        id: list.id,
        name: list.name,
        label: list.label,
        actions: list.actions,
      })),
    }),
    [specName, state.variables, state.actionLists, state.defaultListId]
  );

  // -----------------------------------------------------------------------------
  // Handlers: Spec
  // -----------------------------------------------------------------------------

  const handleSpecChange = useCallback((spec: SpecSelectorValue | null) => {
    setState((prev) => ({ ...prev, spec }));
  }, []);

  // -----------------------------------------------------------------------------
  // Handlers: Variables
  // -----------------------------------------------------------------------------

  const handleVariablesChange = useCallback((variables: Variable[]) => {
    setState((prev) => ({ ...prev, variables }));
  }, []);

  // -----------------------------------------------------------------------------
  // Handlers: Action Lists
  // -----------------------------------------------------------------------------

  const handleSelectList = useCallback((id: string) => {
    setSelectedListId(id);
  }, []);

  const handleAddList = useCallback(
    (list: Omit<ActionListInfo, "id">) => {
      const newList: ActionListWithActions = {
        id: generateListId(),
        name: list.name,
        label: list.label,
        actions: [],
      };
      setState((prev) => ({
        ...prev,
        actionLists: [...prev.actionLists, newList],
      }));
      setSelectedListId(newList.id);
    },
    []
  );

  const handleRenameList = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      actionLists: prev.actionLists.map((list) =>
        list.id === id ? { ...list, label } : list
      ),
    }));
  }, []);

  const handleDeleteList = useCallback(
    (id: string) => {
      setState((prev) => {
        const newLists = prev.actionLists.filter((l) => l.id !== id);
        return { ...prev, actionLists: newLists };
      });
      if (selectedListId === id) {
        setSelectedListId(state.actionLists[0]?.id ?? null);
      }
    },
    [selectedListId, state.actionLists]
  );

  const handleSetDefaultList = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      defaultListId: id,
      actionLists: prev.actionLists.map((list) => ({
        ...list,
        isDefault: list.id === id,
      })),
    }));
  }, []);

  // -----------------------------------------------------------------------------
  // Handlers: Actions
  // -----------------------------------------------------------------------------

  const handleActionsChange = useCallback(
    (actions: Action[]) => {
      if (!selectedListId) return;
      setState((prev) => ({
        ...prev,
        actionLists: prev.actionLists.map((list) =>
          list.id === selectedListId ? { ...list, actions } : list
        ),
      }));
    },
    [selectedListId]
  );

  // -----------------------------------------------------------------------------
  // Handlers: Toolbar
  // -----------------------------------------------------------------------------

  const handleReset = useCallback(() => {
    const initial = createInitialState();
    setState(initial);
    setSelectedListId(initial.actionLists[0]?.id ?? null);
  }, []);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(rotationData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${specName.toLowerCase().replace(/\s+/g, "-")}-rotation.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rotationData, specName]);

  // -----------------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------------

  const stats = useMemo(() => {
    const totalActions = state.actionLists.reduce(
      (sum, list) => sum + list.actions.length,
      0
    );
    const enabledActions = state.actionLists.reduce(
      (sum, list) => sum + list.actions.filter((a) => a.enabled).length,
      0
    );
    return { totalActions, enabledActions };
  }, [state.actionLists]);

  // -----------------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
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
              onClick={() => setViewMode("edit")}
            >
              <PencilIcon className="size-3.5" />
              Edit
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5"
              onClick={() => setViewMode("preview")}
            >
              <EyeIcon className="size-3.5" />
              Preview
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" onClick={handleExport}>
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
              <Button variant="outline" size="icon-sm" onClick={handleReset}>
                <RotateCcwIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to default</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Spec selector */}
      <div className="border-b px-4 py-3 bg-muted/20 shrink-0">
        <div className="flex items-center gap-4">
          <SpecSelector value={state.spec} onChange={handleSpecChange} />
          <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
            <span>
              {state.actionLists.length} lists
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>
              {stats.enabledActions}/{stats.totalActions} actions
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>
              {state.variables.length} variables
            </span>
          </div>
        </div>
      </div>

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
              <div className="flex items-center justify-between border-b px-4 py-3 bg-background shrink-0">
                {selectedList ? (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium">{selectedList.label}</h2>
                      {selectedList.id === state.defaultListId && (
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
                  <span className="text-muted-foreground">
                    Select an action list
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedList ? (
                  <ActionList
                    actions={selectedList.actions}
                    onChange={handleActionsChange}
                    spells={BM_HUNTER_SPELLS as unknown as Array<{ name: string; label: string }>}
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
                variables={state.variables}
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

// -----------------------------------------------------------------------------
// Skeleton for loading state
// -----------------------------------------------------------------------------

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

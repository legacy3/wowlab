"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PanelLeftIcon,
  ExpandIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SpecPicker } from "@/components/ui/spec-picker";
import { useZenMode } from "@/hooks/use-zen-mode";
import { cn } from "@/lib/utils";

import {
  rotationDraftAtom,
  viewModeAtom,
  sidebarCollapsedAtom,
  statsAtom,
  selectedListAtom,
  listInfosAtom,
  callableListsAtom,
  initRotationAtom,
  initNewRotationAtom,
  setSpecIdAtom,
  setViewModeAtom,
  toggleSidebarAtom,
  addListAtom,
  updateListAtom,
  deleteListAtom,
  setDefaultListAtom,
  selectListAtom,
  reorderActionsAtom,
  addVariableAtom,
  updateVariableAtom,
  deleteVariableAtom,
} from "@/atoms/rotation-editor";

import { ActionListManager } from "./action-list-manager";
import { ActionEditor } from "./action-editor";
import { RotationPreview } from "./rotation-preview";
import { BM_HUNTER_ALLOWED_SPELLS } from "./data";
import type { Rotation, RotationDraft } from "./types";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface RotationEditorProps {
  /** Existing rotation to edit (null for new) */
  rotation: Rotation | null;
  /** Spec ID for new rotations */
  specId?: number;
  /** Called when saving */
  onSave: (draft: RotationDraft) => Promise<void>;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function RotationEditor({
  rotation,
  specId,
  onSave,
}: RotationEditorProps) {
  // State
  const draft = useAtomValue(rotationDraftAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const sidebarCollapsed = useAtomValue(sidebarCollapsedAtom);
  const stats = useAtomValue(statsAtom);
  const selectedList = useAtomValue(selectedListAtom);
  const listInfos = useAtomValue(listInfosAtom);
  const callableLists = useAtomValue(callableListsAtom);

  // Actions
  const initRotation = useSetAtom(initRotationAtom);
  const initNewRotation = useSetAtom(initNewRotationAtom);
  const setSpec = useSetAtom(setSpecIdAtom);
  const setViewMode = useSetAtom(setViewModeAtom);
  const toggleSidebar = useSetAtom(toggleSidebarAtom);
  const addList = useSetAtom(addListAtom);
  const updateList = useSetAtom(updateListAtom);
  const deleteList = useSetAtom(deleteListAtom);
  const setDefaultList = useSetAtom(setDefaultListAtom);
  const selectList = useSetAtom(selectListAtom);
  const reorderActions = useSetAtom(reorderActionsAtom);
  const addVariable = useSetAtom(addVariableAtom);
  const updateVariable = useSetAtom(updateVariableAtom);
  const deleteVariable = useSetAtom(deleteVariableAtom);

  // Zen mode
  const { isZen, toggleZen } = useZenMode();

  // Initialize on mount
  useEffect(() => {
    if (rotation) {
      initRotation(rotation);
    } else if (specId) {
      initNewRotation(specId);
    } else {
      // Default to spec 253 (BM Hunter) if nothing specified
      initNewRotation(253);
    }
  }, [rotation, specId, initRotation, initNewRotation]);

  if (!draft) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        isZen ? "fixed inset-0 z-50 bg-background" : "h-[calc(100vh-4rem)]",
      )}
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        {/* Left: Sidebar toggle + title */}
        <div className="flex items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={sidebarCollapsed ? "ghost" : "secondary"}
                size="icon"
                className="size-7"
                onClick={() => toggleSidebar()}
              >
                <PanelLeftIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            </TooltipContent>
          </Tooltip>

          <h1 className="text-sm font-semibold">Rotation Editor</h1>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Spec picker */}
        <SpecPicker
          specId={draft.specId}
          onSpecSelect={(newSpecId) => setSpec(newSpecId)}
          compact
        />

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          <span>{stats.lists} lists</span>
          <span className="text-muted-foreground/40">-</span>
          <span>{stats.actions} actions</span>
          <span className="text-muted-foreground/40">-</span>
          <span>{stats.variables} vars</span>
        </div>

        <div className="flex-1" />

        {/* Right: View toggle + actions */}
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 gap-1.5 text-xs px-2.5"
              onClick={() => setViewMode("edit")}
            >
              <PencilIcon className="size-3.5" />
              Edit
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 gap-1.5 text-xs px-2.5"
              onClick={() => setViewMode("preview")}
            >
              <EyeIcon className="size-3.5" />
              Preview
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <DownloadIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export</TooltipContent>
          </Tooltip>

          {/* Zen mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isZen ? "secondary" : "ghost"}
                size="icon"
                className="size-7"
                onClick={toggleZen}
              >
                <ExpandIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isZen ? "Exit fullscreen" : "Fullscreen"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "edit" ? (
          <>
            {/* Sidebar */}
            {!sidebarCollapsed && (
              <ActionListManager
                lists={listInfos}
                selectedListId={selectedList?.id ?? null}
                variables={draft.variables}
                onSelectList={selectList}
                onAddList={addList}
                onUpdateList={updateList}
                onDeleteList={deleteList}
                onSetDefaultList={setDefaultList}
                onAddVariable={addVariable}
                onUpdateVariable={updateVariable}
                onDeleteVariable={deleteVariable}
              />
            )}

            {/* Action editor */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {selectedList ? (
                <ActionEditor
                  list={selectedList}
                  callableLists={callableLists}
                  allowedSpells={BM_HUNTER_ALLOWED_SPELLS}
                  onActionsChange={(actions) =>
                    reorderActions({ listId: selectedList.id, actions })
                  }
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a list from the sidebar
                </div>
              )}
            </div>
          </>
        ) : (
          /* Preview mode */
          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-4xl mx-auto">
              <RotationPreview draft={draft} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

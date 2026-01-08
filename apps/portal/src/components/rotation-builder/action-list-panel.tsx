"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import {
  GripVerticalIcon,
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  CheckIcon,
  XIcon,
  ListIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ActionListInfo } from "./types";
import { toInternalName } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ActionListPanelProps {
  lists: ActionListInfo[];
  selectedListId: string | null;
  onSelect: (id: string) => void;
  onAdd: (list: Omit<ActionListInfo, "id">) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

// -----------------------------------------------------------------------------
// Predefined List Templates
// -----------------------------------------------------------------------------

export const ACTION_LIST_TEMPLATES = [
  { name: "default", label: "Default" },
  { name: "precombat", label: "Precombat" },
  { name: "cooldowns", label: "Cooldowns" },
  { name: "aoe", label: "AoE" },
  { name: "st", label: "Single Target" },
  { name: "cleave", label: "Cleave" },
] as const;

export type ActionListTemplateName =
  (typeof ACTION_LIST_TEMPLATES)[number]["name"];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getTemplateByName(name: string) {
  return ACTION_LIST_TEMPLATES.find((t) => t.name === name);
}

// -----------------------------------------------------------------------------
// Action List Item Component
// -----------------------------------------------------------------------------

interface ActionListItemProps {
  list: ActionListInfo;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function ActionListItem({
  list,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onSetDefault,
}: ActionListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(list.label);

  const handleStartEdit = useCallback(() => {
    setEditValue(list.label);
    setIsEditing(true);
  }, [list.label]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== list.label) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, list.label, onRename]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(list.label);
    setIsEditing(false);
  }, [list.label]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={isEditing ? undefined : onSelect}
          onKeyDown={
            isEditing
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelect();
                  }
                }
          }
          className={cn(
            "group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors cursor-pointer",
            "hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-accent text-accent-foreground",
            !isSelected && "text-muted-foreground",
          )}
        >
          {/* Drag handle placeholder */}
          <div
            className={cn(
              "cursor-grab text-muted-foreground/50 opacity-0 transition-opacity",
              "group-hover:opacity-100",
              isSelected && "opacity-100",
            )}
          >
            <GripVerticalIcon className="size-4" />
          </div>

          {/* List icon */}
          <ListIcon className="size-4 shrink-0" />

          {/* Label or edit input */}
          {isEditing ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                className="h-7 flex-1 text-sm"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleSaveEdit}
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleCancelEdit}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex-1 truncate font-medium">{list.label}</span>

              {/* Default badge */}
              {list.isDefault && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="h-5 gap-1 px-1.5 text-[10px]"
                    >
                      <StarIcon className="size-3 fill-current" />
                      Default
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    This is the default action list
                  </TooltipContent>
                </Tooltip>
              )}

              {/* More menu button - visible on hover */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-6 opacity-0 transition-opacity",
                  "group-hover:opacity-100",
                  isSelected && "opacity-100",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  // The context menu handles this
                }}
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleStartEdit}>
          <PencilIcon className="mr-2 size-4" />
          Rename
        </ContextMenuItem>
        {!list.isDefault && (
          <ContextMenuItem onClick={onSetDefault}>
            <StarIcon className="mr-2 size-4" />
            Set as Default
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={onDelete}
          disabled={list.isDefault}
        >
          <TrashIcon className="mr-2 size-4" />
          Delete
          {list.isDefault && (
            <span className="ml-auto text-xs text-muted-foreground">
              (default)
            </span>
          )}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// -----------------------------------------------------------------------------
// Add List Dialog Component
// -----------------------------------------------------------------------------

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onAdd: (list: Omit<ActionListInfo, "id">) => void;
}

function AddListDialog({
  open,
  onOpenChange,
  existingNames,
  onAdd,
}: AddListDialogProps) {
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const availableTemplates = ACTION_LIST_TEMPLATES.filter(
    (t) => !existingNames.includes(t.name),
  );

  const handleSubmit = useCallback(() => {
    if (mode === "template" && selectedTemplate) {
      const template = getTemplateByName(selectedTemplate);
      if (template) {
        onAdd({
          name: template.name,
          label: template.label,
        });
      }
    } else if (mode === "custom" && customLabel.trim()) {
      const name = customName.trim() || toInternalName(customLabel);
      onAdd({
        name,
        label: customLabel.trim(),
      });
    }
    // Reset form
    setSelectedTemplate("");
    setCustomName("");
    setCustomLabel("");
    onOpenChange(false);
  }, [mode, selectedTemplate, customName, customLabel, onAdd, onOpenChange]);

  const isValid =
    (mode === "template" && selectedTemplate) ||
    (mode === "custom" && customLabel.trim());

  // Reset mode when dialog opens
  React.useEffect(() => {
    if (open) {
      setMode(availableTemplates.length > 0 ? "template" : "custom");
      setSelectedTemplate("");
      setCustomName("");
      setCustomLabel("");
    }
  }, [open, availableTemplates.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Action List</DialogTitle>
          <DialogDescription>
            Choose a predefined template or create a custom action list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === "template" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("template")}
              disabled={availableTemplates.length === 0}
              className="flex-1"
            >
              From Template
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("custom")}
              className="flex-1"
            >
              Custom
            </Button>
          </div>

          {mode === "template" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              {availableTemplates.length > 0 ? (
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All templates have been used. Create a custom list instead.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g., Burst Phase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Internal Name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={
                    customLabel
                      ? toInternalName(customLabel)
                      : "e.g., burst_phase"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Used in SimC exports. Auto-generated from display name if left
                  empty.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Add List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------
// Delete Confirmation Dialog
// -----------------------------------------------------------------------------

interface DeleteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listLabel: string;
  onConfirm: () => void;
}

function DeleteListDialog({
  open,
  onOpenChange,
  listLabel,
  onConfirm,
}: DeleteListDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Action List</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{listLabel}&rdquo;? This will
            remove all actions in this list. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// -----------------------------------------------------------------------------
// Main ActionListPanel Component
// -----------------------------------------------------------------------------

export function ActionListPanel({
  lists,
  selectedListId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onSetDefault,
}: ActionListPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    listId: string;
    listLabel: string;
  }>({ open: false, listId: "", listLabel: "" });

  const handleDeleteClick = useCallback((list: ActionListInfo) => {
    setDeleteDialog({
      open: true,
      listId: list.id,
      listLabel: list.label,
    });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(deleteDialog.listId);
    setDeleteDialog({ open: false, listId: "", listLabel: "" });
  }, [deleteDialog.listId, onDelete]);

  const existingNames = lists.map((l) => l.name);

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Action Lists</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setAddDialogOpen(true)}
            >
              <PlusIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add action list</TooltipContent>
        </Tooltip>
      </div>

      {/* List items */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {lists.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No action lists yet.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <PlusIcon className="mr-1 size-3" />
                Add your first list
              </Button>
            </div>
          ) : (
            lists.map((list) => (
              <ActionListItem
                key={list.id}
                list={list}
                isSelected={list.id === selectedListId}
                onSelect={() => onSelect(list.id)}
                onRename={(label) => onRename(list.id, label)}
                onDelete={() => handleDeleteClick(list)}
                onSetDefault={() => onSetDefault(list.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with count */}
      {lists.length > 0 && (
        <>
          <Separator />
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {lists.length} list{lists.length !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}

      {/* Dialogs */}
      <AddListDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        existingNames={existingNames}
        onAdd={onAdd}
      />
      <DeleteListDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        listLabel={deleteDialog.listLabel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { ActionListInfo } from "./types";

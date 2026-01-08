"use client";

import * as React from "react";
import { useState, useCallback, memo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  VariableIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { generateVariableId } from "@/lib/id";

import type { ActionListInfo, Variable } from "./types";
import { toInternalName } from "./utils";
import { useVariableValidation } from "./hooks";

// =============================================================================
// Types
// =============================================================================

type TabId = "lists" | "variables";

const SIDEBAR_TABS = [
  { id: "lists" as const, icon: ListIcon, label: "Action Lists" },
  { id: "variables" as const, icon: VariableIcon, label: "Variables" },
];

export interface RotationSidebarProps {
  // Action lists
  lists: ActionListInfo[];
  selectedListId: string | null;
  onSelectList: (id: string) => void;
  onAddList: (list: Omit<ActionListInfo, "id">) => void;
  onRenameList: (id: string, label: string) => void;
  onDeleteList: (id: string) => void;
  onSetDefaultList: (id: string) => void;
  // Variables
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
  // Sidebar state
  defaultTab?: TabId;
}

// =============================================================================
// Action List Templates
// =============================================================================

const ACTION_LIST_TEMPLATES = [
  { name: "default", label: "Default" },
  { name: "precombat", label: "Precombat" },
  { name: "cooldowns", label: "Cooldowns" },
  { name: "aoe", label: "AoE" },
  { name: "st", label: "Single Target" },
  { name: "cleave", label: "Cleave" },
] as const;

// =============================================================================
// Action List Item
// =============================================================================

interface ListItemProps {
  list: ActionListInfo;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

const ListItem = memo(function ListItem({
  list,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onSetDefault,
}: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(list.label);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== list.label) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, list.label, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      else if (e.key === "Escape") setIsEditing(false);
    },
    [handleSave],
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-1 py-0.5">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 text-xs flex-1"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          onClick={handleSave}
        >
          <CheckIcon className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          onClick={() => setIsEditing(false)}
        >
          <XIcon className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect();
          }}
          className={cn(
            "group flex items-center gap-1.5 rounded px-1.5 py-1 text-xs cursor-pointer transition-colors",
            "hover:bg-accent",
            isSelected && "bg-accent",
          )}
        >
          <GripVerticalIcon className="size-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
          <ListIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{list.label}</span>
          {list.isDefault && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              Default
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-5 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontalIcon className="size-3" />
          </Button>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem
          onClick={() => {
            setEditValue(list.label);
            setIsEditing(true);
          }}
        >
          <PencilIcon className="mr-2 size-3" />
          Rename
        </ContextMenuItem>
        {!list.isDefault && (
          <ContextMenuItem onClick={onSetDefault}>
            <StarIcon className="mr-2 size-3" />
            Set as Default
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={onDelete}
          disabled={list.isDefault}
        >
          <TrashIcon className="mr-2 size-3" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

// =============================================================================
// Variable Item
// =============================================================================

interface VariableItemProps {
  variable: Variable;
  onUpdate: (updates: { name: string; expression: string }) => void;
  onDelete: () => void;
  existingNames: string[];
}

const VariableItem = memo(function VariableItem({
  variable,
  onUpdate,
  onDelete,
  existingNames,
}: VariableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(variable.name);
  const [editExpr, setEditExpr] = useState(variable.expression);

  const { validate } = useVariableValidation({
    existingNames,
    currentName: variable.name,
  });

  const handleSave = useCallback(() => {
    const error = validate(editName, editExpr);
    if (error) return;
    onUpdate({ name: editName.trim(), expression: editExpr.trim() });
    setIsEditing(false);
  }, [editName, editExpr, validate, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [handleSave],
  );

  if (isEditing) {
    return (
      <div className="rounded border bg-muted/30 p-2 space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">$</span>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="name"
            className="h-6 text-xs font-mono flex-1"
            autoFocus
          />
        </div>
        <Input
          value={editExpr}
          onChange={(e) => setEditExpr(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="expression"
          className="h-6 text-xs font-mono"
        />
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="h-5 px-2 text-xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5 rounded px-1.5 py-1 text-xs hover:bg-muted/50 transition-colors">
      <VariableIcon className="size-3 text-muted-foreground shrink-0" />
      <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono">
        ${variable.name}
      </Badge>
      <span className="text-muted-foreground">=</span>
      <code className="flex-1 truncate text-[10px] text-foreground/70">
        {variable.expression}
      </code>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          onClick={() => {
            setEditName(variable.name);
            setEditExpr(variable.expression);
            setIsEditing(true);
          }}
        >
          <PencilIcon className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <TrashIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
});

// =============================================================================
// Add List Dialog
// =============================================================================

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
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const availableTemplates = ACTION_LIST_TEMPLATES.filter(
    (t) => !existingNames.includes(t.name),
  );

  const handleSubmit = useCallback(() => {
    if (mode === "template" && selectedTemplate) {
      const template = ACTION_LIST_TEMPLATES.find(
        (t) => t.name === selectedTemplate,
      );
      if (template) {
        onAdd({ name: template.name, label: template.label });
      }
    } else if (mode === "custom" && customLabel.trim()) {
      onAdd({
        name: toInternalName(customLabel),
        label: customLabel.trim(),
      });
    }
    setSelectedTemplate("");
    setCustomLabel("");
    onOpenChange(false);
  }, [mode, selectedTemplate, customLabel, onAdd, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setMode(availableTemplates.length > 0 ? "template" : "custom");
      setSelectedTemplate("");
      setCustomLabel("");
    }
  }, [open, availableTemplates.length]);

  const isValid =
    (mode === "template" && selectedTemplate) ||
    (mode === "custom" && customLabel.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add Action List</DialogTitle>
          <DialogDescription className="text-xs">
            Choose a template or create a custom list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex gap-1">
            <Button
              variant={mode === "template" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setMode("template")}
              disabled={availableTemplates.length === 0}
            >
              Template
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setMode("custom")}
            >
              Custom
            </Button>
          </div>
          {mode === "template" ? (
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((t) => (
                  <SelectItem key={t.name} value={t.name} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="List name..."
              className="h-8 text-xs"
            />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Collapsed Sidebar
// =============================================================================

interface CollapsedSidebarProps {
  activeTab: TabId;
  listCount: number;
  variableCount: number;
  onTabClick: (tab: TabId) => void;
  onExpand: () => void;
}

function CollapsedSidebar({
  activeTab,
  listCount,
  variableCount,
  onTabClick,
  onExpand,
}: CollapsedSidebarProps) {
  return (
    <div className="flex flex-col items-center py-2 border-r bg-muted/30 w-10">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 mb-2"
        onClick={onExpand}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
      <div className="flex flex-col gap-1">
        {SIDEBAR_TABS.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                size="icon"
                className="size-7 relative"
                onClick={() => onTabClick(tab.id)}
              >
                <tab.icon className="size-3.5" />
                <span className="absolute -top-1 -right-1 text-[9px] text-muted-foreground tabular-nums">
                  {tab.id === "lists" ? listCount : variableCount}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {tab.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Sidebar Component
// =============================================================================

export function RotationSidebar({
  lists,
  selectedListId,
  onSelectList,
  onAddList,
  onRenameList,
  onDeleteList,
  onSetDefaultList,
  variables,
  onVariablesChange,
  defaultTab = "lists",
}: RotationSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [addListOpen, setAddListOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: "", label: "" });
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarExpr, setNewVarExpr] = useState("");

  const existingListNames = lists.map((l) => l.name);
  const existingVarNames = variables.map((v) => v.name);

  const handleAddVariable = useCallback(() => {
    if (!newVarName.trim() || !newVarExpr.trim()) return;
    onVariablesChange([
      ...variables,
      {
        id: generateVariableId(),
        name: newVarName.trim(),
        expression: newVarExpr.trim(),
      },
    ]);
    setNewVarName("");
    setNewVarExpr("");
    setIsAddingVariable(false);
  }, [newVarName, newVarExpr, variables, onVariablesChange]);

  const handleUpdateVariable = useCallback(
    (id: string, updates: { name: string; expression: string }) => {
      onVariablesChange(
        variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      );
    },
    [variables, onVariablesChange],
  );

  const handleDeleteVariable = useCallback(
    (id: string) => {
      onVariablesChange(variables.filter((v) => v.id !== id));
    },
    [variables, onVariablesChange],
  );

  if (collapsed) {
    return (
      <CollapsedSidebar
        activeTab={activeTab}
        listCount={lists.length}
        variableCount={variables.length}
        onTabClick={(tab) => {
          setActiveTab(tab);
          setCollapsed(false);
        }}
        onExpand={() => setCollapsed(false)}
      />
    );
  }

  return (
    <div className="flex flex-col border-r bg-muted/30 w-56 h-full overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b px-1.5 py-1 shrink-0">
          <TabsList className="h-7 bg-transparent p-0 gap-0.5">
            {SIDEBAR_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-6 px-2 text-xs data-[state=active]:bg-background gap-1"
              >
                <tab.icon className="size-3" />
                <span className="hidden sm:inline">
                  {tab.id === "lists" ? "Lists" : "Vars"}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {tab.id === "lists" ? lists.length : variables.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
        </div>

        {/* Lists Tab */}
        <TabsContent
          value="lists"
          className="flex-1 mt-0 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-2 py-1.5 border-b">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Action Lists
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() => setAddListOpen(true)}
            >
              <PlusIcon className="size-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {lists.map((list) => (
                <ListItem
                  key={list.id}
                  list={list}
                  isSelected={list.id === selectedListId}
                  onSelect={() => onSelectList(list.id)}
                  onRename={(label) => onRenameList(list.id, label)}
                  onDelete={() =>
                    setDeleteDialog({
                      open: true,
                      id: list.id,
                      label: list.label,
                    })
                  }
                  onSetDefault={() => onSetDefaultList(list.id)}
                />
              ))}
              {lists.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <p>No lists yet.</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-5 text-xs"
                    onClick={() => setAddListOpen(true)}
                  >
                    Add first list
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent
          value="variables"
          className="flex-1 mt-0 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-2 py-1.5 border-b">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Variables
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() => setIsAddingVariable(true)}
              disabled={isAddingVariable}
            >
              <PlusIcon className="size-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {isAddingVariable && (
                <div className="rounded border bg-muted/30 p-2 space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">$</span>
                    <Input
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      placeholder="name"
                      className="h-6 text-xs font-mono flex-1"
                      autoFocus
                    />
                  </div>
                  <Input
                    value={newVarExpr}
                    onChange={(e) => setNewVarExpr(e.target.value)}
                    placeholder="expression"
                    className="h-6 text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddVariable();
                      else if (e.key === "Escape") setIsAddingVariable(false);
                    }}
                  />
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => setIsAddingVariable(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={handleAddVariable}
                      disabled={!newVarName.trim() || !newVarExpr.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              {variables.map((variable) => (
                <VariableItem
                  key={variable.id}
                  variable={variable}
                  onUpdate={(updates) =>
                    handleUpdateVariable(variable.id, updates)
                  }
                  onDelete={() => handleDeleteVariable(variable.id)}
                  existingNames={existingVarNames}
                />
              ))}
              {variables.length === 0 && !isAddingVariable && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <p>No variables yet.</p>
                  <p className="text-[10px] mt-1">
                    Use <code className="bg-muted px-1 rounded">$name</code> in
                    conditions
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddListDialog
        open={addListOpen}
        onOpenChange={setAddListOpen}
        existingNames={existingListNames}
        onAdd={onAddList}
      />
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action List</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleteDialog.label}&rdquo;? This removes all
              actions in this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteList(deleteDialog.id);
                setDeleteDialog({ open: false, id: "", label: "" });
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

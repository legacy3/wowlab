"use client";

import { useState, useCallback, memo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  ListIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  VariableIcon,
  CheckIcon,
  XIcon,
  ZapIcon,
  ListTreeIcon,
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
import { cn } from "@/lib/utils";

import { VariableEditor } from "./variable-editor";
import type { Variable, ListType, ListInfo } from "./types";
import { toInternalName } from "./utils";

// =============================================================================
// Helpers
// =============================================================================

function generateDefaultListName(existingNames: string[]): string {
  const baseName = "New List";
  if (!existingNames.includes(toInternalName(baseName))) {
    return baseName;
  }
  let counter = 2;
  while (existingNames.includes(toInternalName(`${baseName} ${counter}`))) {
    counter++;
  }
  return `${baseName} ${counter}`;
}

// =============================================================================
// Types
// =============================================================================

type TabId = "lists" | "variables";

const SIDEBAR_TABS = [
  { id: "lists" as const, icon: ListIcon, label: "Action Lists" },
  { id: "variables" as const, icon: VariableIcon, label: "Variables" },
];

interface ActionListManagerProps {
  lists: ListInfo[];
  selectedListId: string | null;
  variables: Variable[];
  onSelectList: (id: string | null) => void;
  onAddList: (input: {
    name: string;
    label: string;
    listType: ListType;
  }) => void;
  onUpdateList: (input: { id: string; updates: { label?: string } }) => void;
  onDeleteList: (id: string) => void;
  onSetDefaultList: (id: string) => void;
  onAddVariable: (input: Omit<Variable, "id">) => void;
  onUpdateVariable: (input: {
    id: string;
    updates: Partial<Omit<Variable, "id">>;
  }) => void;
  onDeleteVariable: (id: string) => void;
}

// =============================================================================
// List Item
// =============================================================================

interface ListItemProps {
  list: ListInfo;
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

  const handleStartEdit = useCallback(() => {
    setEditValue(list.label);
    setIsEditing(true);
  }, [list.label]);

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
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 text-sm flex-1"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleSave}
        >
          <CheckIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setIsEditing(false)}
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
    );
  }

  const listType = list.listType ?? "sub";
  const ListTypeIcon =
    listType === "precombat"
      ? ZapIcon
      : listType === "main"
        ? PlayIcon
        : ListTreeIcon;
  const listTypeColor =
    listType === "precombat"
      ? "text-amber-500"
      : listType === "main"
        ? "text-green-500"
        : "text-muted-foreground";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onDoubleClick={handleStartEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect();
            if (e.key === "F2") handleStartEdit();
          }}
          className={cn(
            "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
            "hover:bg-accent",
            isSelected && "bg-accent",
          )}
        >
          <GripVerticalIcon className="size-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
          <ListTypeIcon className={cn("size-4 shrink-0", listTypeColor)} />
          <span className="flex-1 truncate font-medium">{list.label}</span>
          {listType === "precombat" && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] border-amber-500/40 text-amber-500 font-medium"
            >
              Pre
            </Badge>
          )}
          {listType === "main" && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] border-green-500/40 text-green-500 font-medium"
            >
              Main
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {list.actionCount}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem onClick={handleStartEdit}>
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
          className="text-destructive focus:text-destructive"
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
  onClick: () => void;
}

const VariableItem = memo(function VariableItem({
  variable,
  onClick,
}: VariableItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent cursor-pointer transition-colors"
    >
      <VariableIcon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[11px] font-mono shrink-0"
          >
            ${variable.name}
          </Badge>
        </div>
        <code className="block truncate text-xs text-muted-foreground font-mono mt-0.5">
          {variable.expression}
        </code>
      </div>
      <PencilIcon className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
});

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
// Main Component
// =============================================================================

export function ActionListManager({
  lists,
  selectedListId,
  variables,
  onSelectList,
  onAddList,
  onUpdateList,
  onDeleteList,
  onSetDefaultList,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
}: ActionListManagerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("lists");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: "", label: "" });
  const [variableDialog, setVariableDialog] = useState<{
    open: boolean;
    variable: Variable | null;
  }>({ open: false, variable: null });

  const existingListNames = lists.map((l) => l.name);
  const existingVarNames = variables.map((v) => v.name);

  const handleAddList = useCallback(() => {
    const label = generateDefaultListName(existingListNames);
    onAddList({
      name: toInternalName(label),
      label,
      listType: "sub",
    });
  }, [existingListNames, onAddList]);

  const handleSaveVariable = useCallback(
    (data: { name: string; expression: string }) => {
      if (variableDialog.variable) {
        onUpdateVariable({
          id: variableDialog.variable.id,
          updates: data,
        });
      } else {
        onAddVariable(data);
      }
    },
    [variableDialog.variable, onUpdateVariable, onAddVariable],
  );

  const handleDeleteVariable = useCallback(() => {
    if (variableDialog.variable) {
      onDeleteVariable(variableDialog.variable.id);
    }
  }, [variableDialog.variable, onDeleteVariable]);

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
    <div className="flex flex-col border-r bg-muted/30 w-60 h-full overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b px-2 py-1.5 shrink-0">
          <TabsList className="h-8 bg-transparent p-0 gap-1">
            {SIDEBAR_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-7 px-2.5 text-xs data-[state=active]:bg-background gap-1.5 rounded-md"
              >
                <tab.icon className="size-3.5" />
                <span>{tab.id === "lists" ? "Lists" : "Vars"}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums ml-0.5">
                  {tab.id === "lists" ? lists.length : variables.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
        </div>

        {/* Lists Tab */}
        <TabsContent
          value="lists"
          className="flex-1 mt-0 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Action Lists
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 hover:bg-accent"
              onClick={handleAddList}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {lists.map((list) => (
                <ListItem
                  key={list.id}
                  list={list}
                  isSelected={list.id === selectedListId}
                  onSelect={() => onSelectList(list.id)}
                  onRename={(label) =>
                    onUpdateList({ id: list.id, updates: { label } })
                  }
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
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>No lists yet.</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-6 text-xs mt-1"
                    onClick={handleAddList}
                  >
                    Add your first list
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
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Variables
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 hover:bg-accent"
              onClick={() => setVariableDialog({ open: true, variable: null })}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {variables.map((variable) => (
                <VariableItem
                  key={variable.id}
                  variable={variable}
                  onClick={() => setVariableDialog({ open: true, variable })}
                />
              ))}
              {variables.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>No variables yet.</p>
                  <p className="text-xs mt-2 text-muted-foreground/70">
                    Use{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">
                      $name
                    </code>{" "}
                    in conditions
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-6 text-xs mt-2"
                    onClick={() =>
                      setVariableDialog({ open: true, variable: null })
                    }
                  >
                    Add your first variable
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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
      <VariableEditor
        open={variableDialog.open}
        onOpenChange={(open) =>
          setVariableDialog((prev) => ({ ...prev, open }))
        }
        variable={variableDialog.variable}
        existingNames={existingVarNames}
        onSave={handleSaveVariable}
        onDelete={handleDeleteVariable}
      />
    </div>
  );
}

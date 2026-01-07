"use client";

import { memo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Plus,
  Zap,
  Clock,
  Variable,
  FolderOpen,
  Save,
  Play,
  Code,
  Eye,
  Undo2,
  Redo2,
  Upload,
  Download,
  History,
  Keyboard,
  Copy,
  ListTree,
  FileCode,
  BookTemplate,
  RotateCcw,
  Settings2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionRow } from "./action-row";
import { VariablesPanel } from "./variables-panel";
import type {
  Action,
  CastAction,
  WaitAction,
  SetVariableAction,
  CallGroupAction,
  VariableDefinition,
  ActionGroup,
  SpellReference,
} from "./types";

// Mock spell data
const MOCK_SPELLS: SpellReference[] = [
  { id: 56641, name: "Steady Shot", icon: "ability_hunter_steadyshot", color: "#4ade80" },
  { id: 34026, name: "Kill Command", icon: "ability_hunter_killcommand", color: "#f97316" },
  { id: 193455, name: "Cobra Shot", icon: "ability_hunter_cobrashot", color: "#22d3ee" },
  { id: 19434, name: "Aimed Shot", icon: "ability_hunter_aimedshot", color: "#a855f7" },
  { id: 257620, name: "Multi-Shot", icon: "ability_upgrademoonglaive", color: "#eab308" },
  { id: 186270, name: "Raptor Strike", icon: "ability_hunter_raptorstrike", color: "#ef4444" },
];

const INITIAL_ACTIONS: Action[] = [
  {
    id: "1",
    type: "cast",
    spellId: 34026,
    target: "current_target",
    enabled: true,
    label: "Kill Command",
    condition: { id: "c1", type: "expression", subject: "spell.is_ready", op: "eq", value: true },
  },
  {
    id: "2",
    type: "cast",
    spellId: 193455,
    target: "current_target",
    enabled: true,
    condition: {
      id: "c2",
      type: "and",
      conditions: [
        { id: "c2a", type: "expression", subject: "player.focus", op: "gte", value: 35 },
        { id: "c2b", type: "expression", subject: "target.debuffs.serpent_sting.remaining", op: "gt", value: 2 },
      ],
    },
  },
  { id: "3", type: "cast", spellId: 56641, target: "current_target", enabled: true, label: "Filler" },
];

const INITIAL_VARIABLES: VariableDefinition[] = [
  { id: "v1", name: "aoe_threshold", type: "number", defaultValue: 3, description: "AoE enemy count" },
];

const INITIAL_GROUPS: ActionGroup[] = [
  { id: "g1", name: "Cooldowns", description: "Major CDs", actions: [] },
  { id: "g2", name: "AoE", description: "Multi-target", actions: [] },
];

const MOCK_TRACE = [
  { time: 0.0, action: "Kill Command", result: "cast" as const },
  { time: 1.5, action: "Cobra Shot", result: "cast" as const },
  { time: 3.0, action: "Kill Command", result: "skip" as const },
  { time: 3.0, action: "Cobra Shot", result: "cast" as const },
  { time: 4.5, action: "Steady Shot", result: "cast" as const },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface VisualRotationEditorProps {
  className?: string;
}

export const VisualRotationEditor = memo(function VisualRotationEditor({
  className,
}: VisualRotationEditorProps) {
  const [actions, setActions] = useState<Action[]>(INITIAL_ACTIONS);
  const [variables, setVariables] = useState<VariableDefinition[]>(INITIAL_VARIABLES);
  const [groups, setGroups] = useState<ActionGroup[]>(INITIAL_GROUPS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "code">("visual");
  const [showTrace, setShowTrace] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setActions((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const addAction = useCallback((type: Action["type"]) => {
    const id = generateId();
    let newAction: Action;
    switch (type) {
      case "cast":
        newAction = { id, type: "cast", spellId: MOCK_SPELLS[0].id, target: "current_target", enabled: true } as CastAction;
        break;
      case "wait":
        newAction = { id, type: "wait", enabled: true } as WaitAction;
        break;
      case "set_variable":
        newAction = { id, type: "set_variable", assignment: { variableId: "", expression: "" }, enabled: true } as SetVariableAction;
        break;
      case "call_group":
        newAction = { id, type: "call_group", groupId: "", enabled: true } as CallGroupAction;
        break;
    }
    setActions((prev) => [...prev, newAction]);
    setSelectedId(id);
  }, []);

  const updateAction = useCallback((id: string, updated: Action) => {
    setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateAction = useCallback((id: string) => {
    setActions((prev) => {
      const index = prev.findIndex((a) => a.id === id);
      if (index === -1) return prev;
      const duplicate = { ...prev[index], id: generateId() };
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
  }, []);

  const getSpell = useCallback((spellId: number) => MOCK_SPELLS.find((s) => s.id === spellId), []);

  const activeAction = activeId ? actions.find((a) => a.id === activeId) : null;

  const generatedCode = `if spell_ready(KILL_COMMAND) { try_cast(KILL_COMMAND); }
if player.focus >= 35 && target.debuff_remaining("serpent_sting") > 2 { try_cast(COBRA_SHOT); }
try_cast(STEADY_SHOT);`;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-[calc(100dvh-8rem)] rounded-lg border overflow-hidden bg-background", className)}>
        {/* Compact toolbar */}
        <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30 text-xs">
          {/* Undo/Redo */}
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Undo2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Redo2 className="h-3 w-3" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Add action */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2">
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-xs">
              <DropdownMenuItem onClick={() => addAction("cast")} className="text-xs">
                <Zap className="h-3 w-3 mr-2 text-amber-500" />
                Cast <DropdownMenuShortcut>A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addAction("wait")} className="text-xs">
                <Clock className="h-3 w-3 mr-2 text-blue-500" />
                Wait <DropdownMenuShortcut>W</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addAction("set_variable")} className="text-xs">
                <Variable className="h-3 w-3 mr-2 text-green-500" />
                Variable <DropdownMenuShortcut>V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addAction("call_group")} className="text-xs">
                <FolderOpen className="h-3 w-3 mr-2 text-purple-500" />
                Group <DropdownMenuShortcut>G</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Variables popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2">
                <Variable className="h-3 w-3" />
                <span className="tabular-nums">{variables.length}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <VariablesPanel variables={variables} onChange={setVariables} />
            </PopoverContent>
          </Popover>

          {/* Groups popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2">
                <FolderOpen className="h-3 w-3" />
                <span className="tabular-nums">{groups.length}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-xs cursor-pointer">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <span>{g.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[9px] px-1">{g.actions.length}</Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-6 text-xs mt-1">
                  <Plus className="h-3 w-3 mr-1" />
                  New Group
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Import/Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Upload className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 text-xs">
              <DropdownMenuItem className="text-xs">SimC APL</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">Rhai Script</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Download className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 text-xs">
              <DropdownMenuItem className="text-xs">Rhai Script</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">SimC APL</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats */}
          <span className="text-muted-foreground tabular-nums">
            {actions.length} actions · {actions.filter((a) => a.enabled).length} enabled
          </span>

          <div className="h-4 w-px bg-border mx-1" />

          {/* View toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "visual" | "code")} size="sm">
            <ToggleGroupItem value="visual" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </ToggleGroupItem>
            <ToggleGroupItem value="code" className="h-6 w-6 p-0">
              <Code className="h-3 w-3" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Trace toggle */}
          <Button
            variant={showTrace ? "secondary" : "ghost"}
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowTrace(!showTrace)}
          >
            <ListTree className="h-3 w-3" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Actions */}
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Reset">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="History">
            <History className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Shortcuts">
            <Keyboard className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Settings">
            <Settings2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Actions list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {viewMode === "visual" ? (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {actions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      <Zap className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      <p>No actions yet</p>
                      <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs" onClick={() => addAction("cast")}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add First Action
                      </Button>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                        {actions.map((action, index) => (
                          <ActionRow
                            key={action.id}
                            action={action}
                            index={index}
                            spell={action.type === "cast" ? getSpell(action.spellId) : undefined}
                            isSelected={selectedId === action.id}
                            onSelect={() => setSelectedId(action.id)}
                            onUpdate={(updated) => updateAction(action.id, updated)}
                            onDelete={() => deleteAction(action.id)}
                            onDuplicate={() => duplicateAction(action.id)}
                          />
                        ))}
                      </SortableContext>
                      <DragOverlay dropAnimation={null}>
                        {activeAction && (
                          <div className="opacity-90 shadow-lg">
                            <ActionRow
                              action={activeAction}
                              index={actions.findIndex((a) => a.id === activeAction.id)}
                              spell={activeAction.type === "cast" ? getSpell(activeAction.spellId) : undefined}
                            />
                          </div>
                        )}
                      </DragOverlay>
                    </DndContext>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 p-2">
                <pre className="h-full p-3 rounded bg-muted font-mono text-xs overflow-auto">{generatedCode}</pre>
              </div>
            )}
          </div>

          {/* Trace panel (collapsible) */}
          {showTrace && (
            <div className="w-56 border-l bg-muted/20 flex flex-col">
              <div className="px-2 py-1 border-b text-xs font-medium flex items-center gap-1">
                <ListTree className="h-3 w-3" />
                Trace
                <Badge variant="secondary" className="ml-auto text-[9px]">125k DPS</Badge>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1 space-y-0.5">
                  {MOCK_TRACE.map((entry, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px]",
                        entry.result === "cast" ? "bg-green-500/10" : "bg-muted/50"
                      )}
                    >
                      <span className="font-mono text-muted-foreground w-8">{entry.time.toFixed(1)}s</span>
                      <span className="flex-1 truncate">{entry.action}</span>
                      <span className={cn("text-[9px]", entry.result === "cast" ? "text-green-600" : "text-muted-foreground")}>
                        {entry.result}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 px-2 py-1 border-t bg-muted/30 text-xs">
          {/* Quick add spells */}
          <div className="flex items-center gap-0.5">
            {MOCK_SPELLS.slice(0, 4).map((spell) => (
              <Tooltip key={spell.id}>
                <TooltipTrigger asChild>
                  <button
                    className="h-5 w-5 rounded flex items-center justify-center text-white text-[8px] font-bold hover:ring-1 ring-primary transition-all"
                    style={{ backgroundColor: spell.color }}
                    onClick={() => {
                      const id = generateId();
                      setActions((prev) => [...prev, { id, type: "cast", spellId: spell.id, target: "current_target", enabled: true } as CastAction]);
                      setSelectedId(id);
                    }}
                  >
                    {spell.name.charAt(0)}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{spell.name}</TooltipContent>
              </Tooltip>
            ))}
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2">
            <Play className="h-3 w-3" />
            Test
          </Button>
          <Button size="sm" className="h-6 gap-1 text-xs px-2">
            <Save className="h-3 w-3" />
            Save
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
});

export function VisualRotationEditorSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] rounded-lg border overflow-hidden bg-background">
      <Skeleton className="h-8 w-full rounded-none" />
      <Skeleton className="flex-1 rounded-none" />
      <Skeleton className="h-8 w-full rounded-none" />
    </div>
  );
}

"use client";

import { memo, type DragEvent } from "react";
import {
  Zap,
  GitBranch,
  Variable,
  FolderOpen,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Square,
  Circle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PALETTE_ITEMS, MOCK_SPELLS } from "./constants";
import type { PaletteItem, SpellInfo } from "./types";

const ICONS: Record<string, React.ElementType> = {
  Zap,
  GitBranch,
  Variable,
  FolderOpen,
  MessageSquare,
  ListOrdered,
  Square,
  Circle,
};

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar = memo(function Sidebar({
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const onDragStart = (event: DragEvent, nodeType: string, data: object) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.setData("application/reactflow/data", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  // Collapsed view - just show icons
  if (collapsed) {
    return (
      <div className={cn("flex flex-col h-full bg-muted/20 w-10 transition-all duration-200", className)}>
        <div className="flex items-center justify-center p-1 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleCollapse}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 p-1.5">
          {PALETTE_ITEMS.map((item) => {
            const Icon = ICONS[item.icon] || Zap;
            return (
              <Tooltip key={item.type}>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded cursor-grab hover:bg-accent transition-colors active:cursor-grabbing"
                    style={{ backgroundColor: item.color + "20" }}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.defaultData)}
                  >
                    <Icon className="w-3 h-3" style={{ color: item.color }} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[10px]">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-muted/20 w-44 transition-all duration-200", className)}>
      <div className="flex items-center gap-1 p-1.5 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input placeholder="Search..." className="h-6 pl-5 text-[10px]" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-1">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground">
              <ChevronDown className="w-2.5 h-2.5" />
              Nodes
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-0.5">
              {PALETTE_ITEMS.map((item) => (
                <PaletteNode key={item.type} item={item} onDragStart={onDragStart} />
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground">
              <ChevronDown className="w-2.5 h-2.5" />
              Spells
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-0.5">
              {MOCK_SPELLS.map((spell) => (
                <SpellPaletteItem key={spell.id} spell={spell} onDragStart={onDragStart} />
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground">
              <ChevronDown className="w-2.5 h-2.5" />
              Groups
              <Badge variant="secondary" className="ml-auto text-[8px] px-1 h-3">2</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-0.5">
              <SavedGroupItem name="Cooldowns" count={3} onDragStart={onDragStart} />
              <SavedGroupItem name="AoE Burst" count={5} onDragStart={onDragStart} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <div className="p-1 border-t text-[9px] text-muted-foreground text-center">
        Drag to canvas
      </div>
    </div>
  );
});

interface PaletteNodeProps {
  item: PaletteItem;
  onDragStart: (event: DragEvent, nodeType: string, data: object) => void;
}

const PaletteNode = memo(function PaletteNode({ item, onDragStart }: PaletteNodeProps) {
  const Icon = ICONS[item.icon] || Zap;

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-1 rounded cursor-grab hover:bg-accent transition-colors active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart(e, item.type, item.defaultData)}
    >
      <div
        className="flex items-center justify-center w-4 h-4 rounded-sm text-white"
        style={{ backgroundColor: item.color }}
      >
        <Icon className="w-2.5 h-2.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium">{item.label}</div>
      </div>
    </div>
  );
});

interface SpellPaletteItemProps {
  spell: SpellInfo;
  onDragStart: (event: DragEvent, nodeType: string, data: object) => void;
}

const SpellPaletteItem = memo(function SpellPaletteItem({
  spell,
  onDragStart,
}: SpellPaletteItemProps) {
  const data = {
    label: "Cast " + spell.name,
    spellId: spell.id,
    spellName: spell.name,
    color: spell.color,
    target: "current_target",
    enabled: true,
  };

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-grab hover:bg-accent transition-colors active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart(e, "spell", data)}
    >
      <div
        className="flex items-center justify-center w-3.5 h-3.5 rounded-sm text-white text-[8px] font-bold"
        style={{ backgroundColor: spell.color }}
      >
        {spell.icon}
      </div>
      <span className="text-[10px] flex-1 truncate">{spell.name}</span>
      {spell.cooldown && spell.cooldown > 0 && (
        <span className="text-[8px] text-muted-foreground">{spell.cooldown / 1000}s</span>
      )}
    </div>
  );
});

interface SavedGroupItemProps {
  name: string;
  count: number;
  onDragStart: (event: DragEvent, nodeType: string, data: object) => void;
}

const SavedGroupItem = memo(function SavedGroupItem({
  name,
  count,
  onDragStart,
}: SavedGroupItemProps) {
  const data = {
    label: name,
    groupName: name,
    collapsed: false,
  };

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-grab hover:bg-accent transition-colors active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart(e, "group", data)}
    >
      <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
      <span className="text-[10px] flex-1">{name}</span>
      <Badge variant="secondary" className="text-[8px] px-1 h-3">{count}</Badge>
    </div>
  );
});

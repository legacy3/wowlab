"use client";

import { memo } from "react";
import { Panel } from "@xyflow/react";
import {
  Zap,
  GitBranch,
  Variable,
  FolderOpen,
  MessageSquare,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "./constants";

interface LegendPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

const LEGEND_ITEMS = [
  {
    type: "start",
    label: "Start",
    icon: Play,
    color: NODE_COLORS.start,
    description: "Entry point",
  },
  {
    type: "spell",
    label: "Spell",
    icon: Zap,
    color: NODE_COLORS.spell,
    description: "Cast ability",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    color: NODE_COLORS.condition,
    description: "Branch logic",
  },
  {
    type: "variable",
    label: "Variable",
    icon: Variable,
    color: NODE_COLORS.variable,
    description: "Store value",
  },
  {
    type: "group",
    label: "Group",
    icon: FolderOpen,
    color: NODE_COLORS.group,
    description: "Subroutine",
  },
  {
    type: "comment",
    label: "Comment",
    icon: MessageSquare,
    color: NODE_COLORS.comment,
    description: "Notes",
  },
] as const;

const EDGE_LEGEND = [
  { label: "Yes / True", color: "#22c55e", dashed: false },
  { label: "No / False", color: "#ef4444", dashed: false },
  { label: "Flow", color: "#666", dashed: false },
  { label: "Optional", color: "#3b82f6", dashed: true },
] as const;

export const LegendPanel = memo(function LegendPanel({
  collapsed = false,
  onToggle,
  className,
}: LegendPanelProps) {
  return (
    <Panel
      position="bottom-left"
      className={cn(
        "!m-2 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden transition-all duration-200",
        collapsed ? "w-auto" : "w-44",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] font-semibold border-b hover:bg-accent/50 transition-colors"
      >
        <span className="flex-1 text-left">Legend</span>
        {collapsed ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="p-1.5 space-y-2">
          {/* Node Types */}
          <div className="space-y-0.5">
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
              Nodes
            </div>
            {LEGEND_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="flex items-center justify-center w-4 h-4 rounded text-white shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-medium leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[7px] text-muted-foreground leading-tight">
                      {item.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edge Types */}
          <div className="space-y-0.5">
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
              Connections
            </div>
            {EDGE_LEGEND.map((edge) => (
              <div
                key={edge.label}
                className="flex items-center gap-1.5 px-1 py-0.5"
              >
                <div className="w-4 flex items-center justify-center">
                  <div
                    className="w-3 h-0.5 rounded-full"
                    style={{
                      backgroundColor: edge.color,
                      ...(edge.dashed && {
                        backgroundImage: `repeating-linear-gradient(90deg, ${edge.color} 0, ${edge.color} 2px, transparent 2px, transparent 4px)`,
                        backgroundColor: "transparent",
                      }),
                    }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground">
                  {edge.label}
                </span>
              </div>
            ))}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-0.5 pt-1 border-t">
            <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
              Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-1">
              <Shortcut keys={["Del"]} action="Delete" />
              <Shortcut keys={["Cmd", "D"]} action="Duplicate" />
              <Shortcut keys={["Cmd", "A"]} action="Select all" />
              <Shortcut keys={["Space"]} action="Pan" />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
});

function Shortcut({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1 py-0.5 text-[7px] font-mono bg-muted rounded border border-border/50"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-[7px] text-muted-foreground">{action}</span>
    </div>
  );
}

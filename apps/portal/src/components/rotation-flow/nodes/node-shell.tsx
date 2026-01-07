"use client";

import { type ReactNode, useState } from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import { Copy, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// Node Shell - Main wrapper for all node types
// =============================================================================

interface OutputHandle {
  id: string;
  color: string;
  label?: string;
  position?: "left" | "center" | "right";
}

interface NodeShellProps {
  children: ReactNode;
  selected?: boolean;
  color: string;
  minWidth?: number;
  maxWidth?: number;
  hasInput?: boolean;
  hasOutput?: boolean;
  outputHandles?: OutputHandle[];
  className?: string;
  variant?: "default" | "compact" | "wide";
  // Toolbar actions
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function NodeShell({
  children,
  selected,
  color,
  minWidth = 100,
  maxWidth = 200,
  hasInput = true,
  hasOutput = true,
  outputHandles,
  className,
  variant = "default",
  onDuplicate,
  onDelete,
}: NodeShellProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  return (
    <>
      {/* Node Toolbar - appears on selection */}
      {selected && (onDuplicate || onDelete) && (
        <NodeToolbar
          isVisible={selected}
          position={Position.Top}
          className="!bg-transparent !border-0 !p-0"
          offset={4}
        >
          <div className="flex items-center gap-0.5 bg-card border rounded-md shadow-lg p-0.5">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onDuplicate}
              >
                <Copy className="w-2.5 h-2.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            )}
          </div>
        </NodeToolbar>
      )}

      <div
        className={cn(
          "relative rounded-lg border-2 bg-card shadow-md transition-all duration-150",
          selected
            ? "shadow-xl ring-2 ring-offset-2 ring-offset-background scale-[1.02]"
            : "hover:shadow-lg hover:scale-[1.01]",
          variant === "compact" && "rounded-md",
          variant === "wide" && "rounded-xl",
          className,
        )}
        style={{
          minWidth,
          maxWidth,
          borderColor: selected ? color : `${color}40`,
          ["--tw-ring-color" as string]: `${color}60`,
        }}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-2 right-2 h-0.5 rounded-full"
          style={{ backgroundColor: color }}
        />

        {/* Input Handle */}
        {hasInput && (
          <Handle
            type="target"
            position={Position.Top}
            className={cn(
              "!w-2.5 !h-2.5 !border-[2.5px] !border-card !-top-[6px] !rounded-full transition-all",
              "!bg-muted-foreground/60 hover:!bg-muted-foreground",
              selected && "!bg-muted-foreground",
            )}
          />
        )}

        {/* Node Content */}
        <div className="pt-1">{children}</div>

        {/* Single Output Handle */}
        {hasOutput && !outputHandles && (
          <Handle
            type="source"
            position={Position.Bottom}
            className={cn(
              "!w-2.5 !h-2.5 !border-[2.5px] !border-card !-bottom-[6px] !rounded-full transition-all",
              "hover:!scale-125",
            )}
            style={{ backgroundColor: color }}
          />
        )}

        {/* Multiple Output Handles (for conditions) */}
        {outputHandles && outputHandles.length > 0 && (
          <div className="flex justify-center gap-6 pb-1 pt-0.5">
            {outputHandles.map((h, index) => {
              // Calculate position offset for multiple handles
              const totalHandles = outputHandles.length;
              const offset =
                totalHandles === 2
                  ? index === 0
                    ? "-30%"
                    : "30%"
                  : h.position === "left"
                    ? "-40%"
                    : h.position === "right"
                      ? "40%"
                      : "0%";

              return (
                <div
                  key={h.id}
                  className="relative flex flex-col items-center gap-0.5"
                >
                  {h.label && (
                    <span
                      className="text-[7px] font-bold uppercase tracking-wider select-none"
                      style={{ color: h.color }}
                    >
                      {h.label}
                    </span>
                  )}
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={h.id}
                    className={cn(
                      "!relative !transform-none !w-2 !h-2 !border-[2px] !border-card !rounded-full transition-all",
                      "hover:!scale-125 !top-0",
                    )}
                    style={{ backgroundColor: h.color }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// =============================================================================
// Node Header - Title bar with icon
// =============================================================================

interface NodeHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  trailing?: ReactNode;
  compact?: boolean;
}

export function NodeHeader({
  icon,
  title,
  subtitle,
  color,
  trailing,
  compact = false,
}: NodeHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 border-b border-border/20",
        compact ? "py-1" : "py-1.5",
      )}
      style={{ backgroundColor: `${color}10` }}
    >
      {/* Icon Badge */}
      <div
        className={cn(
          "flex items-center justify-center rounded shrink-0 text-white shadow-sm",
          compact ? "w-4 h-4" : "w-5 h-5",
        )}
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-semibold leading-tight truncate",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-[7px] text-muted-foreground leading-tight truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Trailing content */}
      {trailing}
    </div>
  );
}

// =============================================================================
// Node Body - Content area
// =============================================================================

interface NodeBodyProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

export function NodeBody({
  children,
  className,
  padding = "sm",
}: NodeBodyProps) {
  return (
    <div
      className={cn(
        padding === "none" && "p-0",
        padding === "sm" && "px-2 py-1.5",
        padding === "md" && "px-2.5 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Node Footer - Bottom section for additional info
// =============================================================================

interface NodeFooterProps {
  children: ReactNode;
  className?: string;
}

export function NodeFooter({ children, className }: NodeFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 border-t border-border/20 bg-muted/30 rounded-b-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Node Badge - Small indicator
// =============================================================================

interface NodeBadgeProps {
  children: ReactNode;
  color?: string;
  variant?: "solid" | "outline";
}

export function NodeBadge({
  children,
  color,
  variant = "solid",
}: NodeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.5 rounded text-[7px] font-medium",
        variant === "solid" && "text-white",
        variant === "outline" && "border",
      )}
      style={{
        backgroundColor: variant === "solid" ? color : `${color}15`,
        borderColor: variant === "outline" ? `${color}40` : undefined,
        color: variant === "outline" ? color : undefined,
      }}
    >
      {children}
    </span>
  );
}

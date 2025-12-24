"use client";

import { useMemo } from "react";
import { diffLines, type Change } from "diff";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";

interface DiffViewProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
  className?: string;
}

interface DiffStats {
  additions: number;
  deletions: number;
}

function computeStats(changes: Change[]): DiffStats {
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const lineCount = change.value.split("\n").filter(Boolean).length;
    if (change.added) {
      additions += lineCount;
    } else if (change.removed) {
      deletions += lineCount;
    }
  }

  return { additions, deletions };
}

export function DiffView({
  oldText,
  newText,
  oldLabel = "Old",
  newLabel = "New",
  className,
}: DiffViewProps) {
  const changes = useMemo(() => diffLines(oldText, newText), [oldText, newText]);
  const stats = useMemo(() => computeStats(changes), [changes]);
  const hasChanges = stats.additions > 0 || stats.deletions > 0;

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden flex flex-col",
        className,
      )}
    >
      {/* Header with labels and stats */}
      <div className="flex items-center text-xs border-b bg-muted/50 shrink-0">
        <div className="flex-1 px-3 py-2 font-medium text-destructive/80">
          {oldLabel}
        </div>
        <div className="px-3 py-2 border-x bg-muted/30 text-muted-foreground tabular-nums">
          {hasChanges ? (
            <>
              <span className="text-green-500">+{stats.additions}</span>
              <span className="mx-1.5">/</span>
              <span className="text-destructive">-{stats.deletions}</span>
            </>
          ) : (
            <span>No changes</span>
          )}
        </div>
        <div className="flex-1 px-3 py-2 font-medium text-green-500/80">
          {newLabel}
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea className="flex-1 min-h-0">
        <pre className="text-xs font-mono p-0 m-0 min-h-[200px]">
          {changes.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No content to compare
            </div>
          ) : (
            changes.map((change, index) => (
              <DiffBlock key={index} change={change} />
            ))
          )}
        </pre>
      </ScrollArea>
    </div>
  );
}

function DiffBlock({ change }: { change: Change }) {
  // Split into lines, preserving empty lines but removing trailing split artifact
  const lines = change.value.split("\n");
  // Remove last element if it's empty (split artifact from trailing newline)
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  // If the entire change was just a newline, show one empty line
  if (lines.length === 0 && change.value === "\n") {
    lines.push("");
  }

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "px-3 py-0.5 border-l-2 min-h-[1.5em]",
            change.added &&
              "bg-green-500/10 border-l-green-500 text-green-200",
            change.removed &&
              "bg-destructive/10 border-l-destructive text-red-200",
            !change.added &&
              !change.removed &&
              "border-l-transparent text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "inline-block w-5 text-right mr-3 select-none",
              change.added && "text-green-500/60",
              change.removed && "text-destructive/60",
              !change.added && !change.removed && "text-muted-foreground/40",
            )}
          >
            {change.added ? "+" : change.removed ? "-" : " "}
          </span>
          <span>{line || " "}</span>
        </div>
      ))}
    </>
  );
}

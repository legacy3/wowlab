"use client";

import { useMemo } from "react";
import { diffLines, type Change } from "diff";
import { cn } from "@/lib/utils";

interface DiffViewProps {
  oldText: string;
  newText: string;
  className?: string;
}

export interface DiffStats {
  additions: number;
  deletions: number;
}

export function useDiffStats(oldText: string, newText: string): DiffStats {
  return useMemo(() => {
    const changes = diffLines(oldText, newText);
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
  }, [oldText, newText]);
}

export function DiffView({ oldText, newText, className }: DiffViewProps) {
  const lines = useMemo(() => {
    const changes = diffLines(oldText, newText);

    return buildDiffLines(changes);
  }, [oldText, newText]);

  if (lines.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground py-12",
          className,
        )}
      >
        No changes
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto font-mono text-xs", className)}>
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr
              key={i}
              className={cn(
                line.type === "add" && "bg-green-500/15",
                line.type === "remove" && "bg-red-500/15",
              )}
            >
              <td
                className={cn(
                  "w-10 px-2 py-0 text-right select-none border-r border-border/50",
                  line.type === "add"
                    ? "text-transparent"
                    : "text-muted-foreground/50",
                )}
              >
                {line.oldNum}
              </td>
              <td
                className={cn(
                  "w-10 px-2 py-0 text-right select-none border-r border-border/50",
                  line.type === "remove"
                    ? "text-transparent"
                    : "text-muted-foreground/50",
                )}
              >
                {line.newNum}
              </td>
              <td
                className={cn(
                  "w-5 px-1 py-0 text-center select-none",
                  line.type === "add" && "text-green-400",
                  line.type === "remove" && "text-red-400",
                )}
              >
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </td>
              <td className="px-2 py-0 whitespace-pre">
                {line.content || " "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DiffLine {
  type: "add" | "remove" | "context";
  oldNum: number | null;
  newNum: number | null;
  content: string;
}

function buildDiffLines(changes: Change[]): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldNum = 1;
  let newNum = 1;

  for (const change of changes) {
    const content = change.value.endsWith("\n")
      ? change.value.slice(0, -1)
      : change.value;
    const splitLines = content.split("\n");

    for (const line of splitLines) {
      if (change.added) {
        lines.push({
          type: "add",
          oldNum: null,
          newNum: newNum++,
          content: line,
        });
      } else if (change.removed) {
        lines.push({
          type: "remove",
          oldNum: oldNum++,
          newNum: null,
          content: line,
        });
      } else {
        lines.push({
          type: "context",
          oldNum: oldNum++,
          newNum: newNum++,
          content: line,
        });
      }
    }
  }

  return lines;
}

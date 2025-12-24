"use client";

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

export function DiffView({
  oldText,
  newText,
  oldLabel = "Old",
  newLabel = "New",
  className,
}: DiffViewProps) {
  const changes = diffLines(oldText, newText);

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="flex text-xs border-b bg-muted/50">
        <div className="flex-1 px-3 py-1.5 text-destructive font-medium">
          {oldLabel}
        </div>
        <div className="flex-1 px-3 py-1.5 text-green-500 font-medium border-l">
          {newLabel}
        </div>
      </div>
      <ScrollArea className="h-[400px]">
        <pre className="text-xs font-mono p-0 m-0">
          {changes.map((change, index) => (
            <DiffLine key={index} change={change} />
          ))}
        </pre>
      </ScrollArea>
    </div>
  );
}

function DiffLine({ change }: { change: Change }) {
  const lines = change.value.split("\n").filter(
    (_, i, arr) =>
      // Remove trailing empty line from split
      i < arr.length - 1 || arr[i] !== "",
  );

  if (lines.length === 0 && change.value === "\n") {
    lines.push("");
  }

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "px-3 py-0.5 border-l-2",
            change.added && "bg-green-500/10 border-l-green-500 text-green-300",
            change.removed &&
              "bg-destructive/10 border-l-destructive text-red-300",
            !change.added &&
              !change.removed &&
              "border-l-transparent text-muted-foreground",
          )}
        >
          <span className="inline-block w-4 text-right mr-2 opacity-50">
            {change.added ? "+" : change.removed ? "-" : " "}
          </span>
          {line || " "}
        </div>
      ))}
    </>
  );
}

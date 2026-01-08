"use client";

import { Code2Icon, BracesIcon, TextIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { CodeBlock } from "@/components/ui/code-block";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";
import { cn } from "@/lib/utils";

import {
  formatConditionForDSL,
  formatConditionsForNatural,
} from "../rotation-editor/utils";
import type { RotationData } from "./types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface RotationPreviewProps {
  data: RotationData;
}

// -----------------------------------------------------------------------------
// Format Generators (using shared utilities from rotation-editor)
// -----------------------------------------------------------------------------

function generateDSL(data: RotationData, specName: string): string {
  const lines: string[] = [];

  lines.push(`# ${specName} Rotation`);
  lines.push("");

  if (data.variables.length > 0) {
    lines.push("variables:");
    for (const variable of data.variables) {
      lines.push(`  $${variable.name} = ${variable.expression}`);
    }
    lines.push("");
  }

  for (const list of data.actionLists) {
    lines.push(`actions.${list.name}:`);

    for (const action of list.actions) {
      if (!action.enabled) {
        continue;
      }

      const conditionStr = formatConditionForDSL(action.conditions);
      if (conditionStr) {
        lines.push(`  ${action.spell},if=${conditionStr}`);
      } else {
        lines.push(`  ${action.spell}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function generateNatural(data: RotationData, specName: string): string {
  const lines: string[] = [];

  lines.push(specName + " Rotation");
  lines.push("");

  if (data.variables.length > 0) {
    lines.push("Variables:");
    for (const variable of data.variables) {
      lines.push(`  • ${variable.name}: ${variable.expression}`);
    }
    lines.push("");
  }

  for (const list of data.actionLists) {
    const isDefault = list.name === data.defaultList;
    const title = isDefault ? `${list.label} (default):` : `${list.label}:`;
    lines.push(title);

    let priority = 1;
    for (const action of list.actions) {
      if (!action.enabled) {
        continue;
      }

      const spellName = action.spell
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const conditionStr = formatConditionsForNatural(action.conditions);
      if (conditionStr) {
        lines.push(`  ${priority}. ${spellName} — when ${conditionStr}`);
      } else {
        lines.push(`  ${priority}. ${spellName}`);
      }
      priority++;
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function generateJSON(data: RotationData): string {
  return JSON.stringify(data, null, 2);
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

type ViewMode = "natural" | "dsl" | "json";

export function RotationPreview({ data }: RotationPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("natural");
  const { classes, specs } = useClassesAndSpecs();

  // Derive spec name from specId
  const specName = useMemo(() => {
    if (!data.specId) return "Unknown";
    const spec = specs.result?.data?.find((s) => s.ID === data.specId);
    const cls = spec
      ? classes.result?.data?.find((c) => c.ID === spec.ClassID)
      : null;
    if (cls && spec) {
      return `${cls.Name_lang} ${spec.Name_lang}`;
    }
    return "Unknown";
  }, [data.specId, classes.result?.data, specs.result?.data]);

  const naturalContent = useMemo(
    () => generateNatural(data, specName),
    [data, specName],
  );
  const dslContent = useMemo(
    () => generateDSL(data, specName),
    [data, specName],
  );
  const jsonContent = useMemo(() => generateJSON(data), [data]);

  const currentContent =
    viewMode === "natural"
      ? naturalContent
      : viewMode === "dsl"
        ? dslContent
        : jsonContent;

  return (
    <div className="flex flex-col h-full">
      {/* View toggle */}
      <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 w-fit mb-3">
        <button
          onClick={() => setViewMode("natural")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "natural"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <TextIcon className="size-3.5" />
          Natural
        </button>
        <button
          onClick={() => setViewMode("dsl")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "dsl"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Code2Icon className="size-3.5" />
          DSL
        </button>
        <button
          onClick={() => setViewMode("json")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "json"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <BracesIcon className="size-3.5" />
          JSON
        </button>
      </div>

      {/* Code display */}
      <div className="flex-1 min-h-0">
        <CodeBlock
          code={currentContent}
          language={
            viewMode === "json"
              ? "json"
              : viewMode === "dsl"
                ? "yaml"
                : "markdown"
          }
          maxHeight="max-h-[calc(100vh-16rem)]"
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { RotationData } from "./types";

"use client";

import { useMemo, useState } from "react";
import { Code2Icon, BracesIcon, TextIcon } from "lucide-react";

import { CodeBlock } from "@/components/ui/code-block";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";
import { cn } from "@/lib/utils";

import type { RotationDraft } from "./types";
import { generateDSL, generateNatural, generateJSON } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RotationPreviewProps {
  draft: RotationDraft;
}

type ViewMode = "natural" | "dsl" | "json";

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function RotationPreview({ draft }: RotationPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("natural");
  const { classes, specs } = useClassesAndSpecs();

  const specName = useMemo(() => {
    if (!draft.specId) return "Unknown";
    const spec = specs.result?.data?.find((s) => s.ID === draft.specId);
    const cls = spec
      ? classes.result?.data?.find((c) => c.ID === spec.ClassID)
      : null;
    return cls && spec ? `${cls.Name_lang} ${spec.Name_lang}` : "Unknown";
  }, [draft.specId, classes.result?.data, specs.result?.data]);

  const content = useMemo(() => {
    switch (viewMode) {
      case "natural":
        return generateNatural(draft, specName);
      case "dsl":
        return generateDSL(draft, specName);
      case "json":
        return generateJSON(draft);
    }
  }, [draft, specName, viewMode]);

  return (
    <div className="flex flex-col h-full">
      {/* View toggle */}
      <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 w-fit mb-3">
        {(["natural", "dsl", "json"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode === "natural" && <TextIcon className="size-3.5" />}
            {mode === "dsl" && <Code2Icon className="size-3.5" />}
            {mode === "json" && <BracesIcon className="size-3.5" />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Code display */}
      <CodeBlock
        code={content}
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
  );
}

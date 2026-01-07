"use client";

import { memo } from "react";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentNodeData } from "../types";

interface CommentNodeProps {
  data: CommentNodeData;
  selected?: boolean;
}

export const CommentNode = memo(function CommentNode({
  data,
  selected,
}: CommentNodeProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed bg-amber-50/50 dark:bg-amber-950/20 shadow-sm transition-all duration-150",
        "min-w-[80px] max-w-[160px]",
        selected
          ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-200/50 dark:ring-amber-800/50 scale-[1.02]"
          : "border-amber-300/60 dark:border-amber-700/40 hover:border-amber-400/80 hover:scale-[1.01]"
      )}
    >
      {/* Sticky note fold effect */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-amber-200/50 dark:bg-amber-800/30 rounded-bl-lg" />

      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-dashed border-amber-300/40 dark:border-amber-700/30">
        <StickyNote
          className="w-3 h-3 text-amber-500 dark:text-amber-400"
        />
        <span className="text-[8px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          {data.label || "Note"}
        </span>
      </div>

      {/* Content */}
      <div className="px-2 py-1.5 text-[9px] text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
        {data.text}
      </div>
    </div>
  );
});

"use client";

import type { Talent } from "@wowlab/core/Schemas";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game";

interface TalentNodeProps {
  node: Talent.TalentNode;
  selection?: Talent.DecodedTalentSelection;
  scale?: number;
}

export function TalentNode({ node, selection, scale = 1 }: TalentNodeProps) {
  const isSelected = selection?.selected ?? false;
  const ranksPurchased = selection?.ranksPurchased ?? 0;
  const choiceIndex = selection?.choiceIndex ?? 0;
  const isChoiceNode = node.type === 2;
  const entry = node.entries[isChoiceNode ? choiceIndex : 0];

  if (!entry) {
    return null;
  }

  const size = isChoiceNode ? 44 : 40;
  const scaledSize = size * scale;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "transition-all duration-200",
        isChoiceNode ? "rounded-md" : "rounded-full",
        isSelected
          ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
          : "opacity-50 grayscale",
      )}
      style={{
        width: scaledSize,
        height: scaledSize,
      }}
      title={`${entry.name}${node.maxRanks > 1 ? ` (${ranksPurchased}/${node.maxRanks})` : ""}`}
    >
      <GameIcon
        iconName={entry.iconFileName}
        size="medium"
        alt={entry.name}
        className={cn(
          isChoiceNode ? "rounded" : "rounded-full",
          "border-2",
          isSelected ? "border-yellow-500" : "border-gray-600",
        )}
      />

      {/* Rank indicator for multi-rank talents */}
      {node.maxRanks > 1 && isSelected && (
        <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full px-1 text-[10px] font-bold">
          {ranksPurchased}/{node.maxRanks}
        </div>
      )}

      {/* Choice node indicator */}
      {isChoiceNode && node.entries.length > 1 && (
        <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full w-3 h-3 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">
            {node.entries.length}
          </span>
        </div>
      )}
    </div>
  );
}

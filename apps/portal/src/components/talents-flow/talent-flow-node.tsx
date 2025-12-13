"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { Talent } from "@wowlab/core/Schemas";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TalentNodeData extends Record<string, unknown> {
  talent: Talent.TalentNode;
  isSelected: boolean;
  ranksPurchased: number;
  isHero: boolean;
  isSearchMatch: boolean;
  isSearching: boolean;
}

export type TalentFlowNode = Node<TalentNodeData, "talent">;

const NODE_SIZE = 40;
const CHOICE_NODE_SIZE = 44;

function TalentFlowNodeComponent({ data }: NodeProps<TalentFlowNode>) {
  const {
    talent: node,
    isSelected,
    ranksPurchased,
    isHero,
    isSearchMatch,
    isSearching,
  } = data;
  const isChoiceNode = node.type === 2 && node.entries.length > 1;
  const size = isChoiceNode ? CHOICE_NODE_SIZE : NODE_SIZE;

  // Choice node: show both icons side by side
  if (isChoiceNode) {
    const entry1 = node.entries[0];
    const entry2 = node.entries[1];

    return (
      <>
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-transparent !border-0 !w-2 !h-2"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative flex items-center justify-center overflow-hidden cursor-pointer",
                "transition-all duration-200 rounded-md hover:scale-110",
                "border-2 border-purple-600",
                "bg-gradient-to-b from-purple-900/50 to-purple-950/50",
                isSelected
                  ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
                  : "opacity-50 grayscale",
                isSearching && !isSearchMatch && "!opacity-30",
                isSearching && isSearchMatch && "ring-2 ring-blue-500",
              )}
              style={{ width: size, height: size }}
            >
              <div className="flex w-full h-full">
                <GameIcon
                  iconName={entry1?.iconFileName || "inv_misc_questionmark"}
                  size="medium"
                  alt={entry1?.name || "?"}
                  className="w-1/2 h-full object-cover rounded-l"
                />
                <GameIcon
                  iconName={entry2?.iconFileName || "inv_misc_questionmark"}
                  size="medium"
                  alt={entry2?.name || "?"}
                  className="w-1/2 h-full object-cover rounded-r"
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-md bg-gray-900/95 border-gray-700 p-4 z-50"
          >
            <div className="space-y-3">
              <div className="text-xs text-purple-400 font-medium">
                Choice Talent
              </div>
              <div className="grid grid-cols-2 gap-3">
                {node.entries.slice(0, 2).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 bg-black/30 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GameIcon
                        iconName={entry.iconFileName}
                        size="small"
                        alt={entry.name}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-purple-300">
                        {entry.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {entry.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700 flex gap-3">
                <span>ID {node.id}</span>
                <span>Order {node.orderIndex}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-transparent !border-0 !w-2 !h-2"
        />
      </>
    );
  }

  // Regular single-entry node
  const entry = node.entries[0];
  if (!entry) {
    return null;
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex items-center justify-center cursor-pointer",
              "transition-all duration-200 hover:scale-110",
              isHero ? "rounded-md" : "rounded-full",
              isHero && "border-2 border-orange-600",
              isSelected
                ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
                : "opacity-50 grayscale",
              isSearching && !isSearchMatch && "!opacity-30",
              isSearching && isSearchMatch && "ring-2 ring-blue-500",
            )}
            style={{ width: size, height: size }}
          >
            <GameIcon
              iconName={entry.iconFileName}
              size="medium"
              alt={entry.name}
              className={cn(
                "border-2",
                isHero ? "rounded" : "rounded-full",
                isSelected
                  ? isHero
                    ? "border-orange-500"
                    : "border-yellow-500"
                  : "border-gray-600",
              )}
            />

            {/* Rank indicator for multi-rank talents */}
            {node.maxRanks > 1 && (
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 bg-background border border-border rounded-full px-1 text-[10px] font-bold",
                  isSelected ? "text-green-400" : "text-gray-500",
                )}
              >
                {isSelected ? ranksPurchased : node.maxRanks}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-xs bg-gray-900/95 border-gray-700 p-4 z-50"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <GameIcon
                iconName={entry.iconFileName}
                size="small"
                alt={entry.name}
                className="rounded"
              />
              <div>
                <h4
                  className={cn(
                    "font-medium",
                    isHero ? "text-orange-400" : "text-yellow-400",
                  )}
                >
                  {entry.name}
                </h4>
                <div className="text-[10px] text-gray-500">
                  {isHero ? "Hero Talent" : "Talent"}
                  {node.maxRanks > 1 && ` · ${node.maxRanks} Ranks`}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {entry.description || "No description available."}
            </p>
            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700 flex gap-3">
              <span>ID {node.id}</span>
              <span>Spell {entry.spellId || "N/A"}</span>
              <span>Order {node.orderIndex}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
    </>
  );
}

export const TalentFlowNode = memo(TalentFlowNodeComponent);

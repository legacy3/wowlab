"use client";

import type { TooltipState } from "./types";
import { X } from "lucide-react";
import { GameIcon } from "@/components/game";
import { useSpellDescription } from "@/hooks/use-spell-description";

function SpellDescription({
  spellId,
  fallback,
}: {
  spellId: number | null | undefined;
  fallback: string | null | undefined;
}) {
  const { data, isLoading } = useSpellDescription(
    spellId && spellId > 0 ? spellId : null,
  );

  if (isLoading && !data) {
    return <span>Loading description ...</span>;
  }

  return <span>{data?.text ?? fallback ?? "No description available."}</span>;
}

interface TalentTooltipProps {
  tooltip: TooltipState | null;
  containerWidth: number;
  containerHeight: number;
  pinned?: boolean;
  onClose?: () => void;
}

export function TalentTooltip({
  tooltip,
  containerWidth,
  containerHeight,
  pinned = false,
  onClose,
}: TalentTooltipProps) {
  if (!tooltip) {
    return null;
  }

  const { x, y, node, selection } = tooltip;
  const isSelected = selection?.selected ?? false;
  const ranksPurchased = selection?.ranksPurchased ?? 0;
  const isChoiceNode = node.type === 2 && node.entries.length > 1;
  const isHero = node.subTreeId > 0;

  const tooltipWidth = isChoiceNode ? 320 : 280;
  const tooltipX =
    x + tooltipWidth > containerWidth ? x - tooltipWidth - 10 : x + 15;
  const estimatedHeight = isChoiceNode ? 240 : 200;
  const tooltipY = Math.min(
    Math.max(10, y - 20),
    Math.max(10, containerHeight - estimatedHeight - 10),
  );

  if (isChoiceNode) {
    return (
      <div
        className={`absolute z-50 ${pinned ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ left: tooltipX, top: tooltipY }}
      >
        <div className="relative bg-gray-900/95 border border-gray-700 rounded-lg p-4 shadow-xl max-w-sm">
          {pinned && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
              title="Close"
            >
              <X className="h-3 w-3" />
            </button>
          )}
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
                  <p className="text-xs text-gray-400 leading-relaxed select-text">
                    <SpellDescription
                      spellId={entry.spellId ?? null}
                      fallback={entry.description}
                    />
                  </p>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700 flex gap-3">
              <span>ID {node.id}</span>
              <span>Order {node.orderIndex}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const entry = node.entries[0];
  if (!entry) {
    return null;
  }

  return (
    <div
      className={`absolute z-50 ${pinned ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ left: tooltipX, top: tooltipY }}
    >
      <div className="relative bg-gray-900/95 border border-gray-700 rounded-lg p-4 shadow-xl max-w-xs">
        {pinned && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        )}
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
                className={`font-medium ${isHero ? "text-orange-400" : "text-yellow-400"}`}
              >
                {entry.name}
              </h4>
              <div className="text-[10px] text-gray-500">
                {isHero ? "Hero Talent" : "Talent"}
                {node.maxRanks > 1 && ` · ${node.maxRanks} Ranks`}
                {isSelected &&
                  node.maxRanks > 1 &&
                  ` (${ranksPurchased}/${node.maxRanks})`}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed select-text">
            <SpellDescription
              spellId={entry.spellId ?? null}
              fallback={entry.description}
            />
          </p>
          <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700 flex gap-3">
            <span>ID {node.id}</span>
            <span>Spell {entry.spellId || "N/A"}</span>
            <span>Order {node.orderIndex}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

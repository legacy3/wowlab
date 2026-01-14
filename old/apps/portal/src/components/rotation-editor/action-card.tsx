"use client";

import { useState, useCallback, memo } from "react";
import NextLink from "next/link";
import type { RuleGroupType } from "react-querybuilder";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  ListIcon,
  PowerIcon,
  TrashIcon,
} from "lucide-react";

import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { GameIcon } from "@/components/game/game-icon";
import {
  ItemTooltip,
  SpellTooltip,
  type ItemTooltipData,
  type ItemQuality,
  type SpellTooltipData,
} from "@/components/game/game-tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useItem } from "@/hooks/use-item";
import { useSpell } from "@/hooks/use-spell";
import type { Item, Spell } from "@wowlab/core/Schemas";

import { ConditionBuilder } from "./condition-builder";
import { ItemPicker } from "./item-picker";
import { SpellPicker, type AllowedSpell } from "./spell-picker";
import type { Action, ActionType } from "./types";
import { getConditionSummary } from "./utils";

// Transform DBC spell data to tooltip format
function toSpellTooltipData(spell: Spell.SpellDataFlat): SpellTooltipData {
  return {
    id: spell.id,
    name: spell.name,
    castTime: spell.castTime === 0 ? "Instant" : `${spell.castTime / 1000} sec`,
    cooldown:
      spell.recoveryTime > 0 ? `${spell.recoveryTime / 1000} sec` : undefined,
    cost:
      spell.powerCost > 0
        ? `${spell.powerCost} ${spell.powerType === 2 ? "Focus" : ""}`.trim()
        : undefined,
    range: spell.rangeMax0 > 0 ? `${spell.rangeMax0} yd range` : undefined,
    description: spell.description,
    iconName: spell.fileName,
  };
}

// Transform DBC item data to tooltip format
function toItemTooltipData(item: Item.ItemDataFlat): ItemTooltipData {
  return {
    name: item.name,
    quality: item.quality as ItemQuality,
    itemLevel: item.itemLevel,
    slot: item.classification?.inventoryTypeName,
    effects:
      item.description && item.effects.length > 0
        ? [{ text: item.description, isUse: true }]
        : item.description
          ? [{ text: item.description }]
          : undefined,
    iconName: item.fileName,
  };
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ActionCardProps {
  action: Action;
  index: number;
  callableLists: Array<{ id: string; name: string; label: string }>;
  allowedSpells: ReadonlyArray<AllowedSpell>;
  onUpdate: (updates: Partial<Omit<Action, "id">>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ActionCard = memo(function ActionCard({
  action,
  index,
  callableLists,
  allowedSpells,
  onUpdate,
  onDelete,
  onDuplicate,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCallList = action.type === "call_action_list";
  const isItem = action.type === "item";
  const isSpell = action.type === "spell";

  // Fetch spell data from DBC
  const { data: spell, isLoading: isSpellLoading } = useSpell(
    isSpell ? action.spellId : null,
  );

  // Fetch item data from DBC
  const { data: item, isLoading: isItemLoading } = useItem(
    isItem ? action.itemId : null,
  );

  const handleConditionChange = useCallback(
    (condition: RuleGroupType) => {
      onUpdate({ condition });
    },
    [onUpdate],
  );

  const conditionSummary = getConditionSummary(action.condition);

  // Icon element based on action type
  const renderActionIcon = () => {
    // Call action list icon
    if (isCallList) {
      return (
        <div className="flex size-9 items-center justify-center rounded-md border bg-blue-500/10 text-blue-500">
          <ListIcon className="size-5" />
        </div>
      );
    }

    // Item icon
    if (isItem) {
      if (isItemLoading) {
        return (
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-primary">
            <FlaskInlineLoader className="size-5" />
          </div>
        );
      }
      if (item) {
        return (
          <ItemTooltip item={toItemTooltipData(item)}>
            <NextLink
              href={`/lab/inspector/item/${item.id}`}
              className="shrink-0 overflow-hidden rounded-md border hover:ring-2 hover:ring-primary/50 transition-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <GameIcon
                iconName={item.fileName}
                size="medium"
                width={36}
                height={36}
              />
            </NextLink>
          </ItemTooltip>
        );
      }
    }

    // Spell icon (default)
    if (isSpellLoading) {
      return (
        <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-primary">
          <FlaskInlineLoader className="size-5" />
        </div>
      );
    }
    if (spell) {
      return (
        <SpellTooltip spell={toSpellTooltipData(spell)}>
          <NextLink
            href={`/lab/inspector/spell/${spell.id}`}
            className="shrink-0 overflow-hidden rounded-md border hover:ring-2 hover:ring-primary/50 transition-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <GameIcon
              iconName={spell.fileName}
              size="medium"
              width={36}
              height={36}
            />
          </NextLink>
        </SpellTooltip>
      );
    }

    // Fallback
    return (
      <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xs">
        ?
      </div>
    );
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "group rounded-lg border bg-card transition-all",
          !action.enabled && "opacity-50",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle */}
          <GripVerticalIcon className="size-4 text-muted-foreground/40 cursor-grab" />

          {/* Priority */}
          <Badge
            variant="secondary"
            className="size-6 p-0 justify-center text-xs"
          >
            {index + 1}
          </Badge>

          {/* Action Icon (Spell/Item/List) */}
          {renderActionIcon()}

          {/* Expand toggle */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Action type selector */}
          <Select
            value={action.type}
            onValueChange={(type) => onUpdate({ type: type as ActionType })}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spell">Spell</SelectItem>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="call_action_list">Call List</SelectItem>
            </SelectContent>
          </Select>

          {/* Spell/Item/List selector */}
          {isCallList ? (
            <Select
              value={action.listId}
              onValueChange={(listId) => onUpdate({ listId })}
            >
              <SelectTrigger className="w-32 h-7 text-xs text-blue-500">
                <SelectValue placeholder="Select list..." />
              </SelectTrigger>
              <SelectContent>
                {callableLists.length === 0 ? (
                  <SelectItem value="" disabled>
                    No sub-lists available
                  </SelectItem>
                ) : (
                  callableLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : isItem ? (
            <ItemPicker
              value={action.itemId}
              onSelect={(itemId) => onUpdate({ itemId })}
            />
          ) : (
            <SpellPicker
              value={action.spellId}
              onSelect={(spellId) => onUpdate({ spellId })}
              allowedSpells={allowedSpells}
            />
          )}

          {/* Condition summary (collapsed) */}
          {!isExpanded && (
            <div className="flex-1 min-w-0 px-1">
              <span className="text-xs text-muted-foreground truncate">
                {conditionSummary === "Always" ? (
                  <Badge variant="outline" className="text-[10px] h-5">
                    Always
                  </Badge>
                ) : (
                  <>
                    <span className="text-muted-foreground/60">if </span>
                    <span className="font-mono">{conditionSummary}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {isExpanded && <div className="flex-1" />}

          {/* Actions */}
          <div className="flex items-center opacity-60 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7",
                action.enabled ? "text-green-500" : "text-muted-foreground",
              )}
              onClick={() => onUpdate({ enabled: !action.enabled })}
            >
              <PowerIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onDuplicate}
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 hover:text-destructive"
              onClick={onDelete}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded: Condition builder */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-3 border-t bg-muted/20">
            <ConditionBuilder
              condition={action.condition}
              onChange={handleConditionChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

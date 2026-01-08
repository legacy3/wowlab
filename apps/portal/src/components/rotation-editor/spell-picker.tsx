"use client";

import { useState } from "react";
import NextLink from "next/link";
import { CheckIcon, ChevronsUpDownIcon, ExternalLinkIcon } from "lucide-react";

import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { GameIcon } from "@/components/game/game-icon";
import {
  SpellTooltip,
  type SpellTooltipData,
} from "@/components/game/game-tooltip";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSpell } from "@/hooks/use-spell";
import { useSpellSearch } from "@/hooks/use-spell-search";
import type { Spell } from "@wowlab/core/Schemas";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AllowedSpell {
  id: number;
  name: string;
}

interface SpellPickerProps {
  /** Current spell ID */
  value?: number;
  /** Called when spell selected */
  onSelect: (spellId: number) => void;
  /** List of allowed spells for this spec */
  allowedSpells: ReadonlyArray<AllowedSpell>;
  /** Trigger element (for popover mode) */
  children?: React.ReactNode;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for trigger */
  className?: string;
}

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

// -----------------------------------------------------------------------------
// Dropdown Item (uses hook to fetch spell data)
// -----------------------------------------------------------------------------

function SpellDropdownItem({
  spellId,
  isSelected,
  onSelect,
}: {
  spellId: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: spell } = useSpell(spellId);

  return (
    <CommandItem
      value={spell?.name ?? `spell-${spellId}`}
      onSelect={onSelect}
      className="flex items-center gap-2"
    >
      <CheckIcon
        className={cn(
          "size-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      {spell ? (
        <>
          <GameIcon
            iconName={spell.fileName}
            size="small"
            className="shrink-0 rounded"
          />
          <span className="truncate">{spell.name}</span>
        </>
      ) : (
        <span className="flex items-center gap-2 text-primary">
          <FlaskInlineLoader className="size-4" />
          <span className="truncate text-muted-foreground">Loading...</span>
        </span>
      )}
      <NextLink
        href={`/lab/inspector/spell/${spellId}`}
        className="ml-auto opacity-0 group-data-[selected=true]:opacity-100 hover:opacity-100 text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLinkIcon className="size-3" />
      </NextLink>
    </CommandItem>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SpellPicker({
  value,
  onSelect,
  allowedSpells,
  children,
  placeholder = "Select spell...",
  className,
}: SpellPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch selected spell data for tooltip
  const { data: selectedSpell, isLoading: isLoadingSelected } = useSpell(value);

  // Search allowed spells by name
  const { data: spellList } = useSpellSearch({
    query: searchQuery,
    allowedSpells,
    enabled: open,
  });

  const handleSelect = (spellId: number) => {
    onSelect(spellId);
    setOpen(false);
    setSearchQuery("");
  };

  // Show all allowed spells when no query, filtered list when typing
  const displayList = searchQuery.trim() ? spellList : allowedSpells;

  const dropdownContent = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search spells..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {displayList.length === 0 ? (
          <CommandEmpty>No spells found.</CommandEmpty>
        ) : (
          <CommandGroup>
            {displayList.map((spell) => (
              <SpellDropdownItem
                key={spell.id}
                spellId={spell.id}
                isSelected={value === spell.id}
                onSelect={() => handleSelect(spell.id)}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );

  // If children provided, use as trigger
  if (children) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          {dropdownContent}
        </PopoverContent>
      </Popover>
    );
  }

  // Default inline trigger with icon
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-7 w-40 justify-between gap-1.5 px-2 text-xs",
            className,
          )}
        >
          {isLoadingSelected && value ? (
            <span className="flex items-center gap-1.5 truncate text-primary">
              <FlaskInlineLoader className="size-4" />
            </span>
          ) : selectedSpell ? (
            <SpellTooltip spell={toSpellTooltipData(selectedSpell)}>
              <span className="flex items-center gap-1.5 truncate">
                <GameIcon
                  iconName={selectedSpell.fileName}
                  size="small"
                  className="shrink-0"
                />
                <span className="truncate">{selectedSpell.name}</span>
              </span>
            </SpellTooltip>
          ) : (
            <span className="truncate text-muted-foreground">
              {placeholder}
            </span>
          )}
          <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}

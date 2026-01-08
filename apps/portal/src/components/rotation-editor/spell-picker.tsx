"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { GameIcon } from "@/components/game/game-icon";
import { SpellTooltip } from "@/components/game/game-tooltip";
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

import { BM_HUNTER_SPELL_DATA, toTooltipData, type SpellData } from "./data";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SpellPickerProps {
  /** Current spell ID or name */
  value?: number | string;
  /** Called when spell selected */
  onSelect: (spellId: number) => void;
  /** Trigger element (for popover mode) */
  children?: React.ReactNode;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for trigger */
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SpellPicker({
  value,
  onSelect,
  children,
  placeholder = "Select spell...",
  className,
}: SpellPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedSpell = useMemo(() => {
    if (typeof value === "number") {
      return BM_HUNTER_SPELL_DATA.find((s) => s.id === value);
    }
    if (typeof value === "string") {
      return BM_HUNTER_SPELL_DATA.find((s) => s.name === value);
    }
    return undefined;
  }, [value]);

  const handleSelect = (spell: SpellData) => {
    onSelect(spell.id);
    setOpen(false);
  };

  // Render spell item with icon
  const renderSpellItem = (spell: SpellData) => (
    <CommandItem
      key={spell.id}
      value={spell.label}
      onSelect={() => handleSelect(spell)}
      className="flex items-center gap-2"
    >
      <CheckIcon
        className={cn(
          "size-4 shrink-0",
          selectedSpell?.id === spell.id ? "opacity-100" : "opacity-0",
        )}
      />
      <GameIcon iconName={spell.iconName} size="small" className="shrink-0" />
      <span className="truncate">{spell.label}</span>
      {spell.cooldown && (
        <span className="ml-auto text-[10px] text-muted-foreground">
          {spell.cooldown}s
        </span>
      )}
    </CommandItem>
  );

  // If children provided, use as trigger
  if (children) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search spells..." />
            <CommandList>
              <CommandEmpty>No spells found.</CommandEmpty>
              <CommandGroup>
                {BM_HUNTER_SPELL_DATA.map(renderSpellItem)}
              </CommandGroup>
            </CommandList>
          </Command>
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
          {selectedSpell ? (
            <SpellTooltip spell={toTooltipData(selectedSpell)}>
              <span className="flex items-center gap-1.5 truncate">
                <GameIcon
                  iconName={selectedSpell.iconName}
                  size="small"
                  className="shrink-0"
                />
                <span className="truncate">{selectedSpell.label}</span>
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
        <Command>
          <CommandInput placeholder="Search spells..." />
          <CommandList>
            <CommandEmpty>No spells found.</CommandEmpty>
            <CommandGroup>
              {BM_HUNTER_SPELL_DATA.map(renderSpellItem)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

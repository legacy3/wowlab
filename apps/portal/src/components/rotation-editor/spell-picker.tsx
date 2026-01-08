"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";

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

import { BM_HUNTER_SPELLS } from "./data";

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

// TODO: Replace with actual spell data from DBC
// For now, use mock spell data with IDs
const MOCK_SPELLS = BM_HUNTER_SPELLS.map((spell, index) => ({
  id: 100000 + index,
  name: spell.name,
  label: spell.label,
}));

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
      return MOCK_SPELLS.find((s) => s.id === value);
    }
    if (typeof value === "string") {
      return MOCK_SPELLS.find((s) => s.name === value);
    }
    return undefined;
  }, [value]);

  const handleSelect = (spell: (typeof MOCK_SPELLS)[0]) => {
    onSelect(spell.id);
    setOpen(false);
  };

  // If children provided, use as trigger
  if (children) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search spells..." />
            <CommandList>
              <CommandEmpty>No spells found.</CommandEmpty>
              <CommandGroup>
                {MOCK_SPELLS.map((spell) => (
                  <CommandItem
                    key={spell.id}
                    value={spell.label}
                    onSelect={() => handleSelect(spell)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        selectedSpell?.id === spell.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {spell.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Default inline trigger
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-7 w-32 justify-between text-xs", className)}
        >
          <span className="truncate">
            {selectedSpell?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-1 size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search spells..." />
          <CommandList>
            <CommandEmpty>No spells found.</CommandEmpty>
            <CommandGroup>
              {MOCK_SPELLS.map((spell) => (
                <CommandItem
                  key={spell.id}
                  value={spell.label}
                  onSelect={() => handleSelect(spell)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      selectedSpell?.id === spell.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {spell.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

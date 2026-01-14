"use client";

import { useState, useCallback, useMemo } from "react";
import {
  PlusIcon,
  SparklesIcon,
  PackageIcon,
  ListTreeIcon,
  ArrowLeftIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GameIcon } from "@/components/game/game-icon";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import { cn } from "@/lib/utils";
import { useSpell } from "@/hooks/use-spell";
import { useSpellSearch } from "@/hooks/use-spell-search";
import { useItemSearch } from "@/hooks/use-item-search";

import type { AllowedSpell } from "./spell-picker";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PickerView = "menu" | "spell" | "item" | "list";

interface ActionPickerProps {
  /** Allowed spells for this spec */
  allowedSpells: ReadonlyArray<AllowedSpell>;
  /** Available lists to call */
  callableLists: Array<{ id: string; name: string; label: string }>;
  /** Called when a spell is selected */
  onAddSpell: (spellId: number) => void;
  /** Called when an item is selected */
  onAddItem: (itemId: number) => void;
  /** Called when a list is selected */
  onAddCallList: (listId: string) => void;
  /** Custom trigger element */
  children?: React.ReactNode;
  /** Button variant for default trigger */
  variant?: "default" | "outline" | "dashed";
  /** Button size */
  size?: "default" | "sm";
  /** Additional class name */
  className?: string;
}

// -----------------------------------------------------------------------------
// Spell Item (fetches icon with hook)
// -----------------------------------------------------------------------------

function SpellItem({
  spellId,
  onSelect,
}: {
  spellId: number;
  onSelect: () => void;
}) {
  const { data: spell } = useSpell(spellId);

  return (
    <CommandItem
      value={spell?.name ?? `spell-${spellId}`}
      onSelect={onSelect}
      className="flex items-center gap-2"
    >
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
          <span className="text-muted-foreground">Loading...</span>
        </span>
      )}
    </CommandItem>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ActionPicker({
  allowedSpells,
  callableLists,
  onAddSpell,
  onAddItem,
  onAddCallList,
  children,
  variant = "outline",
  size = "sm",
  className,
}: ActionPickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>("menu");
  const [searchQuery, setSearchQuery] = useState("");

  // Spell search (filters allowed spells)
  const { data: filteredSpells } = useSpellSearch({
    query: searchQuery,
    allowedSpells,
    enabled: view === "spell",
  });

  // Item search (searches DBC)
  const { data: itemResults, isLoading: isSearchingItems } = useItemSearch({
    query: searchQuery,
    enabled: view === "item" && searchQuery.length >= 2,
  });

  const resetAndClose = useCallback(() => {
    setOpen(false);
    // Delay reset to avoid flash during close animation
    setTimeout(() => {
      setView("menu");
      setSearchQuery("");
    }, 150);
  }, []);

  const handleSpellSelect = useCallback(
    (spellId: number) => {
      onAddSpell(spellId);
      resetAndClose();
    },
    [onAddSpell, resetAndClose],
  );

  const handleItemSelect = useCallback(
    (itemId: number) => {
      onAddItem(itemId);
      resetAndClose();
    },
    [onAddItem, resetAndClose],
  );

  const handleCallListSelect = useCallback(
    (listId: string) => {
      onAddCallList(listId);
      resetAndClose();
    },
    [onAddCallList, resetAndClose],
  );

  const goBack = useCallback(() => {
    setView("menu");
    setSearchQuery("");
  }, []);

  // Show all spells when no query in spell view
  const displaySpells =
    view === "spell"
      ? searchQuery.trim()
        ? filteredSpells
        : allowedSpells
      : [];

  // Filter lists by search query
  const filteredLists = useMemo(() => {
    if (view !== "list") return [];
    if (!searchQuery.trim()) return callableLists;
    const query = searchQuery.toLowerCase();
    return callableLists.filter(
      (list) =>
        list.name.toLowerCase().includes(query) ||
        list.label.toLowerCase().includes(query),
    );
  }, [view, searchQuery, callableLists]);

  const trigger = children || (
    <Button
      variant={variant === "dashed" ? "outline" : variant}
      size={size}
      className={cn(variant === "dashed" && "border-dashed", className)}
    >
      <PlusIcon className="size-4 mr-1.5" />
      Add Action
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="p-0 w-72" align="start">
        {view === "menu" ? (
          // Main menu - 3 fixed categories
          <div className="p-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setView("spell")}
                className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-transparent hover:border-border hover:bg-accent/50 transition-colors"
              >
                <SparklesIcon className="size-5 text-amber-500" />
                <span className="text-xs font-medium">Spell</span>
              </button>
              <button
                onClick={() => setView("item")}
                className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-transparent hover:border-border hover:bg-accent/50 transition-colors"
              >
                <PackageIcon className="size-5 text-purple-500" />
                <span className="text-xs font-medium">Item</span>
              </button>
              <button
                onClick={() => setView("list")}
                className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-transparent hover:border-border hover:bg-accent/50 transition-colors"
              >
                <ListTreeIcon className="size-5 text-blue-500" />
                <span className="text-xs font-medium">List</span>
              </button>
            </div>
          </div>
        ) : view === "spell" ? (
          // Spell picker
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={goBack}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
              <CommandInput
                placeholder="Search spells..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0"
              />
            </div>
            <CommandList>
              {displaySpells.length === 0 ? (
                <CommandEmpty>No spells found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {displaySpells.map((spell) => (
                    <SpellItem
                      key={spell.id}
                      spellId={spell.id}
                      onSelect={() => handleSpellSelect(spell.id)}
                    />
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        ) : view === "item" ? (
          // Item picker
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={goBack}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
              <CommandInput
                placeholder="Search items..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0"
              />
            </div>
            <CommandList>
              {isSearchingItems ? (
                <div className="flex items-center justify-center py-6 text-primary">
                  <FlaskInlineLoader className="size-6" />
                </div>
              ) : searchQuery.length < 2 ? (
                <CommandEmpty>Type to search items...</CommandEmpty>
              ) : itemResults.length === 0 ? (
                <CommandEmpty>No items found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {itemResults.map((item) => (
                    <CommandItem
                      key={item.ID}
                      value={item.Display_lang ?? `item-${item.ID}`}
                      onSelect={() => handleItemSelect(item.ID)}
                      className="flex items-center gap-2"
                    >
                      <PackageIcon className="size-4 text-muted-foreground" />
                      <span className="truncate">
                        {item.Display_lang ?? `Item ${item.ID}`}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        ) : (
          // List picker
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={goBack}
              >
                <ArrowLeftIcon className="size-4" />
              </Button>
              <CommandInput
                placeholder="Search lists..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0"
              />
            </div>
            <CommandList>
              {callableLists.length === 0 ? (
                <CommandEmpty>No lists available.</CommandEmpty>
              ) : filteredLists.length === 0 ? (
                <CommandEmpty>No lists found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredLists.map((list) => (
                    <CommandItem
                      key={list.id}
                      value={list.label}
                      onSelect={() => handleCallListSelect(list.id)}
                      className="flex items-center gap-2"
                    >
                      <ListTreeIcon className="size-4 text-blue-500" />
                      <span className="truncate">{list.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

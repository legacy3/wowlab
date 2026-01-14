"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ExternalLinkIcon,
  PackageIcon,
} from "lucide-react";

import { FlaskInlineLoader } from "@/components/ui/flask-loader";

import { GameIcon } from "@/components/game/game-icon";
import {
  ItemTooltip,
  type ItemTooltipData,
  type ItemQuality,
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
import { useItem } from "@/hooks/use-item";
import { useItemSearch } from "@/hooks/use-item-search";
import type { Item } from "@wowlab/core/Schemas";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ItemPickerProps {
  /** Current item ID */
  value?: number;
  /** Called when item selected */
  onSelect: (itemId: number) => void;
  /** Trigger element (for popover mode) */
  children?: React.ReactNode;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for trigger */
  className?: string;
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
// Component
// -----------------------------------------------------------------------------

export function ItemPicker({
  value,
  onSelect,
  children,
  placeholder = "Select item...",
  className,
}: ItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch selected item data
  const { data: selectedItem, isLoading: isLoadingSelected } = useItem(value);

  // Search for items
  const { data: itemList, isLoading: isSearching } = useItemSearch({
    query: searchQuery,
    enabled: open,
    limit: 20,
  });

  const handleSelect = (itemId: number) => {
    onSelect(itemId);
    setOpen(false);
    setSearchQuery("");
  };

  // Render item in dropdown
  const renderItemOption = (item: {
    ID: number;
    Display_lang: string | null;
  }) => (
    <CommandItem
      key={item.ID}
      value={item.Display_lang ?? `Item ${item.ID}`}
      onSelect={() => handleSelect(item.ID)}
      className="flex items-center gap-2"
    >
      <CheckIcon
        className={cn(
          "size-4 shrink-0",
          value === item.ID ? "opacity-100" : "opacity-0",
        )}
      />
      <PackageIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{item.Display_lang ?? `Item ${item.ID}`}</span>
      <NextLink
        href={`/lab/inspector/item/${item.ID}`}
        className="ml-auto opacity-0 group-data-[selected=true]:opacity-100 hover:opacity-100 text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLinkIcon className="size-3" />
      </NextLink>
    </CommandItem>
  );

  const dropdownContent = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search items..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isSearching ? (
          <div className="flex items-center justify-center py-6 text-primary">
            <FlaskInlineLoader className="size-6" />
          </div>
        ) : searchQuery.length < 2 ? (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        ) : itemList.length === 0 ? (
          <CommandEmpty>No items found.</CommandEmpty>
        ) : (
          <CommandGroup>{itemList.map(renderItemOption)}</CommandGroup>
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
          ) : selectedItem ? (
            <ItemTooltip item={toItemTooltipData(selectedItem)}>
              <span className="flex items-center gap-1.5 truncate">
                <GameIcon
                  iconName={selectedItem.fileName}
                  size="small"
                  className="shrink-0"
                />
                <span className="truncate">{selectedItem.name}</span>
              </span>
            </ItemTooltip>
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

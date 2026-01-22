"use client";

import {
  type Combobox as ComboboxType,
  createListCollection,
} from "@ark-ui/react/combobox";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBoolean } from "ahooks";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo, useRef, useState } from "react";
import { Box, Flex, HStack } from "styled-system/jsx";

import { GameIcon } from "../../game";
import { Button, Combobox, Empty, Loader, Text } from "../../ui";

export interface GameObjectPickerConfig<TSearchResult, TData> {
  emptyMessage: string;
  getIconName: (data: TData) => string | null | undefined;
  getId: (item: TSearchResult) => number;
  getLabel: (item: TSearchResult) => string;
  getName: (data: TData) => string;
  noun: string;
  searchPlaceholder: string;
  selectPlaceholder: string;
  useData: (id: number | null | undefined) => {
    data: TData | null | undefined;
    isLoading: boolean;
  };
  useSearch: (opts: { query: string }) => {
    data: TSearchResult[];
    isLoading: boolean;
  };
}

export interface GameObjectPickerProps<TSearchResult, TData> {
  config: GameObjectPickerConfig<TSearchResult, TData>;
  onSelect: (id: number, name: string) => void;
  placeholder?: string;
  value?: number | null;
  variant?: "inline" | "input";
}

export interface PickerItem {
  iconName?: string | null;
  id: number;
  label: string;
  value: string;
}

interface DropdownItemProps<TData> {
  getIconName: GameObjectPickerConfig<unknown, TData>["getIconName"];
  getName: GameObjectPickerConfig<unknown, TData>["getName"];
  id: number;
  useData: GameObjectPickerConfig<unknown, TData>["useData"];
}

interface SelectedDisplayProps<TData> {
  getIconName: GameObjectPickerConfig<unknown, TData>["getIconName"];
  getName: GameObjectPickerConfig<unknown, TData>["getName"];
  id: number;
  noun: string;
  useData: GameObjectPickerConfig<unknown, TData>["useData"];
}

export function GameObjectPicker<TSearchResult, TData>({
  config,
  onSelect,
  placeholder,
  value,
  variant = "input",
}: GameObjectPickerProps<TSearchResult, TData>) {
  const { gameObjectPicker: content } = useIntlayer("editor");
  const [inputValue, setInputValue] = useState("");
  const [open, { set: setOpen, setFalse: closeDropdown }] = useBoolean(false);
  const { data: searchResults, isLoading } = config.useSearch({
    query: inputValue,
  });

  const collection = useMemo(() => {
    const items = searchResults.map((result) => ({
      id: config.getId(result),
      label: config.getLabel(result),
      value: String(config.getId(result)),
    }));
    return createListCollection({
      items,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
    });
  }, [searchResults, config]);

  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: collection.items.length,
    estimateSize: () => 40,
    getScrollElement: () => listRef.current,
    overscan: 5,
  });

  const handleInputChange = (details: ComboboxType.InputValueChangeDetails) => {
    setInputValue(details.inputValue);
  };

  const handleOpenChange = (details: { open: boolean }) => {
    setOpen(details.open);
    if (!details.open) {
      setInputValue("");
    }
  };

  const handleValueChange = (details: ComboboxType.ValueChangeDetails) => {
    const selected = searchResults.find(
      (r) => String(config.getId(r)) === details.value[0],
    );
    if (selected) {
      onSelect(config.getId(selected), config.getLabel(selected));
      closeDropdown();
    }
  };

  const searchPlaceholder = placeholder ?? config.searchPlaceholder;

  if (variant === "inline") {
    return (
      <Combobox.Root<PickerItem>
        open={open}
        onOpenChange={handleOpenChange}
        openOnClick
        inputBehavior="autohighlight"
        collection={collection}
        onInputValueChange={handleInputChange}
        onValueChange={handleValueChange}
      >
        <Combobox.Control>
          <Combobox.Trigger asChild>
            <Button variant="outline" size="sm">
              {value ? (
                <SelectedDisplay
                  id={value}
                  useData={config.useData}
                  getName={config.getName}
                  getIconName={config.getIconName}
                  noun={config.noun}
                />
              ) : (
                <Text textStyle="sm" color="fg.muted">
                  {config.selectPlaceholder}
                </Text>
              )}
              <ChevronDownIcon size={14} />
            </Button>
          </Combobox.Trigger>
          <Combobox.Input
            placeholder={content.search.value}
            style={{ opacity: 0, pointerEvents: "none", position: "absolute" }}
          />
        </Combobox.Control>

        <Combobox.Positioner>
          <Combobox.Content minW="64">
            <Box p="2" borderBottomWidth="1" borderColor="border.default">
              <Flex align="center" gap="2" px="2">
                <SearchIcon size={14} />
                <Combobox.Input
                  placeholder={searchPlaceholder}
                  style={{
                    background: "transparent",
                    border: "none",
                    flex: 1,
                    outline: "none",
                  }}
                  autoFocus
                />
                {isLoading && <Loader size="xs" />}
              </Flex>
            </Box>
            <Box ref={listRef} maxH="300px" overflow="auto">
              {collection.items.length > 0 && (
                <Combobox.List
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = collection.items[virtualRow.index];

                    return (
                      <Combobox.Item
                        key={item.value}
                        item={item}
                        style={{
                          height: `${virtualRow.size}px`,
                          left: 0,
                          position: "absolute",
                          top: 0,
                          transform: `translateY(${virtualRow.start}px)`,
                          width: "100%",
                        }}
                      >
                        <Combobox.ItemText>
                          <DropdownItem
                            id={item.id}
                            useData={config.useData}
                            getName={config.getName}
                            getIconName={config.getIconName}
                          />
                        </Combobox.ItemText>
                        <Combobox.ItemIndicator />
                      </Combobox.Item>
                    );
                  })}
                </Combobox.List>
              )}
            </Box>
            {collection.items.length === 0 &&
              !isLoading &&
              inputValue.length >= 2 && (
                <Combobox.Empty>
                  <Empty.Root variant="plain" size="sm">
                    <Empty.Title>{config.emptyMessage}</Empty.Title>
                  </Empty.Root>
                </Combobox.Empty>
              )}
            {collection.items.length === 0 && inputValue.length < 2 && (
              <Combobox.Empty>
                <Empty.Root variant="plain" size="sm">
                  <Empty.Title>{content.typeAtLeastNCharacters}</Empty.Title>
                </Empty.Root>
              </Combobox.Empty>
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Root>
    );
  }

  return (
    <Combobox.Root<PickerItem>
      openOnClick
      inputBehavior="autohighlight"
      collection={collection}
      onInputValueChange={handleInputChange}
      onValueChange={handleValueChange}
    >
      <Combobox.Control>
        <Flex
          align="center"
          justify="center"
          pos="absolute"
          left="0"
          top="0"
          bottom="0"
          px="3"
          color="fg.muted"
          pointerEvents="none"
        >
          <SearchIcon size={16} />
        </Flex>
        <Combobox.Input placeholder={searchPlaceholder} ps="10" />
        <Combobox.IndicatorGroup>
          {isLoading && <Loader size="xs" />}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Combobox.Positioner>
        <Combobox.Content>
          <Box ref={listRef} maxH="300px" overflow="auto">
            {collection.items.length > 0 && (
              <Combobox.List
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = collection.items[virtualRow.index];

                  return (
                    <Combobox.Item
                      key={item.value}
                      item={item}
                      style={{
                        height: `${virtualRow.size}px`,
                        left: 0,
                        position: "absolute",
                        top: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        width: "100%",
                      }}
                    >
                      <Combobox.ItemText>
                        <DropdownItem
                          id={item.id}
                          useData={config.useData}
                          getName={config.getName}
                          getIconName={config.getIconName}
                        />
                      </Combobox.ItemText>
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  );
                })}
              </Combobox.List>
            )}
          </Box>
          {collection.items.length === 0 &&
            !isLoading &&
            inputValue.length >= 2 && (
              <Combobox.Empty>
                <Empty.Root variant="plain" size="sm">
                  <Empty.Title>{config.emptyMessage}</Empty.Title>
                </Empty.Root>
              </Combobox.Empty>
            )}
          {collection.items.length === 0 && inputValue.length < 2 && (
            <Combobox.Empty>
              <Empty.Root variant="plain" size="sm">
                <Empty.Title>{content.typeAtLeastNCharacters}</Empty.Title>
              </Empty.Root>
            </Combobox.Empty>
          )}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  );
}

function DropdownItem<TData>({
  getIconName,
  getName,
  id,
  useData,
}: DropdownItemProps<TData>) {
  const { gameObjectPicker: content } = useIntlayer("editor");
  const { data } = useData(id);

  if (!data) {
    return (
      <HStack gap="2">
        <Loader size="xs" />
        <Text textStyle="sm" color="fg.muted">
          {content.loading}
        </Text>
      </HStack>
    );
  }

  return (
    <HStack gap="2" flex="1" minW="0">
      <GameIcon iconName={getIconName(data)} size="sm" />
      <Text textStyle="sm" truncate>
        {getName(data)}
      </Text>
      <Text textStyle="xs" color="fg.muted" fontFamily="mono" ml="auto">
        #{id}
      </Text>
    </HStack>
  );
}

function SelectedDisplay<TData>({
  getIconName,
  getName,
  id,
  noun,
  useData,
}: SelectedDisplayProps<TData>) {
  const { data, isLoading } = useData(id);

  if (isLoading) {
    return (
      <HStack gap="1.5">
        <Loader size="xs" />
      </HStack>
    );
  }

  if (!data) {
    return (
      <Text textStyle="sm" color="fg.muted">
        {noun} #{id}
      </Text>
    );
  }

  return (
    <HStack gap="1.5">
      <GameIcon iconName={getIconName(data)} size="sm" />
      <Text textStyle="sm" truncate>
        {getName(data)}
      </Text>
    </HStack>
  );
}

"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useIntlayer } from "next-intlayer";
import { useMemo } from "react";

import { Empty, Select } from "../../ui";

export interface SelectFieldProps {
  disabled?: boolean;
  emptyMessage?: string;
  minW?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  value: string | undefined;
  w?: string;
}

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export function SelectField({
  disabled = false,
  emptyMessage,
  minW,
  onChange,
  options,
  placeholder,
  size = "sm",
  value,
  w,
}: SelectFieldProps) {
  const { selectField: content } = useIntlayer("editor");
  const resolvedEmptyMessage = emptyMessage ?? content.noOptionsAvailable;
  const resolvedPlaceholder = placeholder ?? content.select;
  const collection = useMemo(
    () => createListCollection({ items: options }),
    [options],
  );

  if (options.length === 0) {
    return (
      <Empty.Root variant="plain" size="sm">
        <Empty.Title>{resolvedEmptyMessage}</Empty.Title>
      </Empty.Root>
    );
  }

  return (
    <Select.Root
      size={size}
      value={value ? [value] : []}
      collection={collection}
      disabled={disabled}
      onValueChange={(details) => {
        if (details.value[0]) {
          onChange(details.value[0]);
        }
      }}
    >
      <Select.Control>
        <Select.Trigger minW={minW} w={w}>
          <Select.ValueText placeholder={resolvedPlaceholder} />
          <Select.Indicator />
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {options.map((option) => (
            <Select.Item
              key={option.value}
              item={{ ...option, disabled: option.disabled }}
            >
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}

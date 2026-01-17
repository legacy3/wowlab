"use client";

import type {
  ActionWithRulesAndAddersProps,
  CombinatorSelectorProps,
  FieldSelectorProps,
  FullOption,
  OperatorSelectorProps,
  ValueEditorProps,
} from "react-querybuilder";

import { createListCollection } from "@ark-ui/react/combobox";
import { PlusIcon, XIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { useMemo, useState } from "react";

import { CONDITION_FIELDS, FIELD_CATEGORIES } from "@/lib/engine";

import { Button, Combobox, Empty, IconButton, Input } from "../../ui";
import { SelectField, type SelectOption } from "../common/select-field";

interface FieldItem {
  category: string;
  label: string;
  value: string;
}

const toSelectOptions = (
  options: FullOption[],
  uppercase = false,
): SelectOption[] =>
  options.map((opt) => ({
    label: uppercase ? opt.label.toUpperCase() : opt.label,
    value: opt.name,
  }));

export function AddGroupButton({
  disabled,
  handleOnClick,
}: ActionWithRulesAndAddersProps) {
  const t = useExtracted();

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={disabled}
      onClick={handleOnClick}
    >
      <PlusIcon size={12} />
      {t("Group")}
    </Button>
  );
}

export function AddRuleButton({
  disabled,
  handleOnClick,
}: ActionWithRulesAndAddersProps) {
  const t = useExtracted();

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={disabled}
      onClick={handleOnClick}
    >
      <PlusIcon size={12} />
      {t("Rule")}
    </Button>
  );
}

export function CombinatorSelector({
  disabled,
  handleOnChange,
  options,
  value,
}: CombinatorSelectorProps) {
  const t = useExtracted();
  const selectOptions = useMemo(
    () => toSelectOptions(options as FullOption[], true),
    [options],
  );

  return (
    <SelectField
      disabled={disabled}
      minW="20"
      onChange={handleOnChange}
      options={selectOptions}
      placeholder={t("...")}
      value={value}
    />
  );
}

export function FieldSelector({
  disabled,
  handleOnChange,
  value,
}: FieldSelectorProps) {
  const t = useExtracted();
  const [inputValue, setInputValue] = useState("");

  const allItems: FieldItem[] = useMemo(
    () =>
      CONDITION_FIELDS.map((field) => ({
        category: field.category,
        label: field.label,
        value: field.name,
      })),
    [],
  );

  const filteredItems = useMemo(() => {
    if (!inputValue) {
      return allItems;
    }
    const lower = inputValue.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.value.toLowerCase().includes(lower),
    );
  }, [allItems, inputValue]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, FieldItem[]>();
    for (const item of filteredItems) {
      const existing = groups.get(item.category) || [];
      existing.push(item);
      groups.set(item.category, existing);
    }
    return groups;
  }, [filteredItems]);

  const getCategoryLabel = (id: string) =>
    FIELD_CATEGORIES.find((c) => c.id === id)?.label ?? id;

  const collection = useMemo(
    () => createListCollection({ items: filteredItems }),
    [filteredItems],
  );

  return (
    <Combobox.Root
      size="sm"
      value={value ? [value] : []}
      disabled={disabled}
      collection={collection}
      onValueChange={(details) => handleOnChange(details.value[0] ?? "")}
      onInputValueChange={(details) => setInputValue(details.inputValue)}
      inputBehavior="autohighlight"
      openOnClick
      allowCustomValue={false}
    >
      <Combobox.Control minW="44">
        <Combobox.Input placeholder={t("Search fields...")} />
        <Combobox.IndicatorGroup>
          {value && <Combobox.ClearTrigger />}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content maxH="80" overflow="auto">
          {filteredItems.length === 0 ? (
            <Combobox.Empty>
              <Empty.Root variant="plain" size="sm">
                <Empty.Title>{t("No fields found")}</Empty.Title>
              </Empty.Root>
            </Combobox.Empty>
          ) : (
            Array.from(groupedItems.entries()).map(([categoryId, items]) => (
              <Combobox.ItemGroup key={categoryId}>
                <Combobox.ItemGroupLabel>
                  {getCategoryLabel(categoryId)}
                </Combobox.ItemGroupLabel>
                {items.map((item) => (
                  <Combobox.Item key={item.value} item={item}>
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
              </Combobox.ItemGroup>
            ))
          )}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  );
}

export function OperatorSelector({
  disabled,
  handleOnChange,
  options,
  value,
}: OperatorSelectorProps) {
  const t = useExtracted();
  const selectOptions = useMemo(
    () => toSelectOptions(options as FullOption[]),
    [options],
  );

  return (
    <SelectField
      disabled={disabled}
      minW="32"
      onChange={handleOnChange}
      options={selectOptions}
      placeholder={t("Operator...")}
      value={value}
    />
  );
}

export function RemoveButton({
  disabled,
  handleOnClick,
}: {
  handleOnClick: () => void;
  disabled?: boolean;
}) {
  const t = useExtracted();

  return (
    <IconButton
      size="xs"
      variant="plain"
      disabled={disabled}
      onClick={handleOnClick}
      aria-label={t("Remove")}
    >
      <XIcon size={14} />
    </IconButton>
  );
}

export function ValueEditor({
  disabled,
  handleOnChange,
  inputType,
  value,
  values,
}: ValueEditorProps) {
  const t = useExtracted();

  if (values && values.length > 0) {
    const selectOptions = toSelectOptions(values as FullOption[]);
    return (
      <SelectField
        disabled={disabled}
        minW="32"
        onChange={handleOnChange}
        options={selectOptions}
        placeholder={t("Select value...")}
        value={value ? String(value) : undefined}
      />
    );
  }

  return (
    <Input
      size="sm"
      type={inputType === "number" ? "number" : "text"}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => handleOnChange(e.target.value)}
      placeholder={t("Value...")}
      w={inputType === "number" ? "24" : "32"}
    />
  );
}

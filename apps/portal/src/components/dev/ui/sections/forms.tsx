"use client";

import {
  type Combobox as ComboboxType,
  useListCollection,
} from "@ark-ui/react/combobox";
import { useFilter } from "@ark-ui/react/locale";
import { createListCollection } from "@ark-ui/react/select";
import { MoonIcon, SunIcon } from "lucide-react";
import { HStack, Stack } from "styled-system/jsx";

import {
  Combobox,
  Empty,
  Field,
  Input,
  NumberInput,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

const selectCollection = createListCollection({
  items: fixtures.frameworks.slice(0, 4),
});

export function FormsSection() {
  return (
    <Section id="forms" title="Forms">
      <Stack gap="10">
        <InputDemo />
        <TextareaDemo />
        <NumberInputDemo />
        <SelectDemo />
        <ComboboxDemo />
        <SwitchDemo />
      </Stack>
    </Section>
  );
}

function ComboboxDemo() {
  const { contains } = useFilter({ sensitivity: "base" });
  const { collection, filter } = useListCollection({
    filter: contains,
    initialItems: fixtures.frameworks,
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });

  const handleInputChange = (details: ComboboxType.InputValueChangeDetails) => {
    filter(details.inputValue);
  };

  return (
    <Subsection title="Combobox">
      <DemoDescription>Searchable dropdown with filtering.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap" alignItems="flex-start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Combobox.Root
              key={size}
              collection={collection}
              onInputValueChange={handleInputChange}
              size={size}
              w="40"
            >
              <Combobox.Label>Size: {size}</Combobox.Label>
              <Combobox.Control>
                <Combobox.Input placeholder="Search..." />
                <Combobox.IndicatorGroup>
                  <Combobox.Trigger />
                </Combobox.IndicatorGroup>
              </Combobox.Control>
              <Combobox.Positioner>
                <Combobox.Content>
                  <Combobox.List>
                    {collection.items.map((item) => (
                      <Combobox.Item key={item.value} item={item}>
                        <Combobox.ItemText>{item.label}</Combobox.ItemText>
                        <Combobox.ItemIndicator />
                      </Combobox.Item>
                    ))}
                  </Combobox.List>
                  <Combobox.Empty>
                    <Empty.Root variant="plain" size="sm">
                      <Empty.Title>No results</Empty.Title>
                    </Empty.Root>
                  </Combobox.Empty>
                </Combobox.Content>
              </Combobox.Positioner>
            </Combobox.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function InputDemo() {
  return (
    <Subsection title="Input & Field">
      <DemoDescription>Text input with labels and validation.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Field.Root key={size} w="44">
                <Field.Label>Size: {size}</Field.Label>
                <Input size={size} placeholder="Enter text..." />
                <Field.HelperText>Helper text</Field.HelperText>
              </Field.Root>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>States</DemoLabel>
          <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
            <Field.Root w="44">
              <Field.Label>
                Required
                <Field.RequiredIndicator />
              </Field.Label>
              <Input placeholder="Required field" />
            </Field.Root>
            <Field.Root w="44" invalid>
              <Field.Label>Invalid</Field.Label>
              <Input placeholder="Invalid input" />
              <Field.ErrorText>This field has an error</Field.ErrorText>
            </Field.Root>
            <Field.Root w="44" disabled>
              <Field.Label>Disabled</Field.Label>
              <Input placeholder="Disabled input" />
            </Field.Root>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function NumberInputDemo() {
  return (
    <Subsection title="Number Input">
      <DemoDescription>Numeric input with controls.</DemoDescription>
      <DemoBox>
        <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <NumberInput.Root
              key={size}
              defaultValue="5"
              min={0}
              max={100}
              w="40"
              size={size}
            >
              <NumberInput.Label>Size: {size}</NumberInput.Label>
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function SelectDemo() {
  return (
    <Subsection title="Select">
      <DemoDescription>Dropdown selection.</DemoDescription>
      <DemoBox>
        <HStack gap="4" flexWrap="wrap" alignItems="flex-start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Select.Root
              key={size}
              collection={selectCollection}
              size={size}
              positioning={{ sameWidth: true }}
              w="40"
            >
              <Select.Label>Size: {size}</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select..." />
                  <Select.Indicator />
                </Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {selectCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function SwitchDemo() {
  return (
    <Subsection title="Switch">
      <DemoDescription>Toggle switch.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="6">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Switch.Root key={size} size={size}>
                <Switch.Control />
                <Switch.Label>{size}</Switch.Label>
                <Switch.HiddenInput />
              </Switch.Root>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="6">
            <Switch.Root defaultChecked>
              <Switch.Control>
                <Switch.Thumb>
                  <Switch.ThumbIndicator fallback={<SunIcon size={12} />}>
                    <MoonIcon size={12} />
                  </Switch.ThumbIndicator>
                </Switch.Thumb>
              </Switch.Control>
              <Switch.Label>With icon</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
            <Switch.Root disabled>
              <Switch.Control />
              <Switch.Label>Disabled</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function TextareaDemo() {
  return (
    <Subsection title="Textarea">
      <DemoDescription>Multi-line text input.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Field.Root key={size} w="44">
                <Field.Label>Size: {size}</Field.Label>
                <Textarea size={size} placeholder="Enter text..." rows={2} />
              </Field.Root>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
            {(["outline", "surface", "subtle", "flushed"] as const).map(
              (variant) => (
                <Field.Root key={variant} w="44">
                  <Field.Label>{variant}</Field.Label>
                  <Textarea
                    variant={variant}
                    placeholder="Enter text..."
                    rows={2}
                  />
                </Field.Root>
              ),
            )}
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

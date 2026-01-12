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
  Field,
  Input,
  NumberInput,
  Select,
  Switch,
  Text,
} from "@/components/ui";

import { fixtures, Section, Subsection } from "../../shared";

const selectCollection = createListCollection({
  items: fixtures.frameworks.slice(0, 4),
});

export function FormsSection() {
  return (
    <Section id="forms" title="Forms">
      <Stack gap="8">
        <InputDemo />
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
      <HStack gap="4" flexWrap="wrap" alignItems="flex-start">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Combobox.Root
            key={size}
            collection={collection}
            onInputValueChange={handleInputChange}
            size={size}
            w="44"
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
                  <Text color="fg.muted" textStyle="sm" p="2">
                    No results
                  </Text>
                </Combobox.Empty>
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox.Root>
        ))}
      </HStack>
    </Subsection>
  );
}

function InputDemo() {
  return (
    <Subsection title="Input & Field">
      <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Field.Root key={size} w="52">
            <Field.Label>Size: {size}</Field.Label>
            <Input size={size} placeholder="Enter text..." />
            <Field.HelperText>Helper text</Field.HelperText>
          </Field.Root>
        ))}
      </HStack>
      <HStack gap="6" flexWrap="wrap" alignItems="flex-start" mt="6">
        <Field.Root w="52">
          <Field.Label>
            Required
            <Field.RequiredIndicator />
          </Field.Label>
          <Input placeholder="Required field" />
        </Field.Root>
        <Field.Root w="52" invalid>
          <Field.Label>Invalid</Field.Label>
          <Input placeholder="Invalid input" />
          <Field.ErrorText>This field has an error</Field.ErrorText>
        </Field.Root>
        <Field.Root w="52" disabled>
          <Field.Label>Disabled</Field.Label>
          <Input placeholder="Disabled input" />
        </Field.Root>
      </HStack>
    </Subsection>
  );
}

function NumberInputDemo() {
  return (
    <Subsection title="Number Input">
      <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
        {(["sm", "md", "lg"] as const).map((size) => (
          <NumberInput.Root
            key={size}
            defaultValue="5"
            min={0}
            max={100}
            w="44"
            size={size}
          >
            <NumberInput.Label>Size: {size}</NumberInput.Label>
            <NumberInput.Input />
            <NumberInput.Control />
          </NumberInput.Root>
        ))}
      </HStack>
    </Subsection>
  );
}

function SelectDemo() {
  return (
    <Subsection title="Select">
      <HStack gap="4" flexWrap="wrap" alignItems="flex-start">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Select.Root
            key={size}
            collection={selectCollection}
            size={size}
            positioning={{ sameWidth: true }}
            w="44"
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
    </Subsection>
  );
}

function SwitchDemo() {
  return (
    <Subsection title="Switch">
      <Stack gap="4">
        <HStack gap="6">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Switch.Root key={size} size={size}>
              <Switch.Control />
              <Switch.Label>{size}</Switch.Label>
              <Switch.HiddenInput />
            </Switch.Root>
          ))}
        </HStack>
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
      </Stack>
    </Subsection>
  );
}

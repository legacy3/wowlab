"use client";

import {
  type Combobox as ComboboxType,
  useListCollection,
} from "@ark-ui/react/combobox";
import { useFilter } from "@ark-ui/react/locale";
import { createListCollection } from "@ark-ui/react/select";
import { MinusIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import { Center, HStack, Stack } from "styled-system/jsx";

import {
  Checkbox,
  Combobox,
  Empty,
  Field,
  Group,
  Input,
  NumberInput,
  PinInput,
  RadioCardGroup,
  RadioGroup,
  Select,
  Slider,
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
  items: fixtures.specs.slice(0, 4),
});

export function FormsSection() {
  return (
    <Section id="forms" title="Forms" lazy minHeight={3500}>
      <Stack gap="10">
        <InputDemo />
        <TextareaDemo />
        <NumberInputDemo />
        <SelectDemo />
        <ComboboxDemo />
        <SwitchDemo />
        <CheckboxDemo />
        <RadioGroupDemo />
        <RadioCardGroupDemo />
        <SliderDemo />
        <PinInputDemo />
      </Stack>
    </Section>
  );
}

function CheckboxDemo() {
  const [indeterminate, setIndeterminate] = useState(true);

  return (
    <Subsection title="Checkbox">
      <DemoDescription>
        Checkbox for binary choices with indeterminate state support.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="6" flexWrap="wrap">
            {(["solid", "surface", "subtle", "outline", "plain"] as const).map(
              (variant) => (
                <Checkbox.Root key={variant} variant={variant} defaultChecked>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{variant}</Checkbox.Label>
                </Checkbox.Root>
              ),
            )}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Colors</DemoLabel>
          <HStack gap="6">
            {(["accent", "blue", "green", "amber", "red"] as const).map(
              (color) => (
                <Checkbox.Root key={color} colorPalette={color} defaultChecked>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>{color}</Checkbox.Label>
                </Checkbox.Root>
              ),
            )}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>States</DemoLabel>
          <HStack gap="6">
            <Checkbox.Root>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Unchecked</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root defaultChecked>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Checked</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              checked={indeterminate ? "indeterminate" : false}
              onCheckedChange={() => setIndeterminate(!indeterminate)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Indeterminate</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root disabled>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Disabled</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root invalid>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>Invalid</Checkbox.Label>
            </Checkbox.Root>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function ComboboxDemo() {
  const { contains } = useFilter({ sensitivity: "base" });
  const { collection, filter } = useListCollection({
    filter: contains,
    initialItems: fixtures.specs,
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

function PinInputDemo() {
  return (
    <Subsection title="Pin Input">
      <DemoDescription>
        Multi-slot code input for OTP/verification.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Verification code (6-digit grouped)</DemoLabel>
          <PinInput.Root variant="surface" size="xl" otp placeholder="">
            <PinInput.HiddenInput />
            <PinInput.Control>
              <Group attached>
                {[0, 1, 2].map((id) => (
                  <PinInput.Input key={id} index={id} />
                ))}
              </Group>
              <Center>
                <MinusIcon size={20} />
              </Center>
              <Group attached>
                {[3, 4, 5].map((id) => (
                  <PinInput.Input key={id} index={id} />
                ))}
              </Group>
            </PinInput.Control>
          </PinInput.Root>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Masked (password-style)</DemoLabel>
          <PinInput.Root mask variant="surface" size="lg" placeholder="">
            <PinInput.HiddenInput />
            <PinInput.Control>
              <Group attached>
                {[0, 1, 2, 3].map((id) => (
                  <PinInput.Input key={id} index={id} />
                ))}
              </Group>
            </PinInput.Control>
          </PinInput.Root>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="8" flexWrap="wrap" alignItems="flex-start">
            {(["outline", "surface"] as const).map((variant) => (
              <Stack key={variant} gap="1">
                <span>{variant}</span>
                <PinInput.Root variant={variant} size="lg" placeholder="">
                  <PinInput.HiddenInput />
                  <PinInput.Control>
                    <Group attached>
                      {[0, 1, 2, 3].map((id) => (
                        <PinInput.Input key={id} index={id} />
                      ))}
                    </Group>
                  </PinInput.Control>
                </PinInput.Root>
              </Stack>
            ))}
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function RadioCardGroupDemo() {
  return (
    <Subsection title="Radio Card Group">
      <DemoDescription>Card-styled radio options.</DemoDescription>
      <DemoBox>
        <HStack gap="6" flexWrap="wrap" alignItems="flex-start">
          {(["outline", "surface", "subtle"] as const).map((variant) => (
            <RadioCardGroup.Root
              key={variant}
              variant={variant}
              defaultValue="react"
              w="52"
            >
              <RadioCardGroup.Label>Variant: {variant}</RadioCardGroup.Label>
              {fixtures.specs.slice(0, 3).map((item) => (
                <RadioCardGroup.Item key={item.value} value={item.value}>
                  <RadioCardGroup.ItemText>
                    {item.label}
                  </RadioCardGroup.ItemText>
                  <RadioCardGroup.ItemControl>
                    <RadioCardGroup.Indicator />
                  </RadioCardGroup.ItemControl>
                  <RadioCardGroup.ItemHiddenInput />
                </RadioCardGroup.Item>
              ))}
            </RadioCardGroup.Root>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function RadioGroupDemo() {
  return (
    <Subsection title="Radio Group">
      <DemoDescription>Mutually exclusive option selection.</DemoDescription>
      <DemoBox>
        <HStack gap="10" flexWrap="wrap" alignItems="flex-start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <RadioGroup.Root
              key={size}
              size={size}
              defaultValue="react"
              orientation="vertical"
            >
              <RadioGroup.Label>Size: {size}</RadioGroup.Label>
              {fixtures.specs.slice(0, 3).map((item) => (
                <RadioGroup.Item key={item.value} value={item.value}>
                  <RadioGroup.ItemControl>
                    <RadioGroup.Indicator />
                  </RadioGroup.ItemControl>
                  <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                  <RadioGroup.ItemHiddenInput />
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
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

function SliderDemo() {
  return (
    <Subsection title="Slider">
      <DemoDescription>Range input for numeric values.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Basic</DemoLabel>
          <Stack gap="6" w="72">
            <Slider.Root defaultValue={[50]}>
              <Slider.Label>Haste</Slider.Label>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <Slider.Root defaultValue={[30]}>
              <HStack justify="space-between">
                <Slider.Label>Crit</Slider.Label>
                <Slider.ValueText />
              </HStack>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
          </Stack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Range (dual thumb)</DemoLabel>
          <Stack gap="6" w="72">
            <Slider.Root defaultValue={[25, 75]}>
              <Slider.Label>Item level range</Slider.Label>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
          </Stack>
        </DemoBox>
      </Stack>
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

"use client";

import * as Checkbox from "@/components/ui/checkbox";
import * as Field from "@/components/ui/field";
import * as Fieldset from "@/components/ui/fieldset";
import * as Form from "@/components/ui/form";
import * as Input from "@/components/ui/input";
import * as NumberField from "@/components/ui/number-field";
import * as Radio from "@/components/ui/radio";
import * as Select from "@/components/ui/select";
import * as Slider from "@/components/ui/slider";
import * as Switch from "@/components/ui/switch";
import * as Toggle from "@/components/ui/toggle";
import * as ToggleGroup from "@/components/ui/toggle-group";
import { Bold, Italic, Minus, Plus, Underline } from "lucide-react";
import styles from "../index.module.scss";

export const id = "forms";
export const title = "Forms";

export function Content() {
  return (
    <>
      <div className={styles.subsection}>
        <h3>Input</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Input.Root placeholder="Type something..." />
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Number Field</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <NumberField.Root defaultValue={50} min={0} max={100}>
              <NumberField.Group>
                <NumberField.Decrement>
                  <Minus size={14} />
                </NumberField.Decrement>
                <NumberField.Input />
                <NumberField.Increment>
                  <Plus size={14} />
                </NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Select</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Select.Root>
              <Select.Trigger>
                <Select.Value>
                  {(value) => value || "Select a fruit..."}
                </Select.Value>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="apple">
                      <Select.ItemText>Apple</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="banana">
                      <Select.ItemText>Banana</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="orange">
                      <Select.ItemText>Orange</Select.ItemText>
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Checkbox</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <label className={styles.inlineLabel}>
              <Checkbox.Root defaultChecked>
                <Checkbox.Indicator />
              </Checkbox.Root>
              Accept terms and conditions
            </label>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Switch</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <label className={styles.inlineLabel}>
              <Switch.Root defaultChecked>
                <Switch.Thumb />
              </Switch.Root>
              Enable notifications
            </label>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Radio</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Radio.Group defaultValue="option1">
              <label className={styles.inlineLabel}>
                <Radio.Root value="option1">
                  <Radio.Indicator />
                </Radio.Root>
                Option 1
              </label>
              <label className={styles.inlineLabel}>
                <Radio.Root value="option2">
                  <Radio.Indicator />
                </Radio.Root>
                Option 2
              </label>
              <label className={styles.inlineLabel}>
                <Radio.Root value="option3">
                  <Radio.Indicator />
                </Radio.Root>
                Option 3
              </label>
            </Radio.Group>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Slider</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent} style={{ maxWidth: "20rem" }}>
            <Slider.Root defaultValue={50}>
              <Slider.Control>
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Toggle</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <Toggle.Root aria-label="Toggle bold">
              <Bold size={16} />
            </Toggle.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Toggle Group</h3>
        <div className={styles.demoRow}>
          <div className={styles.demoContent}>
            <ToggleGroup.Root>
              <Toggle.Root aria-label="Bold">
                <Bold size={16} />
              </Toggle.Root>
              <Toggle.Root aria-label="Italic">
                <Italic size={16} />
              </Toggle.Root>
              <Toggle.Root aria-label="Underline">
                <Underline size={16} />
              </Toggle.Root>
            </ToggleGroup.Root>
          </div>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3>Complete Form</h3>
        <Form.Root onSubmit={(e) => e.preventDefault()}>
          <Field.Root>
            <Field.Label>Username</Field.Label>
            <Input.Root placeholder="Enter username" required />
            <Field.Description>Choose a unique username.</Field.Description>
            <Field.Error match="valueMissing">
              Username is required.
            </Field.Error>
          </Field.Root>

          <Field.Root>
            <Field.Label>Email</Field.Label>
            <Input.Root type="email" placeholder="you@example.com" required />
            <Field.Error match="valueMissing">Email is required.</Field.Error>
            <Field.Error match="typeMismatch">Enter a valid email.</Field.Error>
          </Field.Root>

          <Fieldset.Root>
            <Fieldset.Legend>Preferences</Fieldset.Legend>
            <Field.Root>
              <Field.Label>Iterations</Field.Label>
              <NumberField.Root
                defaultValue={10000}
                min={1000}
                max={100000}
                step={1000}
              >
                <NumberField.Group>
                  <NumberField.Decrement>
                    <Minus size={14} />
                  </NumberField.Decrement>
                  <NumberField.Input />
                  <NumberField.Increment>
                    <Plus size={14} />
                  </NumberField.Increment>
                </NumberField.Group>
              </NumberField.Root>
              <Field.Description>
                Number of simulation iterations.
              </Field.Description>
            </Field.Root>
          </Fieldset.Root>

          <button type="submit">Submit</button>
        </Form.Root>
      </div>
    </>
  );
}

"use client";

import * as React from "react";
import { useState } from "react";
import type {
  ActionProps,
  DragHandleProps,
  FullField,
  NotToggleProps,
  RuleGroupProps,
  Schema,
  ValueEditorProps,
  VersatileSelectorProps,
} from "react-querybuilder";
import {
  getFirstOption,
  isOptionGroupArray,
  parseNumber,
  useValueEditor,
} from "react-querybuilder";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  LockIcon,
  PlusIcon,
  UnlockIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type OptionItem = { name: string; value?: string; label: string };
type OptionGroup = { label: string; options: OptionItem[] };

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Generate a summary of the rule group for collapsed view */
function getRuleGroupSummary(ruleGroup: RuleGroupProps["ruleGroup"]): string {
  if (!ruleGroup?.rules) {
    return "Empty";
  }
  const ruleCount = ruleGroup.rules.filter(
    (r) => typeof r === "object" && r !== null && "field" in r,
  ).length;
  const groupCount = ruleGroup.rules.filter(
    (r) => typeof r === "object" && r !== null && "rules" in r,
  ).length;

  const parts: string[] = [];
  if (ruleCount > 0) {
    parts.push(`${ruleCount} condition${ruleCount !== 1 ? "s" : ""}`);
  }
  if (groupCount > 0) {
    parts.push(`${groupCount} group${groupCount !== 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join(", ") : "Empty";
}

/** Get a label for the first rule to show in summary */
function getFirstRuleLabel(
  ruleGroup: RuleGroupProps["ruleGroup"],
): string | null {
  if (!ruleGroup?.rules?.length) {
    return null;
  }
  const firstRule = ruleGroup.rules[0];
  if (
    typeof firstRule === "object" &&
    firstRule !== null &&
    "field" in firstRule &&
    firstRule.field
  ) {
    // Try to make it readable
    const field = String(firstRule.field).replace(/_/g, " ");
    const value = firstRule.value ? ` = ${firstRule.value}` : "";

    return `${field}${value}`;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Collapsible Rule Group
// -----------------------------------------------------------------------------

export function ShadcnRuleGroup(props: RuleGroupProps) {
  const {
    ruleGroup,
    path,
    schema,
    actions,
    translations,
    disabled,
    parentDisabled,
    context,
  } = props;

  const isRoot = path.length === 0;
  const [isOpen, setIsOpen] = useState(isRoot); // Root always starts open

  const {
    controls: {
      combinatorSelector: CombinatorSelector,
      addRuleAction: AddRuleAction,
      addGroupAction: AddGroupAction,
      cloneGroupAction: CloneGroupAction,
      removeGroupAction: RemoveGroupAction,
      notToggle: NotToggle,
      rule: Rule,
      ruleGroup: RuleGroupComponent,
    },
  } = schema;

  const summary = getRuleGroupSummary(ruleGroup);
  const firstRuleLabel = getFirstRuleLabel(ruleGroup);
  const combinator = "combinator" in ruleGroup ? ruleGroup.combinator : "and";

  const commonProps = {
    level: path.length,
    path,
    disabled: disabled || parentDisabled,
    context,
    schema,
  };

  // Actions
  const handleAddRule = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.onRuleAdd(schema.createRule(), path, context);
  };

  const handleAddGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.onGroupAdd(schema.createRuleGroup(), path, context);
  };

  const handleRemoveGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.onGroupRemove(path);
  };

  const handleCombinatorChange = (value: string) => {
    actions.onPropChange("combinator", value, path);
  };

  const handleNotToggle = (checked: boolean) => {
    actions.onPropChange("not", checked, path);
  };

  // Root group - no collapse, just show header + body
  if (isRoot) {
    return (
      <div className="rounded-md border bg-card/50 p-2 space-y-1.5">
        {/* Root header */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ShadcnCombinatorToggle
            {...commonProps}
            options={schema.combinators}
            value={combinator}
            handleOnChange={handleCombinatorChange}
            title="Click to toggle AND/OR"
            rules={ruleGroup.rules}
            ruleGroup={ruleGroup}
          />
          {schema.showNotToggle && (
            <NotToggle
              {...commonProps}
              checked={!!ruleGroup.not}
              handleOnChange={handleNotToggle}
              label={translations.notToggle.label}
              title={translations.notToggle.title}
              ruleGroup={ruleGroup}
            />
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px]"
            onClick={handleAddRule}
          >
            <PlusIcon className="size-3 mr-0.5" />
            Rule
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px]"
            onClick={handleAddGroup}
          >
            <PlusIcon className="size-3 mr-0.5" />
            Group
          </Button>
        </div>

        {/* Rules */}
        <div className="space-y-1.5">
          {ruleGroup.rules.map((rule, idx) => {
            const rulePath = [...path, idx];
            // Skip string rules (shouldn't happen in normal use)
            if (typeof rule === "string") return null;
            if ("rules" in rule) {
              return (
                <RuleGroupComponent
                  key={rule.id ?? idx}
                  {...props}
                  ruleGroup={rule}
                  path={rulePath}
                  parentDisabled={disabled || parentDisabled}
                />
              );
            }
            return (
              <Rule
                key={rule.id ?? idx}
                {...commonProps}
                id={rule.id}
                rule={rule}
                field={rule.field}
                operator={rule.operator}
                value={rule.value}
                valueSource={rule.valueSource}
                actions={actions}
                translations={translations}
                parentDisabled={disabled || parentDisabled}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Nested group - collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border bg-muted/30 overflow-hidden">
        {/* Collapsible header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
            {isOpen ? (
              <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
            )}

            <Badge
              variant="outline"
              className="uppercase text-[10px] font-semibold"
            >
              {combinator}
            </Badge>

            {!isOpen && (
              <span className="text-sm text-muted-foreground truncate flex-1">
                {firstRuleLabel && (
                  <span className="text-foreground">{firstRuleLabel}</span>
                )}
                {firstRuleLabel && " · "}
                {summary}
              </span>
            )}

            {isOpen && (
              <div
                className="flex items-center gap-1 flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ShadcnCombinatorToggle
                  {...commonProps}
                  options={schema.combinators}
                  value={combinator}
                  handleOnChange={handleCombinatorChange}
                  title="Click to toggle AND/OR"
                  rules={ruleGroup.rules}
                  ruleGroup={ruleGroup}
                />
                {schema.showNotToggle && (
                  <NotToggle
                    {...commonProps}
                    checked={!!ruleGroup.not}
                    handleOnChange={handleNotToggle}
                    label={translations.notToggle.label}
                    title={translations.notToggle.title}
                    ruleGroup={ruleGroup}
                  />
                )}
              </div>
            )}

            {/* Actions - always visible */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleAddRule}
              >
                <PlusIcon className="size-3.5" />
              </Button>
              {schema.showCloneButtons && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    const newPath = [
                      ...path.slice(0, -1),
                      path[path.length - 1] + 1,
                    ];
                    actions.moveRule(path, newPath, true);
                  }}
                >
                  <CopyIcon className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={handleRemoveGroup}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Body */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/50">
            {ruleGroup.rules.map((rule, idx) => {
              const rulePath = [...path, idx];
              // Skip string rules (shouldn't happen in normal use)
              if (typeof rule === "string") return null;
              if ("rules" in rule) {
                return (
                  <RuleGroupComponent
                    key={rule.id ?? idx}
                    {...props}
                    ruleGroup={rule}
                    path={rulePath}
                    parentDisabled={disabled || parentDisabled}
                  />
                );
              }
              return (
                <Rule
                  key={rule.id ?? idx}
                  {...commonProps}
                  id={rule.id}
                  rule={rule}
                  field={rule.field}
                  operator={rule.operator}
                  value={rule.value}
                  valueSource={rule.valueSource}
                  actions={actions}
                  translations={translations}
                  parentDisabled={disabled || parentDisabled}
                />
              );
            })}
            {ruleGroup.rules.length === 0 && (
              <div className="text-sm text-muted-foreground py-2 text-center">
                No conditions. Click + to add.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// -----------------------------------------------------------------------------
// Combinator Toggle (AND/OR clickable badge instead of dropdown)
// -----------------------------------------------------------------------------

export function ShadcnCombinatorToggle(props: VersatileSelectorProps) {
  const { value, handleOnChange, disabled, className } = props;
  const currentValue = String(value ?? "and").toLowerCase();
  const isAnd = currentValue === "and";

  const toggle = () => {
    if (disabled) return;
    handleOnChange(isAnd ? "or" : "and");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
        "border hover:bg-accent cursor-pointer",
        isAnd
          ? "bg-muted text-foreground"
          : "bg-amber-500/20 text-amber-600 border-amber-500/30",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      title={`Click to switch to ${isAnd ? "OR" : "AND"}`}
    >
      {currentValue}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Value Selector
// -----------------------------------------------------------------------------

export function ShadcnValueSelector(props: VersatileSelectorProps) {
  const { className, options, title, disabled, value, handleOnChange } = props;

  // Normalize value to string
  const currentValue = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

  // Find option label for display
  const getLabel = (val: string): string => {
    if (isOptionGroupArray(options)) {
      for (const group of options as OptionGroup[]) {
        const opt = group.options.find((o) => (o.value ?? o.name) === val);
        if (opt) {
          return opt.label;
        }
      }

      return val;
    }
    const opt = (options as OptionItem[]).find(
      (o) => (o.value ?? o.name) === val,
    );
    return opt?.label ?? val;
  };

  const renderOptions = () => {
    if (isOptionGroupArray(options)) {
      return (options as OptionGroup[]).map((group) => (
        <SelectGroup key={group.label}>
          <SelectLabel>{group.label}</SelectLabel>
          {group.options.map((opt) => (
            <SelectItem
              key={opt.value ?? opt.name}
              value={String(opt.value ?? opt.name)}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ));
    }
    return (options as OptionItem[]).map((opt) => (
      <SelectItem
        key={opt.value ?? opt.name}
        value={String(opt.value ?? opt.name)}
      >
        {opt.label}
      </SelectItem>
    ));
  };

  return (
    <Select
      value={String(currentValue)}
      onValueChange={handleOnChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("h-6 min-w-[80px] text-xs", className)}
        title={title}
      >
        <SelectValue placeholder="Select...">
          {currentValue ? getLabel(String(currentValue)) : "Select..."}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">{renderOptions()}</SelectContent>
    </Select>
  );
}

// -----------------------------------------------------------------------------
// Value Editor
// -----------------------------------------------------------------------------

export function ShadcnValueEditor(allProps: ValueEditorProps) {
  const {
    operator,
    value,
    handleOnChange,
    title,
    className,
    type = "text",
    inputType,
    values = [],
    listsAsArrays,
    fieldData,
    disabled,
    separator,
    testID,
    schema,
    selectorComponent: SelectorComponent = schema.controls.valueSelector,
    ...propsForValueSelector
  } = allProps;

  const {
    valueAsArray,
    multiValueHandler,
    bigIntValueHandler,
    parseNumberMethod,
    valueListItemClassName,
    inputTypeCoerced,
  } = useValueEditor(allProps);

  if (operator === "null" || operator === "notNull") {
    return null;
  }

  const placeholder = fieldData?.placeholder ?? "";

  // Handle between/notBetween
  if (
    (operator === "between" || operator === "notBetween") &&
    (type === "select" || type === "text")
  ) {
    return (
      <span
        data-testid={testID}
        className={cn("flex items-center gap-1", className)}
        title={title}
      >
        {["from", "to"]
          .map((key, i) =>
            type === "text" ? (
              <Input
                key={key}
                type={inputTypeCoerced}
                placeholder={placeholder}
                value={valueAsArray[i] ?? ""}
                className={cn("h-6 w-[60px] text-xs", valueListItemClassName)}
                disabled={disabled}
                onChange={(e) => multiValueHandler(e.target.value, i)}
              />
            ) : (
              <SelectorComponent
                key={key}
                {...propsForValueSelector}
                schema={schema as Schema<FullField, string>}
                className={cn("w-[80px]", valueListItemClassName)}
                handleOnChange={(v) => multiValueHandler(v, i)}
                disabled={disabled}
                value={valueAsArray[i] ?? getFirstOption(values)}
                options={values}
                listsAsArrays={listsAsArrays}
              />
            ),
          )
          .reduce<React.ReactNode[]>((acc, el, i) => {
            if (i === 1) {
              acc.push(
                <span key="sep" className="text-muted-foreground text-[10px]">
                  {separator ?? "–"}
                </span>,
              );
            }
            acc.push(el);
            return acc;
          }, [])}
      </span>
    );
  }

  switch (type) {
    case "select":
    case "multiselect":
      return (
        <SelectorComponent
          {...propsForValueSelector}
          schema={schema as Schema<FullField, string>}
          testID={testID}
          className={className}
          title={title}
          handleOnChange={handleOnChange}
          disabled={disabled}
          value={value}
          options={values}
          multiple={type === "multiselect"}
          listsAsArrays={listsAsArrays}
        />
      );

    case "textarea":
      return (
        <Textarea
          data-testid={testID}
          placeholder={placeholder}
          value={value}
          title={title}
          className={cn("min-h-[40px] w-[160px] text-xs", className)}
          disabled={disabled}
          onChange={(e) => handleOnChange(e.target.value)}
        />
      );

    case "switch":
      return (
        <Switch
          data-testid={testID}
          title={title}
          className={className}
          checked={!!value}
          onCheckedChange={handleOnChange}
          disabled={disabled}
        />
      );

    case "checkbox":
      return (
        <Checkbox
          data-testid={testID}
          title={title}
          className={className}
          checked={!!value}
          onCheckedChange={handleOnChange}
          disabled={disabled}
        />
      );

    case "radio":
      return (
        <RadioGroup
          data-testid={testID}
          title={title}
          value={value}
          onValueChange={handleOnChange}
          className={cn("flex flex-row gap-3", className)}
          disabled={disabled}
        >
          {values.map((v) => (
            <div key={v.name} className="flex items-center gap-1.5">
              <RadioGroupItem value={v.name} id={`${testID}-${v.name}`} />
              <Label htmlFor={`${testID}-${v.name}`} className="text-sm">
                {v.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
  }

  if (inputType === "bigint") {
    return (
      <Input
        data-testid={testID}
        type={inputTypeCoerced}
        placeholder={placeholder}
        value={`${value}`}
        title={title}
        className={cn("h-6 w-[70px] text-xs", className)}
        disabled={disabled}
        onChange={(e) => bigIntValueHandler(e.target.value)}
      />
    );
  }

  return (
    <Input
      data-testid={testID}
      type={inputTypeCoerced}
      placeholder={placeholder}
      value={value}
      title={title}
      className={cn("h-6 w-[70px] text-xs", className)}
      disabled={disabled}
      onChange={(e) =>
        handleOnChange(
          parseNumber(e.target.value, { parseNumbers: parseNumberMethod }),
        )
      }
    />
  );
}

// -----------------------------------------------------------------------------
// Action Element
// -----------------------------------------------------------------------------

export function ShadcnActionElement({
  className,
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
}: ActionProps) {
  const isDisabledWithTranslation = disabled && disabledTranslation;
  const displayLabel = isDisabledWithTranslation
    ? disabledTranslation.label
    : label;
  const displayTitle = isDisabledWithTranslation
    ? disabledTranslation.title
    : title;

  // Check if label is a string (for add buttons) vs React element (for icons)
  const isTextLabel = typeof displayLabel === "string";

  if (isTextLabel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-6 px-2 text-xs", className)}
        title={displayTitle}
        onClick={handleOnClick}
        disabled={disabled && !disabledTranslation}
      >
        {displayLabel}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-6", className)}
      title={displayTitle}
      onClick={handleOnClick}
      disabled={disabled && !disabledTranslation}
    >
      {displayLabel}
    </Button>
  );
}

// -----------------------------------------------------------------------------
// Not Toggle
// -----------------------------------------------------------------------------

export function ShadcnNotToggle({
  className,
  handleOnChange,
  label,
  checked,
  title,
  disabled,
}: NotToggleProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Switch
        id="not-toggle"
        title={title}
        checked={checked}
        onCheckedChange={handleOnChange}
        disabled={disabled}
        className="scale-75"
      />
      <Label htmlFor="not-toggle" className="text-xs text-muted-foreground">
        {label}
      </Label>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Drag Handle
// -----------------------------------------------------------------------------

export const ShadcnDragHandle = React.forwardRef<
  HTMLSpanElement,
  DragHandleProps
>(({ className, title, disabled }, ref) => (
  <span
    ref={ref}
    className={cn(
      "cursor-grab text-muted-foreground hover:text-foreground",
      disabled && "cursor-not-allowed opacity-50",
      className,
    )}
    title={title}
  >
    <GripVerticalIcon className="size-3" />
  </span>
));
ShadcnDragHandle.displayName = "ShadcnDragHandle";

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

/** Full control elements with collapsible rule groups (for standalone use) */
export const shadcnControlElements = {
  ruleGroup: ShadcnRuleGroup,
  combinatorSelector: ShadcnCombinatorToggle,
  actionElement: ShadcnActionElement,
  valueSelector: ShadcnValueSelector,
  valueEditor: ShadcnValueEditor,
  notToggle: ShadcnNotToggle,
  dragHandle: ShadcnDragHandle,
};

/** Simpler controls without custom rule group (for inline/embedded use) */
export const shadcnInlineControlElements = {
  combinatorSelector: ShadcnCombinatorToggle,
  actionElement: ShadcnActionElement,
  valueSelector: ShadcnValueSelector,
  valueEditor: ShadcnValueEditor,
  notToggle: ShadcnNotToggle,
  dragHandle: ShadcnDragHandle,
};

export const shadcnTranslations = {
  addRule: { label: "+ Rule", title: "Add condition" },
  addGroup: { label: "+ Group", title: "Add condition group" },
  removeGroup: { label: <XIcon className="size-3" />, title: "Remove group" },
  removeRule: {
    label: <XIcon className="size-3" />,
    title: "Remove condition",
  },
  cloneRuleGroup: {
    label: <CopyIcon className="size-3" />,
    title: "Clone group",
  },
  cloneRule: {
    label: <CopyIcon className="size-3" />,
    title: "Clone condition",
  },
  lockGroup: { label: <UnlockIcon className="size-3" /> },
  lockRule: { label: <UnlockIcon className="size-3" /> },
  lockGroupDisabled: { label: <LockIcon className="size-3" /> },
  lockRuleDisabled: { label: <LockIcon className="size-3" /> },
};

export const shadcnControlClassnames = {
  rule: "flex flex-wrap items-center gap-1.5 rounded border bg-background px-2 py-1",
  ruleGroup: "space-y-1.5",
  fields: "min-w-[120px]",
  operators: "w-[50px]",
  value: "min-w-[100px] flex-1",
};

// -----------------------------------------------------------------------------
// Field & Operator Definitions (for QueryBuilder)
// -----------------------------------------------------------------------------

import type { Field } from "react-querybuilder";
import {
  BM_HUNTER_SPELL_OPTIONS,
  BM_HUNTER_AURA_OPTIONS,
  BM_HUNTER_TALENT_OPTIONS,
  createOption,
} from "./data";

type ConditionFieldName =
  | "cooldown_ready"
  | "focus"
  | "aura_active"
  | "aura_stacks"
  | "aura_remaining"
  | "target_health"
  | "charges"
  | "combo_points"
  | "talent_enabled"
  | "variable"
  | "active_enemies";

const selectField = (
  name: ConditionFieldName,
  label: string,
  values: ReturnType<typeof createOption>[],
  defaultValue: string,
): Field => ({
  name,
  value: name,
  label,
  valueEditorType: "select",
  values,
  defaultOperator: "=",
  defaultValue,
});

const numberField = (
  name: ConditionFieldName,
  label: string,
  defaultOperator: string,
  defaultValue: string,
): Field => ({
  name,
  value: name,
  label,
  inputType: "number",
  defaultOperator,
  defaultValue,
});

// Variable options will be dynamically populated, but we need defaults
const DEFAULT_VARIABLE_OPTIONS = [
  createOption("burst_phase", "$burst_phase"),
  createOption("pooling", "$pooling"),
];

export const CONDITION_FIELDS: Field[] = [
  // Variables - check if a variable evaluates to true
  selectField(
    "variable",
    "Variable",
    [...DEFAULT_VARIABLE_OPTIONS],
    "burst_phase",
  ),
  // Target conditions
  numberField("active_enemies", "Active Enemies", ">=", "3"),
  numberField("target_health", "Target Health %", "<", "20"),
  // Resource conditions
  numberField("focus", "Focus", ">=", "30"),
  numberField("combo_points", "Combo Points", ">=", "5"),
  // Cooldown conditions
  selectField(
    "cooldown_ready",
    "Cooldown Ready",
    [...BM_HUNTER_SPELL_OPTIONS],
    "kill_command",
  ),
  numberField("charges", "Charges", ">=", "1"),
  // Buff/aura conditions
  selectField(
    "aura_active",
    "Aura Active",
    [...BM_HUNTER_AURA_OPTIONS],
    "bestial_wrath",
  ),
  numberField("aura_stacks", "Aura Stacks", ">=", "3"),
  numberField("aura_remaining", "Aura Remaining (sec)", "<", "5"),
  // Talent conditions
  selectField(
    "talent_enabled",
    "Talent Enabled",
    [...BM_HUNTER_TALENT_OPTIONS],
    "killer_instinct",
  ),
];

export const COMPARISON_OPERATORS = [
  createOption("=", "="),
  createOption("!=", "!="),
  createOption(">", ">"),
  createOption(">=", ">="),
  createOption("<", "<"),
  createOption("<=", "<="),
];

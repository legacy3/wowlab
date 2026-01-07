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
  getOption,
  isOptionGroupArray,
  parseNumber,
  useValueEditor,
  useValueSelector,
  TestID,
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
  const ruleCount = ruleGroup.rules.filter((r) => typeof r === "object" && r !== null && "field" in r).length;
  const groupCount = ruleGroup.rules.filter((r) => typeof r === "object" && r !== null && "rules" in r).length;

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
function getFirstRuleLabel(ruleGroup: RuleGroupProps["ruleGroup"]): string | null {
  if (!ruleGroup?.rules?.length) {
    return null;
  }
  const firstRule = ruleGroup.rules[0];
  if (typeof firstRule === "object" && firstRule !== null && "field" in firstRule && firstRule.field) {
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
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Root header */}
        <div className="flex items-center gap-2 flex-wrap">
          <CombinatorSelector
            {...commonProps}
            options={schema.combinators}
            value={combinator}
            handleOnChange={handleCombinatorChange}
            title={translations.combinators.title}
            className="w-24"
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
          <Button variant="outline" size="sm" onClick={handleAddRule}>
            <PlusIcon className="size-3.5 mr-1" />
            Rule
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddGroup}>
            <PlusIcon className="size-3.5 mr-1" />
            Group
          </Button>
        </div>

        {/* Rules */}
        <div className="space-y-2">
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

            <Badge variant="outline" className="uppercase text-[10px] font-semibold">
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
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <CombinatorSelector
                  {...commonProps}
                  options={schema.combinators}
                  value={combinator}
                  handleOnChange={handleCombinatorChange}
                  title={translations.combinators.title}
                  className="w-20 h-7"
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
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="size-7" onClick={handleAddRule}>
                <PlusIcon className="size-3.5" />
              </Button>
              {schema.showCloneButtons && (
                <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                  const newPath = [...path.slice(0, -1), path[path.length - 1] + 1];
                  actions.moveRule(path, newPath, true);
                }}>
                  <CopyIcon className="size-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={handleRemoveGroup}>
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
// Value Selector
// -----------------------------------------------------------------------------

export function ShadcnValueSelector(props: VersatileSelectorProps) {
  const { val, onChange } = useValueSelector(props);
  const { className, options, title, disabled } = props;

  const currentValue = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
  const selectedOption = Array.isArray(val)
    ? null
    : getOption(options, val ?? "");

  const renderOptions = () => {
    if (isOptionGroupArray(options)) {
      return (options as OptionGroup[]).map((group) => (
        <SelectGroup key={group.label}>
          <SelectLabel>{group.label}</SelectLabel>
          {group.options.map((opt) => (
            <SelectItem key={opt.value ?? opt.name} value={String(opt.value ?? opt.name)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ));
    }
    return (options as OptionItem[]).map((opt) => (
      <SelectItem key={opt.value ?? opt.name} value={String(opt.value ?? opt.name)}>
        {opt.label}
      </SelectItem>
    ));
  };

  return (
    <Select
      value={String(currentValue)}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("h-8", className)} title={title}>
        <SelectValue placeholder="Select...">
          {selectedOption?.label ?? currentValue}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>{renderOptions()}</SelectContent>
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
  if ((operator === "between" || operator === "notBetween") && (type === "select" || type === "text")) {
    return (
      <span data-testid={testID} className={cn("flex items-center gap-2", className)} title={title}>
        {["from", "to"].map((key, i) =>
          type === "text" ? (
            <Input
              key={key}
              type={inputTypeCoerced}
              placeholder={placeholder}
              value={valueAsArray[i] ?? ""}
              className={cn("h-8 w-[80px]", valueListItemClassName)}
              disabled={disabled}
              onChange={(e) => multiValueHandler(e.target.value, i)}
            />
          ) : (
            <SelectorComponent
              key={key}
              {...propsForValueSelector}
              schema={schema as Schema<FullField, string>}
              className={cn("w-[100px]", valueListItemClassName)}
              handleOnChange={(v) => multiValueHandler(v, i)}
              disabled={disabled}
              value={valueAsArray[i] ?? getFirstOption(values)}
              options={values}
              listsAsArrays={listsAsArrays}
            />
          )
        ).reduce<React.ReactNode[]>((acc, el, i) => {
          if (i === 1) {
            acc.push(<span key="sep" className="text-muted-foreground text-xs">{separator ?? "–"}</span>);
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
          className={cn("min-h-[60px] w-[200px]", className)}
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
        className={cn("h-8 w-[100px]", className)}
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
      className={cn("h-8 w-[100px]", className)}
      disabled={disabled}
      onChange={(e) =>
        handleOnChange(parseNumber(e.target.value, { parseNumbers: parseNumberMethod }))
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

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      title={isDisabledWithTranslation ? disabledTranslation.title : title}
      onClick={handleOnClick}
      disabled={disabled && !disabledTranslation}
    >
      {isDisabledWithTranslation ? disabledTranslation.label : label}
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

export const ShadcnDragHandle = React.forwardRef<HTMLSpanElement, DragHandleProps>(
  ({ className, title, disabled }, ref) => (
    <span
      ref={ref}
      className={cn(
        "cursor-grab text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      title={title}
    >
      <GripVerticalIcon className="size-4" />
    </span>
  )
);
ShadcnDragHandle.displayName = "ShadcnDragHandle";

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

/** Full control elements with collapsible rule groups (for standalone use) */
export const shadcnControlElements = {
  ruleGroup: ShadcnRuleGroup,
  actionElement: ShadcnActionElement,
  valueSelector: ShadcnValueSelector,
  valueEditor: ShadcnValueEditor,
  notToggle: ShadcnNotToggle,
  dragHandle: ShadcnDragHandle,
};

/** Simpler controls without custom rule group (for inline/embedded use) */
export const shadcnInlineControlElements = {
  actionElement: ShadcnActionElement,
  valueSelector: ShadcnValueSelector,
  valueEditor: ShadcnValueEditor,
  notToggle: ShadcnNotToggle,
  dragHandle: ShadcnDragHandle,
};

export const shadcnTranslations = {
  removeGroup: { label: <XIcon className="size-3.5" /> },
  removeRule: { label: <XIcon className="size-3.5" /> },
  cloneRuleGroup: { label: <CopyIcon className="size-3.5" /> },
  cloneRule: { label: <CopyIcon className="size-3.5" /> },
  lockGroup: { label: <UnlockIcon className="size-3.5" /> },
  lockRule: { label: <UnlockIcon className="size-3.5" /> },
  lockGroupDisabled: { label: <LockIcon className="size-3.5" /> },
  lockRuleDisabled: { label: <LockIcon className="size-3.5" /> },
};

export const shadcnControlClassnames = {
  rule: "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5",
  fields: "w-[140px]",
  operators: "w-[80px]",
  value: "flex-1",
};

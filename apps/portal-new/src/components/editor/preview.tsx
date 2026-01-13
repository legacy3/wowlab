"use client";

import type { RuleGroupType, RuleType } from "react-querybuilder";

import { useBoolean } from "ahooks";
import {
  BracesIcon,
  CheckIcon,
  ClipboardIcon,
  Code2Icon,
  LayoutGridIcon,
  TextIcon,
} from "lucide-react";
import { useExtracted } from "next-intl";
import { useMemo, useState } from "react";
import { Box, Flex, HStack, VStack } from "styled-system/jsx";

import { useEditor } from "@/lib/state/editor";

import type { ActionList, Variable } from "./types";

import { Button, Card, Code, Text, Tooltip } from "../ui";

type PreviewMode = "visual" | "natural" | "dsl" | "json";

interface PreviewModeConfig {
  icon: typeof LayoutGridIcon;
  label: string;
  value: PreviewMode;
}

const PREVIEW_MODES: PreviewModeConfig[] = [
  { icon: LayoutGridIcon, label: "Visual", value: "visual" },
  { icon: TextIcon, label: "Natural", value: "natural" },
  { icon: Code2Icon, label: "DSL", value: "dsl" },
  { icon: BracesIcon, label: "JSON", value: "json" },
];

interface GeneratorContext {
  actionLists: ActionList[];
  defaultListId: string;
  description: string;
  name: string;
  t: TranslationFn;
  variables: Variable[];
}

// TODO Why is this here?
type TranslationFn = (key: string, values?: Record<string, string>) => string;

export function Preview() {
  const t = useExtracted();
  const name = useEditor((s) => s.name);
  const description = useEditor((s) => s.description);
  const variables = useEditor((s) => s.variables);
  const actionLists = useEditor((s) => s.actionLists);
  const defaultListId = useEditor((s) => s.defaultListId);

  const [previewMode, setPreviewMode] = useState<PreviewMode>("dsl");
  const [copied, { setFalse: clearCopied, setTrue: setCopied }] =
    useBoolean(false);

  const generatorContext = useMemo<GeneratorContext>(
    () => ({
      actionLists,
      defaultListId,
      description,
      name,
      t,
      variables,
    }),
    [name, description, variables, actionLists, defaultListId, t],
  );

  const content = useMemo(() => {
    switch (previewMode) {
      case "dsl":
        return generateDSL(generatorContext);
      case "json":
        return generateJSON(generatorContext);
      case "natural":
        return generateNatural(generatorContext);
      default:
        return "";
    }
  }, [previewMode, generatorContext]);

  const handleCopy = async () => {
    const textToCopy =
      previewMode === "visual" ? generateDSL(generatorContext) : content;
    await navigator.clipboard.writeText(textToCopy);
    setCopied();
    setTimeout(clearCopied, 2000);
  };

  return (
    <Box maxW="4xl" mx="auto">
      <VStack gap="4" alignItems="stretch">
        <Flex align="center" justify="space-between" gap="4">
          <HStack
            gap="0"
            p="1"
            bg="bg.subtle"
            borderRadius="lg"
            borderWidth="1"
            borderColor="border.default"
          >
            {PREVIEW_MODES.map((mode) => (
              <Button
                key={mode.value}
                variant={previewMode === mode.value ? "solid" : "plain"}
                size="sm"
                onClick={() => setPreviewMode(mode.value)}
              >
                <mode.icon size={14} />
                {mode.label}
              </Button>
            ))}
          </HStack>

          <Tooltip content={copied ? t("Copied!") : t("Copy as DSL")}>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <CheckIcon size={16} /> : <ClipboardIcon size={16} />}
              {copied ? t("Copied") : t("Copy")}
            </Button>
          </Tooltip>
        </Flex>

        {previewMode === "visual" ? (
          <VisualPreview />
        ) : (
          <CodeBlock code={content} mode={previewMode} />
        )}
      </VStack>
    </Box>
  );
}

const LANGUAGE_MAP: Record<PreviewMode, string | undefined> = {
  dsl: "javascript",
  json: "json",
  natural: undefined,
  visual: undefined,
};

function CodeBlock({ code, mode }: { code: string; mode: PreviewMode }) {
  const language = LANGUAGE_MAP[mode];

  if (language) {
    return (
      <Box maxH="calc(100vh - 20rem)" overflow="auto">
        <Code language={language}>{code}</Code>
      </Box>
    );
  }

  return (
    <Box
      as="pre"
      p="4"
      bg="bg.subtle"
      borderRadius="lg"
      borderWidth="1"
      borderColor="border.default"
      overflow="auto"
      fontFamily="mono"
      textStyle="sm"
      lineHeight="relaxed"
      whiteSpace="pre"
      maxH="calc(100vh - 20rem)"
    >
      {code}
    </Box>
  );
}

function formatConditionForDSL(condition: RuleGroupType): string {
  if (!condition.rules || condition.rules.length === 0) {
    return "";
  }

  const parts = condition.rules.map(formatRuleForDSL).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }

  const separator = condition.combinator === "and" ? "&" : "|";
  const result = parts.join(separator);

  return condition.not ? `!(${result})` : result;
}

function formatConditionForNatural(
  condition: RuleGroupType,
  t: TranslationFn,
): string {
  if (!condition.rules || condition.rules.length === 0) {
    return "";
  }

  const parts = condition.rules
    .map((rule) => formatRuleForNatural(rule, t))
    .filter(Boolean);
  if (parts.length === 0) {
    return "";
  }

  const separator = condition.combinator === "and" ? " AND " : " OR ";
  return parts.join(separator);
}

function formatRuleForDSL(rule: RuleType | RuleGroupType): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    const fieldName = String(field).replace(/_/g, ".");
    return `${fieldName}${operator}${value}`;
  }

  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) {
    return "";
  }

  const parts = group.rules.map(formatRuleForDSL).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0];
  }

  const separator = group.combinator === "and" ? "&" : "|";
  return `(${parts.join(separator)})`;
}

function formatRuleForNatural(
  rule: RuleType | RuleGroupType,
  t: TranslationFn,
): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    const fieldName = String(field).replace(/_/g, " ");

    const opMap: Record<string, string> = {
      "!=": t("does not equal"),
      "<": t("is less than"),
      "<=": t("is at most"),
      "=": t("equals"),
      ">": t("is greater than"),
      ">=": t("is at least"),
    };

    const opText = opMap[String(operator)] || String(operator);
    return `${fieldName} ${opText} ${value}`;
  }

  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) {
    return "";
  }

  const parts = group.rules
    .map((r) => formatRuleForNatural(r, t))
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const separator = group.combinator === "and" ? " AND " : " OR ";

  return parts.join(separator);
}

function generateDSL(ctx: GeneratorContext): string {
  const lines: string[] = [];

  lines.push(`# ${ctx.name || ctx.t("Untitled Rotation")}`);
  if (ctx.description) {
    lines.push(`# ${ctx.description}`);
  }
  lines.push("");

  if (ctx.variables.length > 0) {
    lines.push("variables:");
    for (const v of ctx.variables) {
      lines.push(`  $${v.name} = ${v.expression}`);
    }
    lines.push("");
  }

  for (const list of ctx.actionLists) {
    lines.push(`actions.${list.name}:`);

    for (const action of list.actions) {
      if (!action.enabled) {
        continue;
      }

      let actionStr: string;
      if (action.type === "call_action_list") {
        const targetList = ctx.actionLists.find((l) => l.id === action.listId);
        actionStr = `call_action_list,name=${targetList?.name ?? action.listId}`;
      } else if (action.type === "item") {
        actionStr = `use_item,id=${action.itemId ?? 0}`;
      } else {
        actionStr = `spell,id=${action.spellId ?? 0}`;
      }

      const cond = formatConditionForDSL(action.condition);
      lines.push(cond ? `  ${actionStr},if=${cond}` : `  ${actionStr}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function generateJSON(ctx: GeneratorContext): string {
  return JSON.stringify(
    {
      defaultListId: ctx.defaultListId,
      description: ctx.description,
      lists: ctx.actionLists,
      name: ctx.name,
      variables: ctx.variables,
    },
    null,
    2,
  );
}

function generateNatural(ctx: GeneratorContext): string {
  const lines: string[] = [];

  lines.push(ctx.name || ctx.t("Untitled Rotation"));
  if (ctx.description) {
    lines.push(ctx.description);
  }
  lines.push("");

  if (ctx.variables.length > 0) {
    lines.push(ctx.t("Variables:"));
    for (const variable of ctx.variables) {
      lines.push(`  - ${variable.name}: ${variable.expression}`);
    }
    lines.push("");
  }

  for (const list of ctx.actionLists) {
    const isDefault = list.id === ctx.defaultListId;
    const title = isDefault ? `${list.label} (default):` : `${list.label}:`;
    lines.push(title);

    let priority = 1;
    for (const action of list.actions) {
      if (!action.enabled) {
        continue;
      }

      let actionName: string;
      if (action.type === "call_action_list") {
        const targetList = ctx.actionLists.find((l) => l.id === action.listId);
        actionName = ctx.t("Call {list}", {
          list: targetList?.label ?? ctx.t("Unknown"),
        });
      } else if (action.type === "item") {
        actionName = ctx.t("Use Item #{id}", { id: String(action.itemId) });
      } else {
        actionName = ctx.t("Spell #{id}", { id: String(action.spellId) });
      }

      const conditionStr = formatConditionForNatural(action.condition, ctx.t);
      if (conditionStr) {
        lines.push(`  ${priority}. ${actionName} - when ${conditionStr}`);
      } else {
        lines.push(`  ${priority}. ${actionName}`);
      }
      priority++;
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function isRuleType(rule: RuleType | RuleGroupType): rule is RuleType {
  return "field" in rule && "operator" in rule;
}

function VisualPreview() {
  const t = useExtracted();

  return (
    <Card.Root>
      <Card.Body py="12">
        <VStack gap="2">
          <LayoutGridIcon size={32} strokeWidth={1.5} />
          <Text color="fg.muted" textAlign="center">
            {t("Visual preview coming soon")}
          </Text>
          <Text color="fg.subtle" textStyle="sm" textAlign="center">
            {t("Use the DSL or Natural tabs to preview your rotation")}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

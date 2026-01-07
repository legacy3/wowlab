"use client";

import { Copy, FileCode, FileJson, FileText, Bug } from "lucide-react";
import { useMemo, useState } from "react";
import type { RuleGroupType, RuleType } from "react-querybuilder";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

import type { RotationData } from "./types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface RotationPreviewProps {
  data: RotationData;
}

// -----------------------------------------------------------------------------
// Format Generators
// -----------------------------------------------------------------------------

function isRuleType(rule: RuleType | RuleGroupType): rule is RuleType {
  return "field" in rule && "operator" in rule;
}

function formatConditionForDSL(rule: RuleType | RuleGroupType): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    // Format field names nicely
    const fieldName = String(field).replace(/_/g, ".");
    return `${fieldName}${operator}${value}`;
  }

  // It's a group
  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) return "";

  const parts = group.rules.map(formatConditionForDSL).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const separator = group.combinator === "and" ? "&" : "|";
  return `(${parts.join(separator)})`;
}

function formatConditionsForDSL(conditions: RuleGroupType): string {
  if (!conditions.rules || conditions.rules.length === 0) return "";

  const parts = conditions.rules.map(formatConditionForDSL).filter(Boolean);
  if (parts.length === 0) return "";

  const separator = conditions.combinator === "and" ? "&" : "|";
  return parts.join(separator);
}

function generateDSL(data: RotationData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${data.specName} Rotation`);
  lines.push("");

  // Variables
  if (data.variables.length > 0) {
    lines.push("variables:");
    for (const variable of data.variables) {
      lines.push(`  $${variable.name} = ${variable.expression}`);
    }
    lines.push("");
  }

  // Action lists
  for (const list of data.actionLists) {
    lines.push(`actions.${list.name}:`);

    for (const action of list.actions) {
      if (!action.enabled) continue;

      const conditionStr = formatConditionsForDSL(action.conditions);
      if (conditionStr) {
        lines.push(`  ${action.spell},if=${conditionStr}`);
      } else {
        lines.push(`  ${action.spell}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function formatConditionForNatural(rule: RuleType | RuleGroupType): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    const fieldName = String(field).replace(/_/g, " ");

    // Make operator more readable
    const opMap: Record<string, string> = {
      "=": "equals",
      "!=": "does not equal",
      ">": "is greater than",
      ">=": "is at least",
      "<": "is less than",
      "<=": "is at most",
    };

    const opText = opMap[String(operator)] || String(operator);
    return `${fieldName} ${opText} ${value}`;
  }

  // It's a group
  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) return "";

  const parts = group.rules.map(formatConditionForNatural).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const separator = group.combinator === "and" ? " AND " : " OR ";
  return parts.join(separator);
}

function formatConditionsForNatural(conditions: RuleGroupType): string {
  if (!conditions.rules || conditions.rules.length === 0) return "";

  const parts = conditions.rules.map(formatConditionForNatural).filter(Boolean);
  if (parts.length === 0) return "";

  const separator = conditions.combinator === "and" ? " AND " : " OR ";
  return parts.join(separator);
}

function generateNatural(data: RotationData): string {
  const lines: string[] = [];

  // Header
  lines.push(data.specName + " Rotation");
  lines.push("");

  // Variables
  if (data.variables.length > 0) {
    lines.push("Variables:");
    for (const variable of data.variables) {
      lines.push(`- ${variable.name}: ${variable.expression}`);
    }
    lines.push("");
  }

  // Action lists
  for (const list of data.actionLists) {
    const isDefault = list.name === data.defaultList;
    const title = isDefault ? `${list.label} Priority:` : `${list.label}:`;
    lines.push(title);

    let priority = 1;
    for (const action of list.actions) {
      if (!action.enabled) continue;

      const spellName = action.spell
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const conditionStr = formatConditionsForNatural(action.conditions);
      if (conditionStr) {
        lines.push(`${priority}. Cast ${spellName} when ${conditionStr}`);
      } else {
        lines.push(`${priority}. Cast ${spellName} (always)`);
      }
      priority++;
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function generateJSON(data: RotationData): string {
  return JSON.stringify(data, null, 2);
}

function generateDebug(data: RotationData): string {
  const debug = {
    summary: {
      specName: data.specName,
      defaultList: data.defaultList,
      variableCount: data.variables.length,
      listCount: data.actionLists.length,
      totalActions: data.actionLists.reduce(
        (sum, list) => sum + list.actions.length,
        0,
      ),
      enabledActions: data.actionLists.reduce(
        (sum, list) => sum + list.actions.filter((a) => a.enabled).length,
        0,
      ),
    },
    variables: data.variables.map((v) => ({
      id: v.id,
      name: v.name,
      expressionLength: v.expression.length,
    })),
    lists: data.actionLists.map((list) => ({
      id: list.id,
      name: list.name,
      isDefault: list.name === data.defaultList,
      actions: list.actions.map((action) => ({
        id: action.id,
        spell: action.spell,
        enabled: action.enabled,
        conditionCount: action.conditions.rules?.length ?? 0,
        combinator: action.conditions.combinator,
      })),
    })),
  };

  return JSON.stringify(debug, null, 2);
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface CodeBlockProps {
  content: string;
  language: string;
  onCopy: () => void;
}

function CodeBlock({ content, language, onCopy }: CodeBlockProps) {
  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "absolute right-2 top-2 z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground hover:bg-muted/80",
        )}
        onClick={onCopy}
        title={`Copy ${language}`}
      >
        <Copy className="size-4" />
      </Button>
      <ScrollArea className="h-[400px] rounded-md border bg-muted/50">
        <pre className="p-4 text-sm font-mono">
          <code className="text-foreground/90 whitespace-pre">{content}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

type TabValue = "dsl" | "natural" | "json" | "debug";

export function RotationPreview({ data }: RotationPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("dsl");
  const [, copyToClipboard] = useCopyToClipboard("rotation");

  const dslContent = useMemo(() => generateDSL(data), [data]);
  const naturalContent = useMemo(() => generateNatural(data), [data]);
  const jsonContent = useMemo(() => generateJSON(data), [data]);
  const debugContent = useMemo(() => generateDebug(data), [data]);

  const handleCopy = (content: string) => {
    copyToClipboard(content);
  };

  return (
    <div className="flex flex-col gap-2">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="dsl" className="gap-1.5">
            <FileCode className="size-4" />
            DSL
          </TabsTrigger>
          <TabsTrigger value="natural" className="gap-1.5">
            <FileText className="size-4" />
            Natural
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-1.5">
            <FileJson className="size-4" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-1.5">
            <Bug className="size-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dsl">
          <CodeBlock
            content={dslContent}
            language="DSL"
            onCopy={() => handleCopy(dslContent)}
          />
        </TabsContent>

        <TabsContent value="natural">
          <CodeBlock
            content={naturalContent}
            language="natural language"
            onCopy={() => handleCopy(naturalContent)}
          />
        </TabsContent>

        <TabsContent value="json">
          <CodeBlock
            content={jsonContent}
            language="JSON"
            onCopy={() => handleCopy(jsonContent)}
          />
        </TabsContent>

        <TabsContent value="debug">
          <CodeBlock
            content={debugContent}
            language="debug info"
            onCopy={() => handleCopy(debugContent)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { RotationData } from "./types";

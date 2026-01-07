"use client";

import { useCallback, useState } from "react";
import { QueryBuilder, formatQuery } from "react-querybuilder";
import type { RuleGroupType } from "react-querybuilder";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  shadcnControlElements,
  shadcnControlClassnames,
  shadcnTranslations,
} from "./shadcn-controls";
import {
  CONDITION_FIELDS,
  INITIAL_QUERY,
  COMPARISON_OPERATORS,
  type RotationRuleGroup,
} from "./types";

/**
 * Format the query as a rotation DSL string
 */
function formatAsRotationDSL(query: RuleGroupType): string {
  const formatRule = (
    rule: RuleGroupType["rules"][number],
    indent: number
  ): string => {
    const spaces = "  ".repeat(indent);

    if ("rules" in rule) {
      // It's a group
      const combinator = rule.combinator?.toUpperCase() || "AND";
      const children = rule.rules
        .map((r) => formatRule(r, indent + 1))
        .join(`\n${spaces}${combinator}\n`);
      return `${spaces}(\n${children}\n${spaces})`;
    }

    // It's a rule
    const { field, operator, value } = rule;
    return `${spaces}${field} ${operator} ${JSON.stringify(value)}`;
  };

  const combinator = query.combinator?.toUpperCase() || "AND";
  return query.rules
    .map((r) => formatRule(r, 0))
    .join(`\n${combinator}\n`);
}

/**
 * Format as TOML-style condition
 */
function formatAsTomlCondition(query: RuleGroupType): string {
  const formatRule = (rule: RuleGroupType["rules"][number]): string => {
    if ("rules" in rule) {
      const combinator = rule.combinator === "and" ? "all" : "any";
      const children = rule.rules.map(formatRule);
      return `{ ${combinator} = [${children.join(", ")}] }`;
    }

    const { field, operator, value } = rule;

    // Map to TOML condition format
    if (field === "cooldown_ready") {
      return operator === "=" ? `"cooldown.ready"` : `{ not = "cooldown.ready" }`;
    }
    if (field === "focus") {
      const op = operator === ">=" ? "focus_ge" : "focus_lt";
      return `{ ${op} = ${value} }`;
    }
    if (field === "aura_active") {
      const base = `{ aura_active = "${value}" }`;
      return operator === "=" ? base : `{ not = ${base} }`;
    }
    if (field === "aura_remaining") {
      return `{ aura_remaining_le = ["${value}", ${value}] }`;
    }
    if (field === "target_health") {
      return `{ target_health_lt = ${Number(value) / 100} }`;
    }
    if (field === "charges") {
      return `{ charges_ge = [${value}] }`;
    }
    if (field === "talent_enabled") {
      const base = `{ talent_enabled = "${value}" }`;
      return operator === "=" ? base : `{ not = ${base} }`;
    }

    return `{ ${field} = ${JSON.stringify(value)} }`;
  };

  if (query.rules.length === 1) {
    return formatRule(query.rules[0]);
  }

  const combinator = query.combinator === "and" ? "all" : "any";
  const children = query.rules.map(formatRule);
  return `{ ${combinator} = [${children.join(", ")}] }`;
}

export function RotationQueryBuilder() {
  const [query, setQuery] = useState<RotationRuleGroup>(INITIAL_QUERY);

  const handleQueryChange = useCallback((q: RuleGroupType) => {
    setQuery(q as RotationRuleGroup);
  }, []);

  const handleReset = useCallback(() => {
    setQuery(INITIAL_QUERY);
  }, []);

  const handleClear = useCallback(() => {
    setQuery({
      combinator: "and",
      rules: [],
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Query Builder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Rotation Condition Builder</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <QueryBuilder
            fields={CONDITION_FIELDS}
            query={query}
            onQueryChange={handleQueryChange}
            controlElements={shadcnControlElements}
            controlClassnames={shadcnControlClassnames}
            translations={shadcnTranslations}
            operators={COMPARISON_OPERATORS}
            combinators={[
              { name: "and", label: "AND" },
              { name: "or", label: "OR" },
            ]}
            showCloneButtons
            showNotToggle
            resetOnFieldChange
            resetOnOperatorChange={false}
          />
        </CardContent>
      </Card>

      {/* Output Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Output Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="json">
            <TabsList className="mb-4">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
              <TabsTrigger value="toml">TOML Condition</TabsTrigger>
              <TabsTrigger value="dsl">Rotation DSL</TabsTrigger>
            </TabsList>

            <TabsContent value="json">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                <code>{JSON.stringify(query, null, 2)}</code>
              </pre>
            </TabsContent>

            <TabsContent value="sql">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                <code>
                  {formatQuery(query, {
                    format: "sql",
                    parseNumbers: true,
                  })}
                </code>
              </pre>
            </TabsContent>

            <TabsContent value="toml">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                <code>condition = {formatAsTomlCondition(query)}</code>
              </pre>
            </TabsContent>

            <TabsContent value="dsl">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                <code>{formatAsRotationDSL(query)}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Field Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONDITION_FIELDS.map((field) => (
              <div
                key={field.name}
                className="rounded-md border p-3 space-y-1"
              >
                <div className="font-medium">{field.label}</div>
                <div className="text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {field.name}
                  </code>
                </div>
                {field.values && (
                  <div className="text-xs text-muted-foreground">
                    Values:{" "}
                    {field.values
                      .slice(0, 3)
                      .map((v) => ("name" in v ? v.name : ""))
                      .join(", ")}
                    {field.values.length > 3 && "..."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

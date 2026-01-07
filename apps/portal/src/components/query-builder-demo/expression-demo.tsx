"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  ExpressionSelector,
  formatExpression,
  type Expression,
} from "./expression-selector";

// -----------------------------------------------------------------------------
// Variable Definition (reusable expressions)
// -----------------------------------------------------------------------------

interface VariableDefinition {
  id: string;
  name: string;
  expression: Expression;
}

let varId = 0;
const makeVarId = () => `var-${++varId}`;

const DEFAULT_EXPRESSION: Expression = {
  category: "aura",
  name: "bestial_wrath",
  property: "up",
};

// -----------------------------------------------------------------------------
// Demo Component
// -----------------------------------------------------------------------------

export function ExpressionDemo() {
  // User-defined variables
  const [variables, setVariables] = useState<VariableDefinition[]>([
    {
      id: makeVarId(),
      name: "burst_ready",
      expression: {
        category: "cooldown",
        name: "bestial_wrath",
        property: "ready",
      },
    },
    {
      id: makeVarId(),
      name: "low_focus",
      expression: {
        category: "resource",
        name: "focus",
        property: "current",
        operator: "<",
        value: "50",
      },
    },
  ]);

  // Standalone expression for testing
  const [testExpr, setTestExpr] = useState<Expression>(DEFAULT_EXPRESSION);

  // Variable CRUD
  const handleAddVariable = () => {
    setVariables((prev) => [
      ...prev,
      {
        id: makeVarId(),
        name: `var_${prev.length + 1}`,
        expression: { ...DEFAULT_EXPRESSION },
      },
    ]);
  };

  const handleUpdateVariableName = (id: string, name: string) => {
    setVariables((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
  };

  const handleUpdateVariableExpr = (id: string, expression: Expression) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, expression } : v)),
    );
  };

  const handleRemoveVariable = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  // Get variable names for the expression selector
  const variableOptions = variables.map((v) => ({
    name: v.name,
    label: v.name,
  }));

  return (
    <div className="space-y-6">
      {/* Variables / Reusable Expressions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Variables</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define reusable expressions. Reference them in conditions.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddVariable}>
            <PlusIcon className="size-3.5 mr-1" />
            Add Variable
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variables.map((variable) => (
            <div
              key={variable.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-2 min-w-[140px]">
                <Badge variant="secondary" className="font-mono text-xs">
                  $
                </Badge>
                <Input
                  value={variable.name}
                  onChange={(e) =>
                    handleUpdateVariableName(variable.id, e.target.value)
                  }
                  className="h-8 w-[120px] font-mono text-sm"
                  placeholder="var_name"
                />
              </div>
              <span className="text-muted-foreground">=</span>
              <ExpressionSelector
                value={variable.expression}
                onChange={(expr) => handleUpdateVariableExpr(variable.id, expr)}
                variables={variableOptions}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => handleRemoveVariable(variable.id)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}
          {variables.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No variables defined. Click "Add Variable" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expression Builder Test */}
      <Card>
        <CardHeader>
          <CardTitle>Expression Builder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Build a condition expression. Select category → name → property.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-muted/30">
            <ExpressionSelector
              value={testExpr}
              onChange={setTestExpr}
              variables={variableOptions}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Result
            </Label>
            <pre className="mt-2 p-3 rounded-md bg-muted text-sm font-mono">
              {formatExpression(testExpr)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Stdlib Preview - What reusable code could look like */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Library (Rust)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Common patterns compiled into the rotation. Reference by name.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="p-2 rounded bg-muted/50 flex items-center justify-between">
              <span>
                <span className="text-blue-400">std::execute</span>
                <span className="text-muted-foreground">::</span>
                <span className="text-green-400">target_below_pct</span>
                <span className="text-muted-foreground">(20)</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                target.health_pct &lt; 20
              </Badge>
            </div>
            <div className="p-2 rounded bg-muted/50 flex items-center justify-between">
              <span>
                <span className="text-blue-400">std::pooling</span>
                <span className="text-muted-foreground">::</span>
                <span className="text-green-400">wait_for</span>
                <span className="text-muted-foreground">(focus, 50)</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                resource.focus.current &lt; 50
              </Badge>
            </div>
            <div className="p-2 rounded bg-muted/50 flex items-center justify-between">
              <span>
                <span className="text-blue-400">std::aoe</span>
                <span className="text-muted-foreground">::</span>
                <span className="text-green-400">cleave_active</span>
                <span className="text-muted-foreground">(2)</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                active_enemies &gt;= 2
              </Badge>
            </div>
            <div className="p-2 rounded bg-muted/50 flex items-center justify-between">
              <span>
                <span className="text-blue-400">std::buff</span>
                <span className="text-muted-foreground">::</span>
                <span className="text-green-400">pandemic_ok</span>
                <span className="text-muted-foreground">(bestial_wrath)</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                aura.bestial_wrath.refreshable
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            These would be Rust functions compiled via Cranelift alongside user
            rotations.
          </p>
        </CardContent>
      </Card>

      {/* Generated Output */}
      <Card>
        <CardHeader>
          <CardTitle>Variable Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[200px]">
            {variables
              .map((v) => `$${v.name} = ${formatExpression(v.expression)}`)
              .join("\n") || "// No variables defined"}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

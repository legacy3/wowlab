"use client";

import type { RuleGroupType } from "react-querybuilder";
import { QueryBuilder } from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDnDHTML5Backend from "react-dnd-html5-backend";

import {
  shadcnControlElements,
  shadcnControlClassnames,
  shadcnTranslations,
  CONDITION_FIELDS,
  COMPARISON_OPERATORS,
} from "./condition-controls";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ConditionBuilderProps {
  condition: RuleGroupType;
  onChange: (condition: RuleGroupType) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ConditionBuilder({ condition, onChange }: ConditionBuilderProps) {
  return (
    <div className="space-y-1.5">
      <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDnDHTML5Backend }}>
        <QueryBuilder
          fields={CONDITION_FIELDS}
          query={condition}
          onQueryChange={onChange}
          controlElements={shadcnControlElements}
          controlClassnames={shadcnControlClassnames}
          translations={shadcnTranslations}
          operators={COMPARISON_OPERATORS}
          combinators={[
            { name: "and", label: "AND" },
            { name: "or", label: "OR" },
          ]}
          showCloneButtons
          resetOnFieldChange
        />
      </QueryBuilderDnD>
      {condition.rules.length === 0 && (
        <div className="text-xs text-muted-foreground py-2 text-center border rounded bg-muted/30">
          No conditions - action will always execute
        </div>
      )}
    </div>
  );
}

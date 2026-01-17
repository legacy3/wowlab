"use client";

import type { RuleGroupType } from "react-querybuilder";

import { QueryBuilder } from "react-querybuilder";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { CONDITION_FIELDS, OPERATORS } from "@/lib/engine";

import {
  AddGroupButton,
  AddRuleButton,
  CombinatorSelector,
  FieldSelector,
  OperatorSelector,
  RemoveButton,
  ValueEditor,
} from "./condition-controls";

interface ConditionBuilderProps {
  disabled?: boolean;
  onQueryChange: (query: RuleGroupType) => void;
  query: RuleGroupType;
}

const queryBuilderStyles = css({
  "& .betweenRules": {
    display: "none",
  },
  "& .rule": {
    alignItems: "center",
    bg: "bg.default",
    borderRadius: "sm",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    p: "2",
  },
  "& .ruleGroup": {
    bg: "bg.subtle",
    borderColor: "border.default",
    borderRadius: "md",
    borderWidth: "1",
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "3",
  },
  "& .ruleGroup-body": {
    borderLeftColor: "border.muted",
    borderLeftWidth: "2",
    display: "flex",
    flexDirection: "column",
    gap: "2",
    pl: "4",
  },
  "& .ruleGroup-header": {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
  },
});

export function ConditionBuilder({
  disabled = false,
  onQueryChange,
  query,
}: ConditionBuilderProps) {
  return (
    <Box className={queryBuilderStyles}>
      <QueryBuilder
        fields={CONDITION_FIELDS}
        operators={OPERATORS}
        query={query}
        onQueryChange={onQueryChange}
        disabled={disabled}
        controlElements={{
          addGroupAction: AddGroupButton,
          addRuleAction: AddRuleButton,
          combinatorSelector: CombinatorSelector,
          fieldSelector: FieldSelector,
          operatorSelector: OperatorSelector,
          removeGroupAction: RemoveButton,
          removeRuleAction: RemoveButton,
          valueEditor: ValueEditor,
        }}
        controlClassnames={{
          betweenRules: "betweenRules",
          body: "ruleGroup-body",
          header: "ruleGroup-header",
          queryBuilder: "queryBuilder",
          rule: "rule",
          ruleGroup: "ruleGroup",
        }}
      />
    </Box>
  );
}

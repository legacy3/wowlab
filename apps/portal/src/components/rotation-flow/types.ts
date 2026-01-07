import type { Node, Edge, BuiltInNode } from "@xyflow/react";

// =============================================================================
// Node Data Types
// =============================================================================

export interface SpellNodeData {
  [key: string]: unknown;
  label: string;
  spellId: number;
  spellName: string;
  icon?: string;
  color?: string;
  target: "current_target" | "self" | "focus" | "pet";
  enabled: boolean;
  minimized?: boolean;
}

export interface ConditionNodeData {
  [key: string]: unknown;
  label: string;
  conditionType: "if" | "and" | "or" | "not";
  subject?: string;
  operator?: "eq" | "neq" | "lt" | "lte" | "gt" | "gte";
  value?: number | string | boolean;
  minimized?: boolean;
}

export interface VariableNodeData {
  [key: string]: unknown;
  label: string;
  variableName: string;
  variableType: "number" | "boolean" | "string";
  expression: string;
  minimized?: boolean;
}

export interface GroupNodeData {
  [key: string]: unknown;
  label: string;
  groupName: string;
  description?: string;
  collapsed: boolean;
  minimized?: boolean;
}

export interface StartNodeData {
  [key: string]: unknown;
  label: string;
}

export interface CommentNodeData {
  [key: string]: unknown;
  label: string;
  text: string;
}

// =============================================================================
// New Node Types for Better Scaling
// =============================================================================

export interface RerouteNodeData {
  [key: string]: unknown;
  label?: string;
}

export interface FrameNodeData {
  [key: string]: unknown;
  label: string;
  color: string;
  collapsed: boolean;
  width: number;
  height: number;
}

export interface SequenceNodeData {
  [key: string]: unknown;
  label: string;
  items: Array<{
    spellId: number;
    spellName: string;
    icon?: string;
    color?: string;
    enabled: boolean;
  }>;
  minimized?: boolean;
}

// =============================================================================
// Node Types
// =============================================================================

export type SpellNode = Node<SpellNodeData, "spell">;
export type ConditionNode = Node<ConditionNodeData, "condition">;
export type VariableNode = Node<VariableNodeData, "variable">;
export type GroupNode = Node<GroupNodeData, "group">;
export type StartNode = Node<StartNodeData, "start">;
export type CommentNode = Node<CommentNodeData, "comment">;
export type RerouteNode = Node<RerouteNodeData, "reroute">;
export type FrameNode = Node<FrameNodeData, "frame">;
export type SequenceNode = Node<SequenceNodeData, "sequence">;

export type RotationNode =
  | SpellNode
  | ConditionNode
  | VariableNode
  | GroupNode
  | StartNode
  | CommentNode
  | RerouteNode
  | FrameNode
  | SequenceNode
  | BuiltInNode;

export type RotationNodeType = RotationNode["type"];

// =============================================================================
// Editor State Types
// =============================================================================

export type LayoutDirection = "vertical" | "horizontal";

export interface EditorSettings {
  compactMode: boolean;
  layoutDirection: LayoutDirection;
  showEdgeLabels: boolean;
  zoomLevel: number;
}

// =============================================================================
// Edge Types
// =============================================================================

export type RotationEdge = Edge<{
  conditionLabel?: string;
  animated?: boolean;
}>;

// =============================================================================
// Reference Types
// =============================================================================

export interface SpellInfo {
  id: number;
  name: string;
  icon: string;
  color: string;
  cooldown?: number;
  cost?: number;
}

export interface ConditionSubject {
  value: string;
  label: string;
  group: string;
}

export interface PaletteItem {
  type: RotationNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultData: Record<string, unknown>;
}

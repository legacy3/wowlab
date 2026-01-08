// -----------------------------------------------------------------------------
// Types (shared across all components)
// -----------------------------------------------------------------------------

export type {
  Action,
  ActionListInfo,
  ActionListWithActions,
  ActionListExport,
  Variable,
  RotationData,
  RuleGroupType,
} from "./types";

// -----------------------------------------------------------------------------
// Spec Selector
// -----------------------------------------------------------------------------

export {
  SpecSelector,
  SpecSelectorCompact,
  WOW_CLASSES,
  getClassById,
  getClassInitial,
  getClassColor,
} from "./spec-selector";

export type {
  WowClass,
  WowSpec,
  SpecSelectorValue,
  SpecSelectorProps,
  SpecSelectorCompactProps,
  ClassDefinition,
} from "./spec-selector";

// -----------------------------------------------------------------------------
// Variable Manager
// -----------------------------------------------------------------------------

export { VariableManager } from "./variable-manager";
export type { VariableManagerProps } from "./variable-manager";

// -----------------------------------------------------------------------------
// Action List Panel
// -----------------------------------------------------------------------------

export { ActionListPanel, ACTION_LIST_TEMPLATES } from "./action-list-panel";
export type {
  ActionListPanelProps,
  ActionListTemplateName,
} from "./action-list-panel";

// -----------------------------------------------------------------------------
// Action Editor
// -----------------------------------------------------------------------------

export { ActionList, createAction } from "./action-editor";
export type { ActionEditorProps } from "./action-editor";

// -----------------------------------------------------------------------------
// Rotation Preview
// -----------------------------------------------------------------------------

export { RotationPreview } from "./rotation-preview";
export type { RotationPreviewProps } from "./rotation-preview";

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export {
  RotationBuilderPage,
  RotationBuilderSkeleton,
} from "./rotation-builder-page";

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

export {
  useVariableValidation,
  useListNameValidation,
  useCollapsible,
  useEditingState,
  isValidVariableName,
} from "./hooks";

export type {
  UseVariableValidationOptions,
  UseVariableValidationResult,
  UseListNameValidationOptions,
  UseListNameValidationResult,
  UseCollapsibleOptions,
  UseCollapsibleResult,
  UseEditingStateResult,
} from "./hooks";

// -----------------------------------------------------------------------------
// Shared Data
// -----------------------------------------------------------------------------

export {
  BM_HUNTER_SPELLS,
  BM_HUNTER_SPELL_OPTIONS,
  BM_HUNTER_AURAS,
  BM_HUNTER_AURA_OPTIONS,
  BM_HUNTER_TALENTS,
  BM_HUNTER_TALENT_OPTIONS,
  createOption,
  createSpell,
} from "./data";

export type { SpellInfo, SpellOption } from "./data";

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export {
  toInternalName,
  toDisplayLabel,
  getSpellLabel,
  getConditionSummary,
  formatConditionForDSL,
  toFilename,
} from "./utils";

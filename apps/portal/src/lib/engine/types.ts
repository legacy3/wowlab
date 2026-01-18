import type { RuleGroupType, RuleType } from "react-querybuilder";

export type { RuleGroupType, RuleType };

export type {
  Attribute,
  AuraDef,
  AuraEffect,
  AuraFlags,
  AuraIdx,
  CastType,
  Character,
  ChargeMod,
  ClassId,
  ConditionFieldDef,
  ConditionFieldType,
  CooldownMod,
  DamageEffect,
  DamageFlags,
  DamageMod,
  DamageSchool,
  DamageSchoolInfo,
  DerivedStat,
  EffectCondition,
  EnemyIdx,
  Expr,
  GcdType,
  HitResult,
  Item,
  Loadout,
  MasteryEffect,
  ModCondition,
  PeriodicEffect,
  PetIdx,
  PetKind,
  PetType,
  ProcIdx,
  Profession,
  Profile,
  RaceId,
  RatingType,
  ResourceCost,
  ResourceIdx,
  ResourceType,
  ResourceTypeInfo,
  Rotation,
  Action as RotationAction,
  SimTime,
  Slot,
  SnapshotFlags,
  SnapshotIdx,
  SpecId,
  SpellDef,
  SpellEffect,
  SpellFlags,
  SpellIdx,
  SpellTarget,
  TalentDef,
  Talents,
  TargetIdx,
  UnitIdx,
  ValidationError,
  ValidationResult,
  ValidationWarning,
  ValueType,
  VarOp,
  VarPathCategory,
  VarPathInfo,
  WowClass,
} from "engine";

export interface Action {
  condition: RuleGroupType;
  enabled: boolean;
  id: string;
  itemId?: number;
  listId?: string;
  spellId?: number;
  type: ActionType;
}

export interface ActionActions {
  addAction: (
    listId: string,
    input: Omit<Action, "id" | "enabled" | "condition">,
  ) => string;
  deleteAction: (listId: string, actionId: string) => void;
  duplicateAction: (listId: string, actionId: string) => string | undefined;
  reorderActions: (listId: string, from: number, to: number) => void;
  updateAction: (
    listId: string,
    actionId: string,
    updates: Partial<Omit<Action, "id">>,
  ) => void;
}

export interface ActionList {
  actions: Action[];
  id: string;
  label: string;
  listType: ListType;
  name: string;
}

export type ActionType = "spell" | "item" | "call_action_list";

export interface EditorContent {
  actionLists: ActionList[];
  defaultListId: string;
  variables: Variable[];
}

export interface EditorMetadata {
  description: string;
  isPublic: boolean;
  name: string;
  rotationId: string | null;
  slug: string;
  specId: number | null;
}

export type EditorState = ActionActions &
  EditorContent &
  EditorMetadata &
  EditorUIState &
  ListActions &
  LockActions &
  MetadataActions &
  PersistenceActions &
  VariableActions &
  ViewActions;

export interface EditorUIState {
  isDirty: boolean;
  isLocked: boolean;
  ownerId: string | null;
  selectedListId: string | null;
  viewMode: ViewMode;
}

export interface ListActions {
  addList: (input: {
    name: string;
    label: string;
    listType: ListType;
  }) => string;
  deleteList: (id: string) => void;
  renameList: (id: string, label: string) => void;
  reorderLists: (from: number, to: number) => void;
  selectList: (id: string | null) => void;
  setDefaultList: (id: string) => void;
}

export type ListType = "precombat" | "main" | "sub";

export interface LockActions {
  setLocked: (locked: boolean) => void;
}

export interface MetadataActions {
  setDescription: (description: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  setName: (name: string) => void;
  setSpecId: (specId: number | null) => void;
}

export interface PersistenceActions {
  load: (rotation: RotationsRow) => void;
  markClean: () => void;
  reset: () => void;
  serialize: () => RotationData;
}

export interface RotationData {
  defaultListId: string;
  lists: ActionList[];
  variables: Variable[];
}

export interface RotationsRow {
  checksum: string | null;
  created_at: string;
  current_version: number;
  description: string | null;
  forked_from_id: string | null;
  id: string;
  is_public: boolean;
  name: string;
  script: string;
  slug: string;
  spec_id: number;
  updated_at: string;
  user_id: string;
}

export interface Variable {
  expression: string;
  id: string;
  name: string;
}

export interface VariableActions {
  addVariable: (variable: Omit<Variable, "id">) => string;
  deleteVariable: (id: string) => void;
  updateVariable: (id: string, updates: Partial<Omit<Variable, "id">>) => void;
}

export interface ViewActions {
  setViewMode: (mode: ViewMode) => void;
}

export type ViewMode = "edit" | "preview";

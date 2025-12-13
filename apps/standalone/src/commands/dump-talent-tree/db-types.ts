export interface DbcChrClass {
  ID: number;
  Name_lang: string | null;
}

export interface DbcChrSpecialization {
  ClassID: number;
  ID: number;
  Name_lang: string | null;
}

export interface DbcManifestInterfaceData {
  FileName: string | null;
  ID: number;
}

export interface DbcSpecSetMember {
  ChrSpecializationID: number;
  SpecSet: number;
}

export interface DbcSpell {
  Description_lang: string | null;
  ID: number;
}

export interface DbcSpellMisc {
  ID: number;
  SpellIconFileDataID: number | null;
  SpellID: number;
}

export interface DbcSpellName {
  ID: number;
  Name_lang: string | null;
}

export interface DbcTraitCond {
  ID: number;
  SpecSetID: number;
}

export interface DbcTraitDefinition {
  ID: number;
  OverrideDescription_lang: string | null;
  OverrideIcon: number;
  OverrideName_lang: string | null;
  SpellID: number;
}

export interface DbcTraitEdge {
  ID: number;
  LeftTraitNodeID: number;
  RightTraitNodeID: number;
  VisualStyle: number;
}

export interface DbcTraitNode {
  ID: number;
  PosX: number;
  PosY: number;
  TraitSubTreeID: number;
  TraitTreeID: number;
  Type: number;
}

export interface DbcTraitNodeEntry {
  ID: number;
  MaxRanks: number;
  TraitDefinitionID: number;
}

export interface DbcTraitNodeGroupXTraitCond {
  TraitCondID: number;
  TraitNodeGroupID: number;
}

export interface DbcTraitNodeGroupXTraitNode {
  TraitNodeGroupID: number;
  TraitNodeID: number;
}

export interface DbcTraitNodeXTraitNodeEntry {
  TraitNodeEntryID: number;
  TraitNodeID: number;
}

export interface DbcTraitSubTree {
  Description_lang: string | null;
  ID: number;
  Name_lang: string | null;
}

export interface DbcTraitTreeLoadout {
  ID: number;
  TraitTreeID: number;
}

export interface DbcTraitTreeLoadoutEntry {
  OrderIndex: number;
  SelectedTraitNodeID: number;
}

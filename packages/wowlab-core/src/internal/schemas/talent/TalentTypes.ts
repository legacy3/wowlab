import * as Schema from "effect/Schema";

export const TalentNodeEntrySchema = Schema.Struct({
  definitionId: Schema.Number,
  description: Schema.String,
  iconFileName: Schema.String,
  id: Schema.Number,
  name: Schema.String,
  spellId: Schema.Number,
});

export type TalentNodeEntry = Schema.Schema.Type<typeof TalentNodeEntrySchema>;

// TalentNode - A fully resolved node for rendering
export const TalentNodeSchema = Schema.Struct({
  entries: Schema.Array(TalentNodeEntrySchema), // 1 for normal, 2 for choice nodes
  id: Schema.Number,
  maxRanks: Schema.Number,
  orderIndex: Schema.Number, // position in talent string encoding
  posX: Schema.Number,
  posY: Schema.Number,
  subTreeId: Schema.Number, // 0 = class/spec, >0 = hero tree
  type: Schema.Number, // 0 = normal, 2 = choice
});

export type TalentNode = Schema.Schema.Type<typeof TalentNodeSchema>;

// TalentEdge - Connection between nodes
export const TalentEdgeSchema = Schema.Struct({
  fromNodeId: Schema.Number,
  id: Schema.Number,
  toNodeId: Schema.Number,
  visualStyle: Schema.Number,
});

export type TalentEdge = Schema.Schema.Type<typeof TalentEdgeSchema>;

// TalentSubTree - Hero talent tree info
export const TalentSubTreeSchema = Schema.Struct({
  description: Schema.String,
  id: Schema.Number,
  name: Schema.String,
});

export type TalentSubTree = Schema.Schema.Type<typeof TalentSubTreeSchema>;

// TalentTree - Complete tree structure
export const TalentTreeSchema = Schema.Struct({
  className: Schema.String,
  edges: Schema.Array(TalentEdgeSchema),
  nodes: Schema.Array(TalentNodeSchema),
  specId: Schema.Number,
  specName: Schema.String,
  subTrees: Schema.Array(TalentSubTreeSchema), // hero talent trees
  treeId: Schema.Number,
});

export type TalentTree = Schema.Schema.Type<typeof TalentTreeSchema>;

// DecodedTalentSelection - Result of applying decoded string to tree
export const DecodedTalentSelectionSchema = Schema.Struct({
  choiceIndex: Schema.optional(Schema.Number),
  nodeId: Schema.Number,
  ranksPurchased: Schema.Number,
  selected: Schema.Boolean,
});

export type DecodedTalentSelection = Schema.Schema.Type<
  typeof DecodedTalentSelectionSchema
>;

// TalentTreeWithSelections - Tree with applied talent selections
export interface TalentTreeWithSelections extends TalentTree {
  selections: Map<number, DecodedTalentSelection>;
}

import type { SpecTraits } from "@/lib/supabase/types";

import type {
  PointLimits,
  TraitEdge,
  TraitNode,
  TraitNodeEntry,
  TraitSubTree,
  TraitTreeFlat,
} from "./types";

import { isTraitNodeType } from "./types";

export class TraitTransformError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly details?: unknown,
  ) {
    super(`TraitTransformError [${field}]: ${message}`);
    this.name = "TraitTransformError";
  }
}

export function transformSpecTraits(specTraits: SpecTraits): TraitTreeFlat {
  const nodesRaw = validateArray(specTraits.nodes, "nodes");
  const edgesRaw = validateArray(specTraits.edges, "edges");
  const subTreesRaw = validateArray(specTraits.sub_trees, "sub_trees");

  return {
    allNodeIds: specTraits.all_node_ids,
    className: specTraits.class_name,
    edges: edgesRaw.map((e, i) => validateEdge(e, i)),
    nodes: nodesRaw.map((n, i) => validateNode(n, i)),
    pointLimits: validatePointLimits(specTraits.point_limits),
    specId: specTraits.spec_id,
    specName: specTraits.spec_name,
    subTrees: subTreesRaw.map((s, i) => validateSubTree(s, i)),
    treeId: specTraits.tree_id,
  };
}

export function tryTransformSpecTraits(
  specTraits: SpecTraits,
): TraitTreeFlat | null {
  try {
    return transformSpecTraits(specTraits);
  } catch (e) {
    console.error("Failed to transform spec traits:", e);
    return null;
  }
}

function validateArray(value: unknown, field: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  throw new TraitTransformError(
    `Expected array, got ${typeof value}`,
    field,
    value,
  );
}

function validateEdge(raw: unknown, index: number): TraitEdge {
  if (typeof raw !== "object" || raw === null) {
    throw new TraitTransformError(
      `Edge at index ${index} is not an object`,
      "edges",
      raw,
    );
  }

  const obj = raw as Record<string, unknown>;

  return {
    fromNodeId: validateNumber(obj.fromNodeId, `edges[${index}].fromNodeId`),
    id: validateNumber(obj.id, `edges[${index}].id`),
    toNodeId: validateNumber(obj.toNodeId, `edges[${index}].toNodeId`),
    visualStyle: validateNumber(
      obj.visualStyle,
      `edges[${index}].visualStyle`,
      0,
    ),
  };
}

function validateEntry(raw: unknown, index: number): TraitNodeEntry {
  if (typeof raw !== "object" || raw === null) {
    throw new TraitTransformError(
      `Entry at index ${index} is not an object`,
      "entries",
      raw,
    );
  }

  const obj = raw as Record<string, unknown>;

  return {
    definitionId: validateNumber(
      obj.definitionId,
      `entries[${index}].definitionId`,
    ),
    description: validateString(
      obj.description,
      `entries[${index}].description`,
      "",
    ),
    iconFileName: validateString(
      obj.iconFileName,
      `entries[${index}].iconFileName`,
      "",
    ),
    id: validateNumber(obj.id, `entries[${index}].id`),
    name: validateString(obj.name, `entries[${index}].name`, ""),
    spellId: validateNumber(obj.spellId, `entries[${index}].spellId`),
  };
}

function validateNode(raw: unknown, index: number): TraitNode {
  if (typeof raw !== "object" || raw === null) {
    throw new TraitTransformError(
      `Node at index ${index} is not an object`,
      "nodes",
      raw,
    );
  }

  const obj = raw as Record<string, unknown>;
  const type = validateNumber(obj.type, `nodes[${index}].type`);

  if (!isTraitNodeType(type)) {
    throw new TraitTransformError(
      `Invalid node type: ${type}`,
      `nodes[${index}].type`,
      type,
    );
  }

  const entries = validateArray(obj.entries, `nodes[${index}].entries`);

  return {
    entries: entries.map((e, i) => validateEntry(e, i)),
    id: validateNumber(obj.id, `nodes[${index}].id`),
    maxRanks: validateNumber(obj.maxRanks, `nodes[${index}].maxRanks`, 1),
    orderIndex: validateNumber(obj.orderIndex, `nodes[${index}].orderIndex`, 0),
    posX: validateNumber(obj.posX, `nodes[${index}].posX`),
    posY: validateNumber(obj.posY, `nodes[${index}].posY`),
    subTreeId: validateNumber(obj.subTreeId, `nodes[${index}].subTreeId`, 0),
    treeIndex: validateNumber(obj.treeIndex, `nodes[${index}].treeIndex`, 0),
    type,
  };
}

function validateNumber(
  value: unknown,
  field: string,
  defaultValue?: number,
): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new TraitTransformError(
    `Expected number, got ${typeof value}`,
    field,
    value,
  );
}

function validatePointLimits(raw: unknown): PointLimits {
  const defaults: PointLimits = { class: 31, hero: 10, spec: 30 };

  if (typeof raw !== "object" || raw === null) {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  return {
    class: validateNumber(obj.class, "pointLimits.class", defaults.class),
    hero: validateNumber(obj.hero, "pointLimits.hero", defaults.hero),
    spec: validateNumber(obj.spec, "pointLimits.spec", defaults.spec),
  };
}

function validateString(
  value: unknown,
  field: string,
  defaultValue?: string,
): string {
  if (typeof value === "string") {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new TraitTransformError(
    `Expected string, got ${typeof value}`,
    field,
    value,
  );
}

function validateSubTree(raw: unknown, index: number): TraitSubTree {
  if (typeof raw !== "object" || raw === null) {
    throw new TraitTransformError(
      `SubTree at index ${index} is not an object`,
      "subTrees",
      raw,
    );
  }

  const obj = raw as Record<string, unknown>;

  return {
    description: validateString(
      obj.description,
      `subTrees[${index}].description`,
      "",
    ),
    iconFileName: validateString(
      obj.iconFileName,
      `subTrees[${index}].iconFileName`,
      "",
    ),
    id: validateNumber(obj.id, `subTrees[${index}].id`),
    name: validateString(obj.name, `subTrees[${index}].name`, ""),
  };
}

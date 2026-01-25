import type { ResourceProps } from "@refinedev/core";

const GAME_SCHEMA = { schema: "game" };

/**
 * Typed resource configs for use with useResource, useResourceList, useResourceMany.
 * Spread these into hook calls: useResource({ ...spells, id: spellId })
 */

// Game schema resources
export const spells = {
  meta: GAME_SCHEMA,
  resource: "spells",
} as const;

export const items = {
  meta: GAME_SCHEMA,
  resource: "items",
} as const;

export const classes = {
  meta: GAME_SCHEMA,
  resource: "classes",
} as const;

export const specs = {
  meta: GAME_SCHEMA,
  resource: "specs",
} as const;

export const auras = {
  meta: { ...GAME_SCHEMA, idColumnName: "spell_id" },
  resource: "auras",
} as const;

export const globalColors = {
  meta: { ...GAME_SCHEMA, idColumnName: "name" },
  resource: "global_colors",
} as const;

export const globalStrings = {
  meta: { ...GAME_SCHEMA, idColumnName: "tag" },
  resource: "global_strings",
} as const;

export const specsTraits = {
  meta: { ...GAME_SCHEMA, idColumnName: "spec_id" },
  resource: "specs_traits",
} as const;

// Public schema resources
export const rotations = {
  resource: "rotations",
} as const;

export const userProfiles = {
  meta: { idColumnName: "handle" },
  resource: "user_profiles",
} as const;

export const jobs = {
  resource: "jobs",
} as const;

export const nodes = {
  resource: "nodes",
} as const;

export const nodesPermissions = {
  resource: "nodes_permissions",
} as const;

/**
 * Resource definitions for Refine provider configuration
 */
export const resources: ResourceProps[] = [
  // Game schema resources
  { meta: GAME_SCHEMA, name: "spells" },
  { meta: GAME_SCHEMA, name: "items" },
  { meta: GAME_SCHEMA, name: "classes" },
  { meta: GAME_SCHEMA, name: "specs" },
  { meta: { ...GAME_SCHEMA, idColumnName: "spell_id" }, name: "auras" },
  { meta: { ...GAME_SCHEMA, idColumnName: "name" }, name: "global_colors" },
  { meta: { ...GAME_SCHEMA, idColumnName: "tag" }, name: "global_strings" },
  { meta: { ...GAME_SCHEMA, idColumnName: "spec_id" }, name: "specs_traits" },
  // Public schema resources
  { name: "rotations" },
  { meta: { idColumnName: "handle" }, name: "user_profiles" },
  { name: "jobs" },
  { name: "nodes" },
  { name: "nodes_permissions" },
];

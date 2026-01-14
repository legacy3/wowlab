/**
 * Shared ID generation utilities.
 * Provides consistent, collision-resistant IDs across the application.
 */

let counter = 0;

/**
 * Generates a unique ID with an optional prefix.
 * Format: `{prefix}-{counter}-{timestamp}`
 *
 * @example
 * generateId("action") // "action-1-1704067200000"
 * generateId("var")    // "var-2-1704067200001"
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${++counter}-${Date.now()}`;
}

/**
 * Creates a prefixed ID generator.
 * Useful for creating domain-specific ID functions.
 *
 * @example
 * const generateActionId = createIdGenerator("action");
 * generateActionId() // "action-1-1704067200000"
 */
export function createIdGenerator(prefix: string): () => string {
  return () => generateId(prefix);
}

/**
 * Pre-built ID generators for common entity types.
 */
export const generateActionId = createIdGenerator("action");
export const generateListId = createIdGenerator("list");
export const generateVariableId = createIdGenerator("var");
export const generateRuleId = createIdGenerator("rule");

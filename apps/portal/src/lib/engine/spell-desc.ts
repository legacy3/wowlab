export type {
  EffectDependency,
  SpellDescDependencies,
  SpellDescFragment,
  SpellDescRenderResult,
  SpellValueDependency,
} from "wowlab-parsers";

// TODO Redo this entire file function based

/**
 * Interface for resolving spell description values.
 * Implement this to provide data for rendering spell descriptions.
 */
export interface SpellDescResolver {
  /**
   * Get a custom variable value from spell's description_variables
   * @param name - Variable name (without $< and >)
   * @returns The value, or null if not defined
   */
  getCustomVar(name: string): number | null;

  /**
   * Get an effect value (base points, min/max, tick period, etc.)
   * @param spellId - The spell ID
   * @param effectIndex - 1-indexed effect index
   * @param varType - Variable type: "s" (base), "m" (min), "M" (max), "t" (period), "a" (radius), "x" (chain targets)
   * @returns The value, or null if not available
   */
  getEffectValue(
    spellId: number,
    effectIndex: number,
    varType: string,
  ): number | null;

  /**
   * Get a player stat value
   * @param stat - Stat name: "SP", "AP", "haste", "crit", "mastery", "vers"
   * @returns The stat value, or null if not available
   */
  getPlayerStat(stat: string): number | null;

  /**
   * Get another spell's rendered description (for @spelldesc embedding)
   */
  getSpellDescription(spellId: number): string | null;

  /**
   * Get another spell's icon path (for @spellicon embedding)
   */
  getSpellIcon(spellId: number): string | null;

  /**
   * Get another spell's name (for @spellname embedding)
   */
  getSpellName(spellId: number): string | null;

  /**
   * Get a spell-level value as formatted string
   * @param spellId - The spell ID
   * @param varType - Variable type: "d" (duration), "n" (charges), "r" (range), "h" (proc chance)
   * @returns The formatted string, or null if not available
   */
  getSpellValue(spellId: number, varType: string): string | null;

  /**
   * Check if an aura is active (for $?aXXXXX conditionals)
   */
  hasAura(auraId: number): boolean;

  /**
   * Check if player is a specific class (for $?cX conditionals)
   */
  isClass(classId: number): boolean;

  /**
   * Get player gender (true = male, false = female)
   */
  isMale(): boolean;

  /**
   * Check if player knows a spell (for $?sXXXXX conditionals)
   */
  knowsSpell(spellId: number): boolean;
}

/**
 * A resolver that returns null/false for all lookups.
 * Useful for showing raw variable tokens when data isn't available.
 */
export const nullResolver: SpellDescResolver = {
  getCustomVar: () => null,
  getEffectValue: () => null,
  getPlayerStat: () => null,
  getSpellDescription: () => null,
  getSpellIcon: () => null,
  getSpellName: () => null,
  getSpellValue: () => null,
  hasAura: () => false,
  isClass: () => false,
  isMale: () => true,
  knowsSpell: () => false,
};

// Parsers module state
type ParsersModule = typeof import("wowlab-parsers");

let parsersModule: ParsersModule | null = null;
let parsersInitPromise: Promise<ParsersModule> | null = null;
let parsersInitError: Error | null = null;

/**
 * Analyze a spell description to determine what data is needed to render it.
 * Also returns any parse errors encountered.
 *
 * @param description - The raw spell description text
 * @param spellId - The spell ID being analyzed
 * @returns Analysis result with dependencies and parse errors
 */
export async function analyzeSpellDescription(
  description: string,
  spellId: number,
): Promise<{
  dependencies: import("wowlab-parsers").SpellDescDependencies;
  parseErrors: string[];
}> {
  const m = await initParsers();
  const result = m.analyzeSpellDesc(description, spellId);
  return {
    dependencies: result.dependencies,
    parseErrors: result.parseErrors,
  };
}

/**
 * Format a duration value in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms === 0) return "0 sec";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours} hr ${remainingMinutes} min`;
    }
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes} min ${remainingSeconds} sec`;
    }
    return minutes === 1 ? "1 min" : `${minutes} min`;
  }

  return seconds === 1 ? "1 sec" : `${seconds} sec`;
}

/**
 * Format a range value to a human-readable string.
 */
export function formatRange(yards: number): string {
  if (yards === 0) return "Melee";
  return `${yards} yd`;
}

/**
 * Convert spell description fragments to plain text.
 * Useful for copying or simple display.
 */
export function fragmentsToPlainText(
  fragments: import("wowlab-parsers").SpellDescFragment[],
): string {
  return fragments
    .map((f) => {
      switch (f.kind) {
        case "colorEnd":
        case "colorStart":
          return "";
        case "duration":
          return f.value;
        case "embedded":
          return fragmentsToPlainText(f.fragments);
        case "icon":
          return "";
        case "spellName":
          return f.name;
        case "text":
          return f.value;
        case "unresolved":
          return f.token;
        case "value":
          return f.value;
        default:
          return "";
      }
    })
    .join("");
}

/**
 * Render a spell description with the provided resolver.
 * Returns structured fragments that can be rendered with React.
 *
 * @param description - The raw spell description text
 * @param spellId - The spell ID being rendered
 * @param resolver - Object implementing SpellDescResolver interface
 * @returns Render result with fragments, parse errors, and warnings
 */
export async function renderSpellDescription(
  description: string,
  spellId: number,
  resolver: SpellDescResolver,
): Promise<import("wowlab-parsers").SpellDescRenderResult> {
  const m = await initParsers();
  return m.renderSpellDesc(description, spellId, resolver);
}

/**
 * Initialize the parsers WASM module.
 */
async function initParsers(): Promise<ParsersModule> {
  if (parsersModule) return parsersModule;
  if (parsersInitError) throw parsersInitError;

  if (!parsersInitPromise) {
    parsersInitPromise = (async () => {
      try {
        const m = await import("wowlab-parsers");
        await m.default();
        parsersModule = m;
        return m;
      } catch (err) {
        parsersInitError = err instanceof Error ? err : new Error(String(err));
        parsersInitPromise = null;
        throw parsersInitError;
      }
    })();
  }

  return parsersInitPromise;
}

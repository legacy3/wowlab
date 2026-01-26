/**
 * Async WASM API for non-React code (stores, server actions, etc.)
 * React components should use useCommon()/useEngine() hooks instead.
 */

import type { SpellDescFragment } from "./types";

import { getCommon, getEngine } from "./loaders";

export interface SpellDescResolver {
  getCustomVar(name: string): number | null;
  getEffectValue(
    spellId: number,
    effectIndex: number,
    varType: string,
  ): number | null;
  getPlayerStat(stat: string): number | null;
  getSpellDescription(spellId: number): string | null;
  getSpellIcon(spellId: number): string | null;
  getSpellName(spellId: number): string | null;
  getSpellValue(spellId: number, varType: string): string | null;
  hasAura(auraId: number): boolean;
  isClass(classId: number): boolean;
  isMale(): boolean;
  knowsSpell(spellId: number): boolean;
}

// Helper to call common module function
async function common<T>(
  fn: (m: Awaited<ReturnType<typeof getCommon>>) => T,
): Promise<T> {
  const m = await getCommon();
  return fn(m);
}

async function engine<T>(
  fn: (m: Awaited<ReturnType<typeof getEngine>>) => T,
): Promise<T> {
  const m = await getEngine();
  return fn(m);
}

export const analyzeSpellDesc = (input: string, selfSpellId: number) =>
  common((m) => {
    const result = m.analyzeSpellDesc(input, selfSpellId);
    return {
      dependencies: result.dependencies,
      parseErrors: result.parseErrors,
    };
  });

export const parseSpellDesc = (input: string) =>
  common((m) => m.parseSpellDesc(input));

export const renderSpellDesc = (
  input: string,
  selfSpellId: number,
  resolver: SpellDescResolver,
) => common((m) => m.renderSpellDesc(input, selfSpellId, resolver));

export const tokenizeSpellDesc = (input: string) =>
  common((m) => m.tokenizeSpellDesc(input));

export const parseSimc = (input: string) => common((m) => m.parseSimc(input));
export const encodeMinimalLoadout = (specId: number) =>
  common((m) => m.encodeMinimalLoadout(specId));

export const getEngineVersion = () => engine((m) => m.getEngineVersion());
export const parseRotation = (json: string) =>
  engine((m) => m.parseRotation(json));
export const validateRotation = (json: string) =>
  engine((m) => m.validateRotation(json));

export function fragmentsToPlainText(fragments: SpellDescFragment[]): string {
  return fragments
    .map((f) => {
      switch (f.kind) {
        case "colorEnd":
        case "colorStart":
        case "icon":
          return "";

        case "duration":
        case "rawToken":
        case "text":
        case "value":
          return f.value;

        case "embedded":
          return fragmentsToPlainText(f.fragments);

        case "spellName":
          return f.name;

        case "unresolved":
          return f.token;

        default:
          return "";
      }
    })
    .join("");
}

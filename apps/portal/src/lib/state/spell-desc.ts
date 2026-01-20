"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { Aura, Spell } from "@/lib/supabase/types";

import {
  analyzeSpellDescription,
  formatDuration,
  formatRange,
  renderSpellDescription,
  type SpellDescRenderResult,
  type SpellDescResolver,
} from "@/lib/engine";

import { useAuras, useSpell, useSpells } from "./game";

// Cache duration in ms
const SPELL_DESC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// TODO Redo this entire file function based + Remove Cache + Remove React Query. Also most of this belongs in lib/engine

/**
 * Paperdoll state representing character stats.
 * Used for rendering spell tooltips with player-specific values.
 */
export interface PaperdollState {
  /** Attack power */
  ap: number;
  /** Player class ID */
  classId: number;
  /** Crit rating as percentage (e.g., 25 for 25%) */
  crit: number;
  /** Player gender (true = male) */
  isMale: boolean;
  /** Player level */
  level: number;
  /** Mastery rating */
  mastery: number;
  /** Max health */
  maxHealth: number;
  /** Spell power */
  sp: number;
  /** Versatility as percentage */
  vers: number;
}

/**
 * Default paperdoll state for a level 80 character.
 */
export const defaultPaperdoll: PaperdollState = {
  ap: 10000,
  classId: 0,
  crit: 25,
  isMale: true,
  level: 80,
  mastery: 20,
  maxHealth: 500000,
  sp: 10000,
  vers: 10,
};

/**
 * Spell effect data stored in the effects JSON column.
 */
interface SpellEffect {
  amplitude: number;
  aura: number;
  basePoints: number;
  bonusCoefficient: number;
  bonusCoefficientFromAp: number;
  chainTargets: number;
  coefficient: number;
  effect: number;
  index: number;
  miscValue0: number;
  miscValue1: number;
  period: number;
  pvpMultiplier: number;
  radiusMax: number;
  radiusMin: number;
  triggerSpell: number;
  variance: number;
}

/**
 * Build a SpellDescResolver from spell data and paperdoll state.
 */
export function buildResolver(
  spell: Spell | null,
  spellCache: Map<number, Spell>,
  auraCache: Map<number, Aura>,
  paperdoll: PaperdollState,
  knownSpells: Set<number> = new Set(),
  activeAuras: Set<number> = new Set(),
): SpellDescResolver {
  return {
    getCustomVar(name: string) {
      if (!spell?.description_variables) return null;

      try {
        const vars = JSON.parse(spell.description_variables);
        const value = vars[name];
        return typeof value === "number" ? value : null;
      } catch {
        return null;
      }
    },

    getEffectValue(spellId: number, effectIndex: number, varType: string) {
      const s = spellId === spell?.id ? spell : spellCache.get(spellId);
      if (!s) return null;

      const effects = parseEffects(s);
      const effect = effects.find((e) => e.index === effectIndex - 1);
      if (!effect) return null;

      switch (varType) {
        case "a":
          return effect.radiusMin ?? null;
        case "A":
          return effect.radiusMax ?? null;
        case "bc":
          return effect.bonusCoefficient ?? null;
        case "e":
          return effect.amplitude ?? null;
        case "m":
          return effect.basePoints != null
            ? effect.basePoints * (1 - (effect.variance || 0))
            : null;
        case "M":
          return effect.basePoints != null
            ? effect.basePoints * (1 + (effect.variance || 0))
            : null;
        case "o":
          if (effect.period && effect.basePoints != null && s.duration) {
            const ticks = Math.floor(s.duration / effect.period);
            return ticks * effect.basePoints;
          }
          return null;
        case "q":
          return effect.basePoints ?? null;
        case "s":
        case "S":
          return effect.basePoints ?? null;
        case "sw":
          return effect.coefficient ?? null;
        case "t":
          return effect.period ? effect.period / 1000 : null;
        case "w":
        case "W":
          return effect.coefficient ?? null;
        case "x":
          return effect.chainTargets ?? null;
        default:
          return null;
      }
    },

    getPlayerStat(stat: string) {
      const normalized = stat.toLowerCase();
      switch (normalized) {
        case "ap":
          return paperdoll.ap;
        case "crit":
          return paperdoll.crit;
        case "int":
          return paperdoll.sp * 0.5;
        case "lpoint":
        case "pl":
          return paperdoll.level;
        case "mas":
        case "mastery":
          return paperdoll.mastery;
        case "mhp":
          return paperdoll.maxHealth;
        case "mwb":
        case "mws":
        case "owb":
        case "ows":
          return 0;
        case "pri":
        case "rolemult":
          return 1;
        case "proccooldown":
        case "procrppm":
          return 0;
        case "rap":
          return paperdoll.ap;
        case "sp":
        case "sps":
          return paperdoll.sp;
        case "vers":
        case "versadmg":
        case "versaheal":
          return paperdoll.vers;
        default:
          return null;
      }
    },

    getSpellDescription(spellId: number) {
      const s = spellCache.get(spellId);
      return s?.description ?? null;
    },

    getSpellIcon(spellId: number) {
      const s = spellCache.get(spellId);
      return s?.file_name ?? null;
    },

    getSpellName(spellId: number) {
      const s = spellCache.get(spellId);
      return s?.name ?? null;
    },

    getSpellValue(spellId: number, varType: string) {
      const s = spellId === spell?.id ? spell : spellCache.get(spellId);
      if (!s) return null;

      const baseType = varType.replace(/\d+$/, "");

      switch (baseType) {
        case "c":
          return s.cast_time ? `${(s.cast_time / 1000).toFixed(1)} sec` : null;
        case "d":
          return s.duration ? formatDuration(s.duration) : null;
        case "h":
          return null; // proc_chance not in type
        case "i":
          return null;
        case "n":
          return s.max_charges ? String(s.max_charges) : null;
        case "p":
          return null; // real_ppm not in type
        case "r":
          return s.range_max_0 ? formatRange(s.range_max_0) : null;
        case "u": {
          const aura = auraCache.get(spellId);
          return aura?.max_stacks ? String(aura.max_stacks) : null;
        }
        case "z":
          return null;
        default:
          return null;
      }
    },

    hasAura(auraId: number) {
      return activeAuras.has(auraId);
    },

    isClass(classId: number) {
      return paperdoll.classId === classId;
    },

    isMale() {
      return paperdoll.isMale;
    },

    knowsSpell(spellId: number) {
      return knownSpells.has(spellId);
    },
  };
}

/**
 * Hook to render a spell description with reactive updates.
 *
 * @param spellId - The spell ID to render
 * @param description - Optional override for the description text
 * @param paperdoll - Character stats (defaults to defaultPaperdoll)
 * @param knownSpells - Set of spell IDs the character knows
 * @param activeAuras - Set of aura IDs currently active
 *
 * @returns Object with render result and loading state
 */
export function useSpellDescription(
  spellId: number | null | undefined,
  description?: string,
  paperdoll: PaperdollState = defaultPaperdoll,
  knownSpells: Set<number> = new Set(),
  activeAuras: Set<number> = new Set(),
): {
  error: Error | null;
  isLoading: boolean;
  raw: string;
  result: SpellDescRenderResult | null;
  spell: Spell | undefined;
} {
  // Fetch the primary spell
  const { data: spell, isLoading: spellLoading } = useSpell(spellId);

  // Get the description text
  const descriptionText = description ?? spell?.description ?? "";

  // State for cross-spell IDs
  const [crossSpellIds, setCrossSpellIds] = useState<number[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Analyze dependencies when description changes
  useEffect(() => {
    if (!descriptionText || !spellId) {
      setCrossSpellIds([]);
      setAnalysisComplete(true);
      return;
    }

    setAnalysisComplete(false);

    analyzeSpellDescription(descriptionText, spellId)
      .then(({ dependencies }) => {
        const ids = new Set<number>();

        for (const eff of dependencies.effects) {
          if (eff.spellId !== spellId) {
            ids.add(eff.spellId);
          }
        }

        for (const sv of dependencies.spellValues) {
          if (sv.spellId !== spellId) {
            ids.add(sv.spellId);
          }
        }

        for (const embed of dependencies.embeddedSpellIds) {
          ids.add(embed);
        }

        setCrossSpellIds(Array.from(ids));
        setAnalysisComplete(true);
      })
      .catch((err) => {
        console.error("Failed to analyze spell description:", err);
        setCrossSpellIds([]);
        setAnalysisComplete(true);
      });
  }, [descriptionText, spellId]);

  // Fetch cross-referenced spells
  const { data: crossSpells = [], isLoading: crossSpellsLoading } =
    useSpells(crossSpellIds);

  // All spell IDs that might need aura data
  const allSpellIds = useMemo(() => {
    const ids = new Set<number>();
    if (spellId) ids.add(spellId);
    for (const id of crossSpellIds) ids.add(id);
    return Array.from(ids);
  }, [spellId, crossSpellIds]);

  // Fetch auras
  const { data: auras = [], isLoading: aurasLoading } = useAuras(allSpellIds);

  // Build spell cache
  const spellCache = useMemo(() => {
    const cache = new Map<number, Spell>();
    if (spell) cache.set(spell.id, spell);
    for (const s of crossSpells) {
      cache.set(s.id, s);
    }
    return cache;
  }, [spell, crossSpells]);

  // Build aura cache
  const auraCache = useMemo(() => {
    const cache = new Map<number, Aura>();
    for (const a of auras) {
      cache.set(a.spell_id, a);
    }
    return cache;
  }, [auras]);

  // Stable query key - serialize mutable objects
  const queryKey = useMemo(
    () => [
      "spell-desc",
      spellId,
      descriptionText,
      JSON.stringify(paperdoll),
      JSON.stringify([...knownSpells].sort()),
      JSON.stringify([...activeAuras].sort()),
      JSON.stringify(crossSpellIds.sort()),
    ],
    [
      spellId,
      descriptionText,
      paperdoll,
      knownSpells,
      activeAuras,
      crossSpellIds,
    ],
  );

  // Render with React Query
  const {
    data,
    error,
    isLoading: renderLoading,
  } = useQuery({
    enabled:
      !!descriptionText &&
      !!spell &&
      analysisComplete &&
      !crossSpellsLoading &&
      !aurasLoading,
    queryFn: async (): Promise<SpellDescRenderResult> => {
      if (!spell || !descriptionText) {
        return { fragments: [], parseErrors: [], warnings: [] };
      }

      const resolver = buildResolver(
        spell,
        spellCache,
        auraCache,
        paperdoll,
        knownSpells,
        activeAuras,
      );

      return renderSpellDescription(descriptionText, spell.id, resolver);
    },
    queryKey,
    staleTime: SPELL_DESC_CACHE_TTL,
  });

  return {
    error: error as Error | null,
    isLoading:
      spellLoading ||
      !analysisComplete ||
      crossSpellsLoading ||
      aurasLoading ||
      renderLoading,
    raw: descriptionText,
    result: data ?? null,
    spell,
  };
}

function parseEffects(spell: Spell): SpellEffect[] {
  const spellAny = spell as Record<string, unknown>;
  if (spellAny.effects) {
    if (typeof spellAny.effects === "string") {
      try {
        return JSON.parse(spellAny.effects);
      } catch {
        return [];
      }
    }
    if (Array.isArray(spellAny.effects)) {
      return spellAny.effects as SpellEffect[];
    }
  }
  return [];
}

"use client";

import { useCallback, useMemo } from "react";

import type {
  Aura,
  Class,
  GlobalColor,
  GlobalString,
  SpecSummary,
  Spell,
} from "@/lib/supabase/types";
import type { SpellDescRenderResult, SpellDescResolver } from "@/lib/wasm";

import { useCommon } from "@/providers";

import { useResource, useResourceMany } from "../hooks/use-resource";
import { auras, spells } from "../resources";

export interface PaperdollState {
  ap: number;
  classId: number;
  crit: number;
  isMale: boolean;
  level: number;
  mastery: number;
  maxHealth: number;
  sp: number;
  vers: number;
}

// TODO Replace this crap
function formatDuration(ms: number): string {
  if (ms === 0) {
    return "0 sec";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} hr ${remainingMinutes} min`
      : hours === 1
        ? "1 hour"
        : `${hours} hours`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes} min ${remainingSeconds} sec`
      : minutes === 1
        ? "1 min"
        : `${minutes} min`;
  }

  return seconds === 1 ? "1 sec" : `${seconds} sec`;
}

import { useResourceList } from "../hooks/use-resource";
import { classes, globalColors, globalStrings, specs } from "../resources";

// TODO Replace this crap
function formatRange(yards: number): string {
  return yards === 0 ? "Melee" : `${yards} yd`;
}

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
      if (!spell?.description_variables) {
        return null;
      }

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
      if (!s) {
        return null;
      }

      const effects = parseEffects(s);
      const effect = effects.find((e) => e.index === effectIndex - 1);
      if (!effect) {
        return null;
      }

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
      if (!s) {
        return null;
      }

      const baseType = varType.replace(/\d+$/, "");

      switch (baseType) {
        case "c":
          return s.cast_time ? `${(s.cast_time / 1000).toFixed(1)} sec` : null;
        case "d":
          return s.duration ? formatDuration(s.duration) : null;
        case "h":
          return null;
        case "i":
          return null;
        case "n":
          return s.max_charges ? String(s.max_charges) : null;
        case "p":
          return null;
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

export function useClassesAndSpecs() {
  const { data: specsData = [], isLoading: specsLoading } =
    useResourceList<SpecSummary>({
      ...specs,
      meta: {
        ...specs.meta,
        select: "id, name, class_name, class_id, file_name",
      },
      pagination: { mode: "off" },
      sorters: [
        { field: "class_name", order: "asc" },
        { field: "order_index", order: "asc" },
      ],
    });

  const { data: classesData = [], isLoading: classesLoading } =
    useResourceList<Class>({
      ...classes,
      sorters: [{ field: "id", order: "asc" }],
    });

  const isLoading = specsLoading || classesLoading;

  const classMap = useMemo(() => {
    const map = new Map<number, Class>();
    for (const cls of classesData) {
      map.set(cls.id, cls);
    }
    return map;
  }, [classesData]);

  const classOptions = useMemo(() => {
    return classesData
      .map((cls) => ({
        color: cls.color ?? "",
        fileName: cls.file_name,
        id: cls.id,
        label: cls.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [classesData]);

  const getClassColor = useCallback(
    (specId: number) => {
      const spec = specsData.find((s) => s.id === specId);
      if (!spec) {
        return null;
      }
      const cls = classMap.get(spec.class_id);
      return cls?.color ?? null;
    },
    [specsData, classMap],
  );

  const getSpecIdsForClass = useCallback(
    (classId: number) => {
      return specsData.filter((s) => s.class_id === classId).map((s) => s.id);
    },
    [specsData],
  );

  const getSpecLabel = useCallback(
    (specId: number) => {
      const spec = specsData.find((s) => s.id === specId);
      return spec?.name ?? null;
    },
    [specsData],
  );

  const getSpecIcon = useCallback(
    (specId: number) => {
      const spec = specsData.find((s) => s.id === specId);
      if (!spec) {
        return null;
      }
      return spec.file_name ?? null;
    },
    [specsData],
  );

  return {
    classes: classOptions,
    getClassColor,
    getSpecIcon,
    getSpecIdsForClass,
    getSpecLabel,
    isLoading,
    specs: specsData,
  };
}

export function useGlobalColors<T extends string[]>(...names: T) {
  const { data = [] } = useResourceMany<GlobalColor>({
    ...globalColors,
    ids: names,
    queryOptions: { enabled: names.length > 0 },
  });

  return names.map((name) => data.find((c) => c.name === name)) as {
    [K in keyof T]: GlobalColor | undefined;
  };
}

export function useGlobalStrings<T extends string[]>(...tags: T) {
  const { data = [] } = useResourceMany<GlobalString>({
    ...globalStrings,
    ids: tags,
    queryOptions: { enabled: tags.length > 0 },
  });

  return tags.map((tag) => data.find((s) => s.tag === tag)) as {
    [K in keyof T]: GlobalString | undefined;
  };
}

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
  const common = useCommon();

  const { data: spell, isLoading: spellLoading } = useResource<Spell>({
    ...spells,
    id: spellId ?? "",
    queryOptions: { enabled: spellId != null },
  });

  const descriptionText = description ?? spell?.description ?? "";

  const { analysisError, crossSpellIds } = useMemo(() => {
    if (!descriptionText || !spellId) {
      return { analysisError: null, crossSpellIds: [] };
    }

    try {
      const result = common.analyzeSpellDesc(descriptionText, spellId);
      const ids = new Set<number>();

      for (const eff of result.dependencies.effects) {
        if (eff.spellId !== spellId) {
          ids.add(eff.spellId);
        }
      }

      for (const sv of result.dependencies.spellValues) {
        if (sv.spellId !== spellId) {
          ids.add(sv.spellId);
        }
      }

      for (const embed of result.dependencies.embeddedSpellIds) {
        ids.add(embed);
      }

      return { analysisError: null, crossSpellIds: Array.from(ids) };
    } catch (err) {
      return {
        analysisError: err instanceof Error ? err : new Error(String(err)),
        crossSpellIds: [],
      };
    }
  }, [common, descriptionText, spellId]);

  const { data: crossSpells = [], isLoading: crossSpellsLoading } =
    useResourceMany<Spell>({
      ...spells,
      ids: crossSpellIds,
      queryOptions: { enabled: crossSpellIds.length > 0 },
    });

  const allSpellIds = useMemo(() => {
    const ids = new Set<number>();
    if (spellId) {
      ids.add(spellId);
    }
    for (const id of crossSpellIds) {
      ids.add(id);
    }
    return Array.from(ids);
  }, [spellId, crossSpellIds]);

  const { data: aurasData = [], isLoading: aurasLoading } =
    useResourceMany<Aura>({
      ...auras,
      ids: allSpellIds,
      queryOptions: { enabled: allSpellIds.length > 0 },
    });

  const spellCache = useMemo(() => {
    const cache = new Map<number, Spell>();
    if (spell) {
      cache.set(spell.id, spell);
    }
    for (const s of crossSpells) {
      cache.set(s.id, s);
    }
    return cache;
  }, [spell, crossSpells]);

  const auraCache = useMemo(() => {
    const cache = new Map<number, Aura>();
    for (const a of aurasData) {
      cache.set(a.spell_id, a);
    }
    return cache;
  }, [aurasData]);

  const { renderError, renderResult } = useMemo(() => {
    if (!descriptionText || !spell || crossSpellsLoading || aurasLoading) {
      return { renderError: null, renderResult: null };
    }

    try {
      const resolver = buildResolver(
        spell,
        spellCache,
        auraCache,
        paperdoll,
        knownSpells,
        activeAuras,
      );

      const result = common.renderSpellDesc(
        descriptionText,
        spell.id,
        resolver,
      );
      return { renderError: null, renderResult: result };
    } catch (err) {
      return {
        renderError: err instanceof Error ? err : new Error(String(err)),
        renderResult: null,
      };
    }
  }, [
    common,
    descriptionText,
    spell,
    crossSpellsLoading,
    aurasLoading,
    spellCache,
    auraCache,
    paperdoll,
    knownSpells,
    activeAuras,
  ]);

  return {
    error: analysisError ?? renderError,
    isLoading: spellLoading || crossSpellsLoading || aurasLoading,
    raw: descriptionText,
    result: renderResult,
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

import type { SpellDbcData } from "./dbc";
import { formatNumber } from "./cst";

export function isEffectVarType(varType: string): boolean {
  return (
    varType === "s" ||
    varType === "m" ||
    varType === "M" ||
    varType === "o" ||
    varType === "t" ||
    varType === "a" ||
    varType === "A" ||
    varType === "e" ||
    varType === "w" ||
    varType === "x" ||
    varType === "bc" ||
    varType === "q"
  );
}

export function isSpellLevelVarType(varType: string): boolean {
  return (
    varType === "d" ||
    varType === "n" ||
    varType === "u" ||
    varType === "h" ||
    varType === "r" ||
    varType === "i" ||
    varType === "p"
  );
}

export function resolveEffectVariableFromSpell(
  spell: SpellDbcData,
  image: string,
): number {
  const body = image.slice(1);
  const effectIndex = Number(body.slice(-1));
  const varType = body.slice(0, -1);
  const effect = spell.effects.find((e) => e.EffectIndex === effectIndex);
  if (!effect) {
    return 0;
  }

  switch (varType) {
    case "s":
    case "m":
    case "M":
      return effect.EffectBasePointsF;

    case "t":
      return effect.EffectAuraPeriod / 1000;

    case "w":
      return effect.EffectAmplitude;

    case "x":
      return effect.EffectChainTargets;

    case "e":
      return effect.EffectPointsPerResource;

    case "bc":
      return effect.EffectBonusCoefficient;

    case "q":
      return effect.EffectMiscValue_0;

    case "a": {
      const radiusIndex = effect.EffectRadiusIndex_0;
      const row = spell.radiusByIndex.get(radiusIndex);

      return row?.Radius ?? 0;
    }

    case "A": {
      const radiusIndex = effect.EffectRadiusIndex_0;
      const row = spell.radiusByIndex.get(radiusIndex);

      return row?.RadiusMax ?? 0;
    }

    case "o": {
      const durationMs = spell.duration?.Duration ?? 0;
      const periodMs = effect.EffectAuraPeriod;

      if (durationMs <= 0 || periodMs <= 0) {
        return 0;
      }

      const ticks = durationMs / periodMs;

      return effect.EffectBasePointsF * ticks;
    }

    default:
      return 0;
  }
}

export function resolveSpellLevelVariableFromSpell(
  spell: SpellDbcData,
  image: string,
): number | string {
  const body = image.slice(1);
  const maybeIndex = Number(body.slice(-1));
  const hasIndex = !Number.isNaN(maybeIndex) && body.length > 1;
  const varType = hasIndex ? body.slice(0, -1) : body;
  const index = hasIndex ? maybeIndex : undefined;

  switch (varType) {
    case "d": {
      const durationMs =
        index === 2
          ? (spell.duration?.MaxDuration ?? 0)
          : (spell.duration?.Duration ?? 0);
      const sec = durationMs / 1000;

      return `${formatNumber(sec)} sec`;
    }
    case "n":
      return spell.auraOptions?.ProcCharges ?? 0;

    case "u":
      return spell.auraOptions?.CumulativeAura ?? 0;

    case "h":
      return spell.auraOptions?.ProcChance ?? 0;

    case "r":
      return spell.range?.RangeMax_0 ?? 0;

    case "i":
      return spell.targetRestrictions?.MaxTargets ?? 0;

    case "p": {
      const sorted = [...spell.power].sort(
        (a, b) => a.OrderIndex - b.OrderIndex,
      );

      const row = sorted[(index ?? 1) - 1];
      if (!row) {
        return 0;
      }

      return row.ManaCost > 0 ? row.ManaCost : row.PowerCostPct;
    }

    default:
      return 0;
  }
}

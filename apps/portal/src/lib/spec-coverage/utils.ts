import type { Spell } from "@wowlab/core/Schemas";

export type SpecCoverageSpell = Spell.SpellDataFlat & { supported: boolean };

export interface SpecCoverageSpec {
  id: number;
  name: string;
  spells: SpecCoverageSpell[];
}

export interface SpecCoverageClass {
  id: number;
  name: string;
  color: string;
  specs: SpecCoverageSpec[];
}

export interface SpecCoverageData {
  classes: SpecCoverageClass[];
}

// Handler info for spells tracked in spec definitions
// TODO: Will be populated from Rust engine TOML specs in the future
export interface UntrackedSpell {
  readonly className: string;
  readonly handlerId: string;
  readonly specId: string;
  readonly specName: string;
  readonly spellId: number;
}

export function calculateCoverage(spells: SpecCoverageSpell[]): number {
  if (spells.length === 0) {
    return 0;
  }
  const supported = spells.filter((s) => s.supported).length;
  return Math.round((supported / spells.length) * 100);
}

export function getCounts(spells: SpecCoverageSpell[]) {
  return {
    supported: spells.filter((s) => s.supported).length,
    total: spells.length,
  };
}

export function getOverallStats(data: SpecCoverageData) {
  const allSpells = data.classes.flatMap((c) =>
    c.specs.flatMap((s) => s.spells),
  );

  const supported = allSpells.filter((s) => s.supported).length;

  return {
    totalClasses: data.classes.length,
    totalSpecs: data.classes.reduce((sum, c) => sum + c.specs.length, 0),
    totalSpells: allSpells.length,
    supportedSpells: supported,
    coverage:
      allSpells.length > 0
        ? Math.round((supported / allSpells.length) * 100)
        : 0,
  };
}

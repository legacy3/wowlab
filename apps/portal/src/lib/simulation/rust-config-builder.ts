/**
 * Converts TypeScript spell/aura data to Rust engine SimConfig format.
 * This is a temporary bridge - will be refactored when TS types align with Rust.
 */

import type * as Schemas from "@wowlab/core/Schemas";

// ============================================================================
// Rust Engine Types (matching crates/engine/src/config/)
// ============================================================================

export type ResourceType =
  | "mana"
  | "focus"
  | "energy"
  | "rage"
  | "runic_power"
  | "fury"
  | "pain"
  | "maelstrom"
  | "insanity"
  | "astral_power"
  | "holy_power"
  | "chi"
  | "combo_points"
  | "soul_shards"
  | "arcane_charges"
  | "essence";

export type SpecId = "beast_mastery" | "marksmanship" | "survival";

export type DamageSchool =
  | "physical"
  | "holy"
  | "fire"
  | "nature"
  | "frost"
  | "shadow"
  | "arcane";

export type StatType =
  | "agility"
  | "intellect"
  | "strength"
  | "stamina"
  | "crit"
  | "haste"
  | "mastery"
  | "versatility"
  | "attack_power"
  | "spell_power";

export type ProcTrigger =
  | "on_spell_cast"
  | "on_spell_hit"
  | "on_spell_crit"
  | "on_melee_hit"
  | "on_melee_crit"
  | "on_damage_taken"
  | "on_heal";

export interface DamageFormula {
  base_min: number;
  base_max: number;
  ap_coefficient: number;
  sp_coefficient: number;
  weapon_coefficient: number;
}

export interface ResourceCost {
  resource_type: ResourceType;
  amount: number;
}

export type SpellEffect =
  | { type: "damage"; formula: DamageFormula }
  | { type: "apply_aura"; aura_id: number; duration: number }
  | { type: "heal"; formula: DamageFormula }
  | { type: "energize"; resource_type: ResourceType; amount: number }
  | { type: "summon"; unit_id: number; duration: number }
  | { type: "trigger_spell"; spell_id: number };

export interface SpellDef {
  id: number;
  name: string;
  cooldown: number;
  charges: number;
  gcd: number;
  cast_time: number;
  cost: ResourceCost;
  damage: DamageFormula;
  effects: SpellEffect[];
  is_gcd: boolean;
  is_harmful: boolean;
}

export type AuraEffect =
  | { type: "flat_stat"; stat: StatType; amount: number }
  | { type: "percent_stat"; stat: StatType; percent: number }
  | { type: "damage_done"; percent: number; school?: DamageSchool }
  | { type: "damage_taken"; percent: number }
  | { type: "periodic_damage"; amount: number; coefficient: number }
  | { type: "periodic_heal"; amount: number; coefficient: number }
  | {
      type: "proc";
      trigger: ProcTrigger;
      spell_id: number;
      chance: number;
      icd: number;
    }
  | { type: "cooldown_reduction"; spell_id: number; reduction: number };

export interface AuraDef {
  id: number;
  name: string;
  duration: number;
  max_stacks: number;
  effects: AuraEffect[];
  pandemic: boolean;
  tick_interval: number;
  is_proc: boolean;
}

export interface Stats {
  intellect: number;
  agility: number;
  strength: number;
  stamina: number;
  crit_rating: number;
  haste_rating: number;
  mastery_rating: number;
  versatility_rating: number;
  crit_pct: number;
  haste_pct: number;
  mastery_pct: number;
  versatility_pct: number;
}

export interface ResourceConfig {
  resource_type: ResourceType;
  max: number;
  regen_per_second: number;
  initial: number;
}

export interface PlayerConfig {
  name: string;
  spec: SpecId;
  stats: Stats;
  resources: ResourceConfig;
  weapon_speed: number;
  weapon_damage: [number, number];
}

export interface PetConfig {
  name: string;
  stats: Stats;
  spells: SpellDef[];
  attack_speed: number;
  attack_damage: [number, number];
}

export interface TargetConfig {
  level_diff: number;
  max_health: number;
  armor: number;
}

export interface SimConfig {
  player: PlayerConfig;
  pet?: PetConfig;
  spells: SpellDef[];
  auras: AuraDef[];
  duration: number;
  target: TargetConfig;
}

// ============================================================================
// Power Type Mapping (WoW DBC powerType -> Rust ResourceType)
// ============================================================================

const POWER_TYPE_MAP: Record<number, ResourceType> = {
  0: "mana",
  1: "rage",
  2: "focus",
  3: "energy",
  4: "combo_points",
  5: "runic_power",
  6: "runic_power", // runes -> runic_power fallback
  7: "soul_shards",
  8: "astral_power", // lunar power
  9: "holy_power",
  10: "maelstrom", // alternate power
  11: "chi",
  12: "insanity",
  13: "fury", // burning embers -> fury
  14: "fury", // demonic fury
  17: "fury",
  18: "pain",
  19: "essence",
};

function mapPowerType(powerType: number): ResourceType {
  return POWER_TYPE_MAP[powerType] ?? "mana";
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert SpellDataFlat to Rust SpellDef
 */
export function mapSpellToRust(spell: Schemas.Spell.SpellDataFlat): SpellDef {
  // Cast time: recoveryTime is in ms, Rust expects seconds
  const castTimeMs = spell.castTime || 0;
  const castTimeSec = castTimeMs / 1000;

  // Cooldown: startRecoveryTime is the cooldown in ms
  const cooldownMs = spell.startRecoveryTime || spell.recoveryTime || 0;
  const cooldownSec = cooldownMs / 1000;

  // GCD: typically 1.5s for most spells, 0 for off-GCD
  // If recoveryTime > 0, it's on GCD
  const gcdSec = spell.recoveryTime > 0 ? 1.5 : 0;

  // Charges
  const charges = spell.maxCharges || 0;

  // Resource cost
  const cost: ResourceCost = {
    resource_type: mapPowerType(spell.powerType),
    amount: spell.powerCost || spell.manaCost || 0,
  };

  // Damage formula from scaling coefficients
  const damage: DamageFormula = {
    base_min: 0,
    base_max: 0,
    ap_coefficient: spell.bonusCoefficientFromAP || 0,
    sp_coefficient: spell.effectBonusCoefficient || 0,
    weapon_coefficient: 0,
  };

  // Build effects from triggered spells
  const effects: SpellEffect[] = [];
  for (const triggeredId of spell.effectTriggerSpell) {
    if (triggeredId > 0) {
      effects.push({ type: "trigger_spell", spell_id: triggeredId });
    }
  }

  // Check if spell applies an aura (duration > 0 implies aura)
  if (spell.duration > 0) {
    effects.push({
      type: "apply_aura",
      aura_id: spell.id,
      duration: spell.duration / 1000,
    });
  }

  return {
    id: spell.id,
    name: spell.name,
    cooldown: cooldownSec,
    charges,
    gcd: gcdSec,
    cast_time: castTimeSec,
    cost,
    damage,
    effects,
    is_gcd: gcdSec > 0,
    is_harmful: !spell.isPassive && spell.schoolMask > 0,
  };
}

/**
 * Convert AuraDataFlat to Rust AuraDef
 */
export function mapAuraToRust(aura: Schemas.Aura.AuraDataFlat): AuraDef {
  const effects: AuraEffect[] = [];

  // Add periodic effect if present
  if (aura.periodicType && aura.tickPeriodMs > 0) {
    if (aura.periodicType === "damage") {
      effects.push({
        type: "periodic_damage",
        amount: 0, // Base amount from spell effect, not stored in AuraDataFlat
        coefficient: 0,
      });
    } else if (aura.periodicType === "heal") {
      effects.push({
        type: "periodic_heal",
        amount: 0,
        coefficient: 0,
      });
    } else if (aura.periodicType === "trigger_spell") {
      // Would need spell ID from somewhere
    }
  }

  return {
    id: aura.spellId,
    name: "", // AuraDataFlat doesn't have name, would need to look up
    duration: aura.baseDurationMs / 1000,
    max_stacks: aura.maxStacks || 1,
    effects,
    pandemic: aura.pandemicRefresh,
    tick_interval: aura.tickPeriodMs / 1000,
    is_proc: false,
  };
}

// ============================================================================
// SimConfig Builder
// ============================================================================

export interface BuildSimConfigOptions {
  spells: Schemas.Spell.SpellDataFlat[];
  auras: Schemas.Aura.AuraDataFlat[];
  duration: number; // seconds
  player?: Partial<PlayerConfig>;
  pet?: Partial<PetConfig>;
  target?: Partial<TargetConfig>;
}

const DEFAULT_STATS: Stats = {
  intellect: 0,
  agility: 10000,
  strength: 0,
  stamina: 8000,
  crit_rating: 0,
  haste_rating: 0,
  mastery_rating: 0,
  versatility_rating: 0,
  crit_pct: 25,
  haste_pct: 20,
  mastery_pct: 30,
  versatility_pct: 5,
};

const DEFAULT_PLAYER: PlayerConfig = {
  name: "Player",
  spec: "beast_mastery",
  stats: DEFAULT_STATS,
  resources: {
    resource_type: "focus",
    max: 100,
    regen_per_second: 10,
    initial: 100,
  },
  weapon_speed: 3.0,
  weapon_damage: [500, 700],
};

const DEFAULT_TARGET: TargetConfig = {
  level_diff: 3,
  max_health: 10_000_000,
  armor: 0,
};

/**
 * Build a SimConfig for the Rust engine from TS spell/aura data
 */
export function buildSimConfig(options: BuildSimConfigOptions): SimConfig {
  const { spells, auras, duration, player, pet, target } = options;

  return {
    player: {
      ...DEFAULT_PLAYER,
      ...player,
      stats: { ...DEFAULT_STATS, ...player?.stats },
      resources: { ...DEFAULT_PLAYER.resources, ...player?.resources },
    },
    pet: pet
      ? {
          name: pet.name ?? "Pet",
          stats: { ...DEFAULT_STATS, ...pet.stats },
          spells: pet.spells ?? [],
          attack_speed: pet.attack_speed ?? 2.0,
          attack_damage: pet.attack_damage ?? [300, 400],
        }
      : undefined,
    spells: spells.map(mapSpellToRust),
    auras: auras.map(mapAuraToRust),
    duration,
    target: { ...DEFAULT_TARGET, ...target },
  };
}

// ============================================================================
// Hash + Upsert
// ============================================================================

/**
 * Hash a SimConfig to a stable string for deduplication
 */
export async function hashSimConfig(config: SimConfig): Promise<string> {
  // Sort keys for stable JSON
  const json = JSON.stringify(config, Object.keys(config).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface UpsertResult {
  hash: string;
  config: SimConfig;
  isNew: boolean;
}

/**
 * Upsert a SimConfig to the sim_configs table.
 * Returns the hash for referencing in sim jobs.
 */
export async function upsertSimConfig(
  supabase: { from: (table: string) => unknown },
  config: SimConfig,
): Promise<UpsertResult> {
  const hash = await hashSimConfig(config);

  // Type assertion for supabase client
  const client = supabase as {
    from: (table: string) => {
      upsert: (
        data: object,
        options: { onConflict: string },
      ) => { select: () => { single: () => Promise<{ error: unknown }> } };
    };
  };

  const { error } = await client
    .from("sim_configs")
    .upsert(
      {
        hash,
        config,
        lastUsedAt: new Date().toISOString(),
      },
      { onConflict: "hash" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert sim config: ${String(error)}`);
  }

  return { hash, config, isNew: true };
}

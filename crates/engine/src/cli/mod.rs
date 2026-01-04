//! CLI configuration and spec loading.
//!
//! This module provides TOML-based configuration for specs and rotations.
//!
//! # Spec Configuration
//!
//! A spec config file defines all the spells, auras, and default settings
//! for a class specialization.
//!
//! ```toml
//! [spec]
//! id = "hunter:beast-mastery"
//! name = "Beast Mastery"
//! class = "Hunter"
//! default_rotation = "rotations/bm_st.rhai"
//!
//! [player]
//! primary_stat = "agility"
//! resource = "focus"
//! resource_max = 100
//! resource_regen = 10.0
//!
//! [[spells]]
//! id = 34026
//! name = "Kill Command"
//! cooldown = 7.5
//! gcd = 1.5
//! cost = 30
//! damage = { base = [1000, 1200], ap_coeff = 0.6 }
//!
//! [[auras]]
//! id = 19574
//! name = "Bestial Wrath"
//! duration = 15.0
//! ```

pub mod error;

pub use error::ConfigError;

use std::fs;
use std::path::Path;

use serde::Deserialize;

use crate::config::{
    AuraDef, AuraEffect, DamageFormula, PlayerConfig, ResourceCost,
    SimConfig, SpecId, SpellDef, SpellEffect, TargetConfig,
};
use crate::paperdoll::{Paperdoll, SpecId as PaperdollSpecId};
use crate::resources::{ResourcePoolConfig, ResourceType, UnitResourcesConfig};

/// Top-level spec configuration.
#[derive(Debug, Deserialize)]
pub struct SpecConfig {
    /// Spec metadata
    pub spec: SpecMeta,

    /// Player configuration
    pub player: PlayerConfigToml,

    /// Pet configuration (optional)
    pub pet: Option<PetConfigToml>,

    /// Spell definitions
    #[serde(default)]
    pub spells: Vec<SpellConfigToml>,

    /// Aura definitions
    #[serde(default)]
    pub auras: Vec<AuraConfigToml>,

    /// Inline rotation (optional)
    pub rotation: Option<RotationConfig>,

    /// Target configuration (optional)
    pub target: Option<TargetConfigToml>,
}

/// Spec metadata.
#[derive(Debug, Deserialize)]
pub struct SpecMeta {
    /// Unique spec identifier (e.g., "hunter:beast-mastery")
    pub id: String,

    /// Display name (e.g., "Beast Mastery")
    pub name: String,

    /// Class name (e.g., "Hunter")
    pub class: String,

    /// Path to default rotation script
    pub default_rotation: Option<String>,

    /// Base64-encoded trait loadout string from game export
    pub traits: Option<String>,
}

/// Player configuration in TOML.
#[derive(Debug, Deserialize)]
pub struct PlayerConfigToml {
    /// Primary stat type (strength, agility, intellect)
    pub primary_stat: String,

    /// Resource type (mana, rage, energy, focus, runic_power, etc.)
    pub resource: String,

    /// Maximum resource
    #[serde(default = "default_resource_max")]
    pub resource_max: f32,

    /// Base resource regeneration per second (before haste).
    /// Focus/Energy/Essence are haste-scaled automatically.
    #[serde(default)]
    pub resource_regen: f32,

    /// Starting resource (defaults to max)
    pub resource_initial: Option<f32>,

    /// Secondary resource type (combo_points, chi, holy_power, etc.)
    pub secondary_resource: Option<String>,

    /// Secondary resource max (defaults to 5 for combo-style)
    pub secondary_resource_max: Option<f32>,

    /// Base stats (optional, can be overridden)
    pub stats: Option<StatsToml>,

    /// Weapon configuration
    pub weapon: Option<WeaponConfig>,
}

fn default_resource_max() -> f32 {
    100.0
}

/// Stats configuration.
#[derive(Debug, Deserialize, Default)]
pub struct StatsToml {
    // Primary attributes
    pub strength: Option<f32>,
    pub agility: Option<f32>,
    pub intellect: Option<f32>,
    pub stamina: Option<f32>,
    // Secondary ratings (converted to % with DR)
    pub crit_rating: Option<f32>,
    pub haste_rating: Option<f32>,
    pub mastery_rating: Option<f32>,
    pub versatility_rating: Option<f32>,
}

/// Weapon configuration.
#[derive(Debug, Deserialize)]
pub struct WeaponConfig {
    /// Weapon speed in seconds
    pub speed: f32,

    /// Damage range [min, max]
    pub damage: [f32; 2],
}

/// Pet configuration.
#[derive(Debug, Deserialize)]
pub struct PetConfigToml {
    /// Pet name
    pub name: String,

    /// Attack speed in seconds
    pub attack_speed: f32,

    /// Attack damage range [min, max]
    pub attack_damage: [f32; 2],

    /// Pet stats
    pub stats: Option<StatsToml>,
}

/// Spell configuration.
#[derive(Debug, Deserialize)]
pub struct SpellConfigToml {
    /// Spell ID
    pub id: u32,

    /// Spell name
    pub name: String,

    /// Cooldown in seconds
    #[serde(default)]
    pub cooldown: f32,

    /// Number of charges (0 = not charge-based)
    #[serde(default)]
    pub charges: u8,

    /// GCD duration in seconds (0 = off-GCD)
    #[serde(default = "default_gcd")]
    pub gcd: f32,

    /// Cast time in seconds (0 = instant)
    #[serde(default)]
    pub cast_time: f32,

    /// Resource cost
    #[serde(default)]
    pub cost: f32,

    /// Resource type for cost (defaults to player resource)
    pub cost_type: Option<String>,

    /// Damage configuration
    pub damage: Option<DamageConfig>,

    /// Effects (apply aura, energize, etc.)
    #[serde(default)]
    pub effects: Vec<SpellEffectConfig>,

    /// Whether this spell is harmful (vs beneficial)
    #[serde(default = "default_true")]
    pub harmful: bool,
}

fn default_gcd() -> f32 {
    1.5
}

fn default_true() -> bool {
    true
}

/// Damage configuration.
#[derive(Debug, Deserialize)]
pub struct DamageConfig {
    /// Base damage range [min, max] or single value
    #[serde(default)]
    pub base: DamageRange,

    /// Attack power coefficient
    #[serde(default)]
    pub ap_coeff: f32,

    /// Spell power coefficient
    #[serde(default)]
    pub sp_coeff: f32,
}

/// Damage range - can be single value or [min, max].
#[derive(Debug, Deserialize, Default)]
#[serde(untagged)]
pub enum DamageRange {
    #[default]
    Zero,
    Single(f32),
    Range([f32; 2]),
}

impl DamageRange {
    pub fn to_min_max(&self) -> (f32, f32) {
        match self {
            DamageRange::Zero => (0.0, 0.0),
            DamageRange::Single(v) => (*v, *v),
            DamageRange::Range([min, max]) => (*min, *max),
        }
    }
}

/// Spell effect configuration.
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum SpellEffectConfig {
    /// Apply an aura
    #[serde(rename = "apply_aura")]
    ApplyAura {
        /// Aura ID to apply
        aura_id: u32,
        /// Duration override (optional)
        duration: Option<f32>,
    },

    /// Energize resource
    #[serde(rename = "energize")]
    Energize {
        /// Amount of resource to grant
        amount: f32,
        /// Resource type (optional, defaults to player resource)
        resource: Option<String>,
    },
}

/// Aura configuration.
#[derive(Debug, Deserialize)]
pub struct AuraConfigToml {
    /// Aura ID
    pub id: u32,

    /// Aura name
    pub name: String,

    /// Duration in seconds
    pub duration: f32,

    /// Maximum stacks
    #[serde(default = "default_one")]
    pub max_stacks: u8,

    /// Tick interval for periodic effects (0 = no periodic)
    #[serde(default)]
    pub tick_interval: f32,

    /// Whether this aura can be pandemic refreshed
    #[serde(default)]
    pub pandemic: bool,

    /// Periodic damage configuration
    pub periodic_damage: Option<PeriodicDamageConfig>,

    /// Damage modifier (e.g., +25% damage)
    pub damage_mod: Option<f32>,
}

fn default_one() -> u8 {
    1
}

/// Periodic damage configuration.
#[derive(Debug, Deserialize)]
pub struct PeriodicDamageConfig {
    /// Base damage per tick
    #[serde(default)]
    pub amount: f32,

    /// AP coefficient per tick
    #[serde(default)]
    pub ap_coeff: f32,
}

/// Inline rotation configuration.
#[derive(Debug, Deserialize)]
pub struct RotationConfig {
    /// Rotation script (Rhai)
    pub script: String,
}

/// Target configuration.
#[derive(Debug, Deserialize)]
pub struct TargetConfigToml {
    /// Level difference from player
    #[serde(default = "default_level_diff")]
    pub level_diff: i8,

    /// Target max health
    #[serde(default = "default_health")]
    pub max_health: f32,

    /// Target armor
    #[serde(default)]
    pub armor: f32,
}

fn default_level_diff() -> i8 {
    3
}

fn default_health() -> f32 {
    10_000_000.0
}

impl SpecConfig {
    /// Convert to engine SimConfig.
    pub fn to_sim_config(&self) -> Result<SimConfig, ConfigError> {
        let resource_type = parse_resource_type(&self.player.resource)?;
        let paperdoll_spec = parse_paperdoll_spec_id(&self.spec.id);

        // Build player paperdoll
        let (strength, agility, intellect, stamina, crit_rating, haste_rating, mastery_rating, versatility_rating) =
            if let Some(ref s) = self.player.stats {
                (
                    s.strength.unwrap_or(0.0),
                    s.agility.unwrap_or(0.0),
                    s.intellect.unwrap_or(0.0),
                    s.stamina.unwrap_or(8000.0),
                    s.crit_rating.unwrap_or(5000.0),      // ~25% at 80
                    s.haste_rating.unwrap_or(3500.0),     // ~20% at 80
                    s.mastery_rating.unwrap_or(5000.0),   // ~30% at 80
                    s.versatility_rating.unwrap_or(1500.0), // ~5% at 80
                )
            } else {
                // Default stats based on primary stat
                let (str_val, agi_val, int_val) = match self.player.primary_stat.to_lowercase().as_str() {
                    "strength" => (10000.0, 0.0, 0.0),
                    "agility" => (0.0, 10000.0, 0.0),
                    "intellect" => (0.0, 0.0, 10000.0),
                    _ => (0.0, 0.0, 0.0),
                };
                (str_val, agi_val, int_val, 8000.0, 5000.0, 3500.0, 5000.0, 1500.0)
            };

        let paperdoll = Paperdoll::from_config(
            80, // level
            paperdoll_spec,
            agility,
            strength,
            intellect,
            stamina,
            crit_rating,
            haste_rating,
            mastery_rating,
            versatility_rating,
        );

        // Build weapon config
        let (weapon_speed, weapon_damage) = if let Some(ref w) = self.player.weapon {
            (w.speed, (w.damage[0], w.damage[1]))
        } else {
            (0.0, (0.0, 0.0))
        };

        // Build player config
        let player = PlayerConfig {
            name: self.spec.name.clone(),
            spec: parse_spec_id(&self.spec.id),
            paperdoll,
            resources: {
                // Build secondary resource if specified
                let secondary = self.player.secondary_resource.as_ref().and_then(|res| {
                    parse_resource_type(res).ok().map(|rt| ResourcePoolConfig {
                        resource_type: rt,
                        max: self.player.secondary_resource_max.unwrap_or(
                            if rt.is_integer() { 5.0 } else { 100.0 }
                        ),
                        base_regen: 0.0, // Secondary resources don't passively regen
                        initial: 0.0,    // Start at 0 for builder/spender
                    })
                });

                // TODO Hacked-Junk
                let is_dk = self.spec.class.to_lowercase() == "deathknight"
                    || self.spec.class.to_lowercase() == "death_knight"
                    || self.spec.class.to_lowercase() == "death knight";

                UnitResourcesConfig {
                    primary: ResourcePoolConfig {
                        resource_type,
                        max: self.player.resource_max,
                        base_regen: self.player.resource_regen,
                        initial: self.player.resource_initial.unwrap_or(self.player.resource_max),
                    },
                    secondary,
                    uses_runes: is_dk,
                }
            },
            weapon_speed,
            weapon_damage,
        };

        // Build pet config
        let pet = self.pet.as_ref().map(|p| {
            let (pet_strength, pet_agility, pet_intellect, pet_stamina, pet_crit_rating, pet_haste_rating, pet_mastery_rating, pet_vers_rating) =
                if let Some(ref s) = p.stats {
                    (
                        s.strength.unwrap_or(1000.0),
                        s.agility.unwrap_or(5000.0),
                        s.intellect.unwrap_or(0.0),
                        s.stamina.unwrap_or(4000.0),
                        s.crit_rating.unwrap_or(3000.0),    // ~15% at 80
                        s.haste_rating.unwrap_or(2500.0),   // ~15% at 80
                        s.mastery_rating.unwrap_or(0.0),
                        s.versatility_rating.unwrap_or(0.0),
                    )
                } else {
                    (1000.0, 5000.0, 0.0, 4000.0, 3000.0, 2500.0, 0.0, 0.0)
                };

            let pet_paperdoll = Paperdoll::from_config(
                80,
                paperdoll_spec,
                pet_agility,
                pet_strength,
                pet_intellect,
                pet_stamina,
                pet_crit_rating,
                pet_haste_rating,
                pet_mastery_rating,
                pet_vers_rating,
            );

            crate::config::PetConfig {
                name: p.name.clone(),
                paperdoll: pet_paperdoll,
                spells: vec![],
                attack_speed: p.attack_speed,
                attack_damage: (p.attack_damage[0], p.attack_damage[1]),
            }
        });

        // Build spell definitions
        let default_resource = resource_type;
        let spells: Vec<SpellDef> = self
            .spells
            .iter()
            .map(|s| {
                let cost_type = s
                    .cost_type
                    .as_ref()
                    .and_then(|t| parse_resource_type(t).ok())
                    .unwrap_or(default_resource);

                let damage = s.damage.as_ref().map(|d| {
                    let (min, max) = d.base.to_min_max();
                    DamageFormula {
                        base_min: min,
                        base_max: max,
                        ap_coefficient: d.ap_coeff,
                        sp_coefficient: d.sp_coeff,
                        ..Default::default()
                    }
                }).unwrap_or_default();

                let effects: Vec<SpellEffect> = s
                    .effects
                    .iter()
                    .map(|e| match e {
                        SpellEffectConfig::ApplyAura { aura_id, duration } => {
                            SpellEffect::ApplyAura {
                                aura_id: *aura_id,
                                duration: duration.unwrap_or(0.0),
                            }
                        }
                        SpellEffectConfig::Energize { amount, resource } => {
                            SpellEffect::Energize {
                                resource_type: resource
                                    .as_ref()
                                    .and_then(|r| parse_resource_type(r).ok())
                                    .unwrap_or(default_resource),
                                amount: *amount,
                            }
                        }
                    })
                    .collect();

                SpellDef {
                    id: s.id,
                    name: s.name.clone(),
                    cooldown: s.cooldown,
                    charges: s.charges,
                    gcd: s.gcd,
                    cast_time: s.cast_time,
                    cost: ResourceCost {
                        resource_type: cost_type,
                        amount: s.cost,
                    },
                    damage,
                    effects,
                    is_gcd: s.gcd > 0.0,
                    is_harmful: s.harmful,
                }
            })
            .collect();

        // Build aura definitions
        let auras: Vec<AuraDef> = self
            .auras
            .iter()
            .map(|a| {
                let mut effects = Vec::new();

                if let Some(ref pd) = a.periodic_damage {
                    effects.push(AuraEffect::PeriodicDamage {
                        amount: pd.amount,
                        coefficient: pd.ap_coeff,
                    });
                }

                if let Some(mod_pct) = a.damage_mod {
                    effects.push(AuraEffect::DamageDone {
                        percent: mod_pct,
                        school: None,
                    });
                }

                AuraDef {
                    id: a.id,
                    name: a.name.clone(),
                    duration: a.duration,
                    max_stacks: a.max_stacks,
                    effects,
                    pandemic: a.pandemic,
                    tick_interval: a.tick_interval,
                    is_proc: false,
                }
            })
            .collect();

        // Build target config
        let target = self.target.as_ref().map(|t| TargetConfig {
            level_diff: t.level_diff,
            max_health: t.max_health,
            armor: t.armor,
        }).unwrap_or(TargetConfig {
            level_diff: 3,
            max_health: 10_000_000.0,
            armor: 0.0,
        });

        Ok(SimConfig {
            player,
            pet,
            spells,
            auras,
            duration: 300.0, // Default, can be overridden
            target,
        })
    }
}

/// Load a spec configuration from a TOML file.
pub fn load_spec_config(path: &Path) -> Result<SpecConfig, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file '{}': {}", path.display(), e))?;

    toml::from_str(&content)
        .map_err(|e| format!("Failed to parse TOML '{}': {}", path.display(), e))
}

fn parse_resource_type(s: &str) -> Result<ResourceType, ConfigError> {
    match s.to_lowercase().as_str() {
        "mana" => Ok(ResourceType::Mana),
        "rage" => Ok(ResourceType::Rage),
        "energy" => Ok(ResourceType::Energy),
        "focus" => Ok(ResourceType::Focus),
        "runic_power" | "runicpower" => Ok(ResourceType::RunicPower),
        "combo_points" | "combopoints" => Ok(ResourceType::ComboPoints),
        "holy_power" | "holypower" => Ok(ResourceType::HolyPower),
        "soul_shards" | "soulshards" => Ok(ResourceType::SoulShards),
        "astral_power" | "astralpower" => Ok(ResourceType::AstralPower),
        "maelstrom" => Ok(ResourceType::Maelstrom),
        "fury" => Ok(ResourceType::Fury),
        "pain" => Ok(ResourceType::Pain),
        "insanity" => Ok(ResourceType::Insanity),
        "arcane_charges" | "arcanecharges" => Ok(ResourceType::ArcaneCharges),
        "chi" => Ok(ResourceType::Chi),
        "essence" => Ok(ResourceType::Essence),
        _ => Err(ConfigError::UnknownResource {
            resource: s.to_string(),
        }),
    }
}

fn parse_spec_id(id: &str) -> SpecId {
    // Parse spec ID like "hunter:beast-mastery"
    match id.to_lowercase().as_str() {
        "hunter:beast-mastery" | "hunter:bm" => SpecId::BeastMastery,
        "hunter:marksmanship" | "hunter:mm" => SpecId::Marksmanship,
        "hunter:survival" | "hunter:sv" => SpecId::Survival,
        _ => SpecId::BeastMastery, // Default fallback
    }
}

fn parse_paperdoll_spec_id(id: &str) -> PaperdollSpecId {
    // Parse spec ID like "hunter:beast-mastery" to paperdoll SpecId
    match id.to_lowercase().as_str() {
        "hunter:beast-mastery" | "hunter:bm" => PaperdollSpecId::BeastMastery,
        "hunter:marksmanship" | "hunter:mm" => PaperdollSpecId::Marksmanship,
        "hunter:survival" | "hunter:sv" => PaperdollSpecId::Survival,
        _ => PaperdollSpecId::BeastMastery, // Default fallback
    }
}

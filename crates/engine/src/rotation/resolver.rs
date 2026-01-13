//! Name resolution for rotations.
//!
//! Maps spell/aura names to game IDs and builds context schema.

use std::collections::{HashMap, HashSet};

use crate::types::{AuraIdx, SpellIdx};

use super::ast::VarPath;
use super::error::{Error, Result};

/// Spec-specific name resolver.
///
/// Each spec provides one of these to map rotation names to game IDs.
#[derive(Debug, Clone)]
pub struct SpecResolver {
    pub name: String,
    pub resource_type: Option<String>,
    spells: HashMap<String, SpellIdx>,
    auras: HashMap<String, AuraIdx>,
    dots: HashMap<String, AuraIdx>,
    talents: HashMap<String, bool>,
    charged_cooldowns: HashSet<String>,
}

impl SpecResolver {
    /// Create a new spec resolver.
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            resource_type: None,
            spells: HashMap::new(),
            auras: HashMap::new(),
            dots: HashMap::new(),
            talents: HashMap::new(),
            charged_cooldowns: HashSet::new(),
        }
    }

    /// Set the primary resource type.
    pub fn resource(mut self, resource_type: impl Into<String>) -> Self {
        self.resource_type = Some(resource_type.into());
        self
    }

    /// Register a spell.
    pub fn spell(mut self, name: impl Into<String>, id: u32) -> Self {
        self.spells.insert(name.into(), SpellIdx(id));
        self
    }

    /// Register an aura (buff/debuff).
    pub fn aura(mut self, name: impl Into<String>, id: u32) -> Self {
        self.auras.insert(name.into(), AuraIdx(id));
        self
    }

    /// Register a DoT (debuff applied by player).
    pub fn dot(mut self, name: impl Into<String>, id: u32) -> Self {
        let name = name.into();
        self.dots.insert(name.clone(), AuraIdx(id));
        // DoTs are also debuffs
        self.auras.insert(name, AuraIdx(id));
        self
    }

    /// Register a charged cooldown.
    pub fn charged_cooldown(mut self, name: impl Into<String>) -> Self {
        self.charged_cooldowns.insert(name.into());
        self
    }

    /// Register a talent with its current enabled state.
    pub fn talent(mut self, name: impl Into<String>, enabled: bool) -> Self {
        self.talents.insert(name.into(), enabled);
        self
    }

    /// Look up a spell by name.
    pub fn resolve_spell(&self, name: &str) -> Result<SpellIdx> {
        self.spells
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownSpell(name.to_string()))
    }

    /// Look up an aura by name.
    pub fn resolve_aura(&self, name: &str) -> Result<AuraIdx> {
        self.auras
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownAura(name.to_string()))
    }

    /// Look up a DoT by name.
    pub fn resolve_dot(&self, name: &str) -> Result<AuraIdx> {
        self.dots
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownAura(name.to_string()))
    }

    /// Check if a talent is enabled.
    pub fn resolve_talent(&self, name: &str) -> Result<bool> {
        self.talents
            .get(name)
            .copied()
            .ok_or_else(|| Error::UnknownTalent(name.to_string()))
    }

    /// Check if a cooldown is charged.
    pub fn is_charged(&self, name: &str) -> bool {
        self.charged_cooldowns.contains(name)
    }

    /// Get the primary resource type.
    pub fn primary_resource(&self) -> Option<&str> {
        self.resource_type.as_deref()
    }

    /// Check if an aura is registered.
    pub fn has_aura(&self, name: &str) -> bool {
        self.auras.contains_key(name)
    }

    /// Check if a DoT is registered.
    pub fn has_dot(&self, name: &str) -> bool {
        self.dots.contains_key(name)
    }

    /// Check if a talent is registered (returns enabled state).
    pub fn has_talent(&self, name: &str) -> bool {
        self.talents.get(name).copied().unwrap_or(false)
    }
}

/// Resolved variable - ready for context population.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ResolvedVar {
    // === Resource ===
    Resource,
    ResourceMax,
    ResourceDeficit,
    ResourcePercent,
    ResourceRegen,

    // === Player ===
    PlayerHealth,
    PlayerHealthMax,
    PlayerHealthPercent,

    // === Cooldowns ===
    CdReady(SpellIdx),
    CdRemaining(SpellIdx),
    CdDuration(SpellIdx),
    CdCharges(SpellIdx),
    CdChargesMax(SpellIdx),
    CdRechargeTime(SpellIdx),
    CdFullRecharge(SpellIdx),

    // === Buffs ===
    BuffActive(AuraIdx),
    BuffInactive(AuraIdx),
    BuffRemaining(AuraIdx),
    BuffStacks(AuraIdx),
    BuffStacksMax(AuraIdx),
    BuffDuration(AuraIdx),

    // === Debuffs ===
    DebuffActive(AuraIdx),
    DebuffInactive(AuraIdx),
    DebuffRemaining(AuraIdx),
    DebuffStacks(AuraIdx),
    DebuffRefreshable(AuraIdx),

    // === DoTs ===
    DotTicking(AuraIdx),
    DotRemaining(AuraIdx),
    DotRefreshable(AuraIdx),
    DotTicksRemaining(AuraIdx),

    // === Target ===
    TargetHealthPercent,
    TargetTimeToDie,
    TargetDistance,

    // === Enemy ===
    EnemyCount,

    // === Combat ===
    CombatTime,
    CombatRemaining,

    // === GCD ===
    GcdRemaining,
    GcdDuration,

    // === Pet ===
    PetActive,
    PetRemaining,
    PetBuffActive(AuraIdx),

    // === Talent (compile-time constant) ===
    Talent(bool),

    // === Equipment ===
    TrinketReady(u8),
    TrinketRemaining(u8),

    // === Spell info ===
    SpellCost(SpellIdx),
    SpellCastTime(SpellIdx),
}

impl ResolvedVar {
    /// Returns true if this is a boolean variable.
    pub fn is_bool(&self) -> bool {
        matches!(
            self,
            Self::CdReady(_)
                | Self::BuffActive(_)
                | Self::BuffInactive(_)
                | Self::DebuffActive(_)
                | Self::DebuffInactive(_)
                | Self::DebuffRefreshable(_)
                | Self::DotTicking(_)
                | Self::DotRefreshable(_)
                | Self::PetActive
                | Self::PetBuffActive(_)
                | Self::Talent(_)
                | Self::TrinketReady(_)
        )
    }

    /// Returns true if this is an integer variable.
    pub fn is_int(&self) -> bool {
        matches!(
            self,
            Self::CdCharges(_)
                | Self::CdChargesMax(_)
                | Self::BuffStacks(_)
                | Self::BuffStacksMax(_)
                | Self::DebuffStacks(_)
                | Self::DotTicksRemaining(_)
                | Self::EnemyCount
        )
    }

    /// Returns true if this is a float variable.
    pub fn is_float(&self) -> bool {
        !self.is_bool() && !self.is_int()
    }
}

/// Resolve a variable path to a resolved variable.
pub fn resolve_var(path: &VarPath, resolver: &SpecResolver) -> Result<ResolvedVar> {
    match path {
        // Resource
        VarPath::Resource(r) => {
            check_resource(r, resolver)?;
            Ok(ResolvedVar::Resource)
        }
        VarPath::ResourceMax(r) => {
            check_resource(r, resolver)?;
            Ok(ResolvedVar::ResourceMax)
        }
        VarPath::ResourceDeficit(r) => {
            check_resource(r, resolver)?;
            Ok(ResolvedVar::ResourceDeficit)
        }
        VarPath::ResourcePercent(r) => {
            check_resource(r, resolver)?;
            Ok(ResolvedVar::ResourcePercent)
        }
        VarPath::ResourceRegen(r) => {
            check_resource(r, resolver)?;
            Ok(ResolvedVar::ResourceRegen)
        }

        // Player
        VarPath::PlayerHealth => Ok(ResolvedVar::PlayerHealth),
        VarPath::PlayerHealthMax => Ok(ResolvedVar::PlayerHealthMax),
        VarPath::PlayerHealthPercent => Ok(ResolvedVar::PlayerHealthPercent),

        // Cooldowns
        VarPath::CdReady(s) => Ok(ResolvedVar::CdReady(resolver.resolve_spell(s)?)),
        VarPath::CdRemaining(s) => Ok(ResolvedVar::CdRemaining(resolver.resolve_spell(s)?)),
        VarPath::CdDuration(s) => Ok(ResolvedVar::CdDuration(resolver.resolve_spell(s)?)),
        VarPath::CdCharges(s) => Ok(ResolvedVar::CdCharges(resolver.resolve_spell(s)?)),
        VarPath::CdChargesMax(s) => Ok(ResolvedVar::CdChargesMax(resolver.resolve_spell(s)?)),
        VarPath::CdRechargeTime(s) => Ok(ResolvedVar::CdRechargeTime(resolver.resolve_spell(s)?)),
        VarPath::CdFullRecharge(s) => Ok(ResolvedVar::CdFullRecharge(resolver.resolve_spell(s)?)),

        // Buffs
        VarPath::BuffActive(a) => Ok(ResolvedVar::BuffActive(resolver.resolve_aura(a)?)),
        VarPath::BuffInactive(a) => Ok(ResolvedVar::BuffInactive(resolver.resolve_aura(a)?)),
        VarPath::BuffRemaining(a) => Ok(ResolvedVar::BuffRemaining(resolver.resolve_aura(a)?)),
        VarPath::BuffStacks(a) => Ok(ResolvedVar::BuffStacks(resolver.resolve_aura(a)?)),
        VarPath::BuffStacksMax(a) => Ok(ResolvedVar::BuffStacksMax(resolver.resolve_aura(a)?)),
        VarPath::BuffDuration(a) => Ok(ResolvedVar::BuffDuration(resolver.resolve_aura(a)?)),

        // Debuffs
        VarPath::DebuffActive(a) => Ok(ResolvedVar::DebuffActive(resolver.resolve_aura(a)?)),
        VarPath::DebuffInactive(a) => Ok(ResolvedVar::DebuffInactive(resolver.resolve_aura(a)?)),
        VarPath::DebuffRemaining(a) => Ok(ResolvedVar::DebuffRemaining(resolver.resolve_aura(a)?)),
        VarPath::DebuffStacks(a) => Ok(ResolvedVar::DebuffStacks(resolver.resolve_aura(a)?)),
        VarPath::DebuffRefreshable(a) => {
            Ok(ResolvedVar::DebuffRefreshable(resolver.resolve_aura(a)?))
        }

        // DoTs
        VarPath::DotTicking(a) => Ok(ResolvedVar::DotTicking(resolver.resolve_dot(a)?)),
        VarPath::DotRemaining(a) => Ok(ResolvedVar::DotRemaining(resolver.resolve_dot(a)?)),
        VarPath::DotRefreshable(a) => Ok(ResolvedVar::DotRefreshable(resolver.resolve_dot(a)?)),
        VarPath::DotTicksRemaining(a) => {
            Ok(ResolvedVar::DotTicksRemaining(resolver.resolve_dot(a)?))
        }

        // Target
        VarPath::TargetHealthPercent => Ok(ResolvedVar::TargetHealthPercent),
        VarPath::TargetTimeToDie => Ok(ResolvedVar::TargetTimeToDie),
        VarPath::TargetDistance => Ok(ResolvedVar::TargetDistance),

        // Enemy
        VarPath::EnemyCount => Ok(ResolvedVar::EnemyCount),

        // Combat
        VarPath::CombatTime => Ok(ResolvedVar::CombatTime),
        VarPath::CombatRemaining => Ok(ResolvedVar::CombatRemaining),

        // GCD
        VarPath::GcdRemaining => Ok(ResolvedVar::GcdRemaining),
        VarPath::GcdDuration => Ok(ResolvedVar::GcdDuration),

        // Pet
        VarPath::PetActive => Ok(ResolvedVar::PetActive),
        VarPath::PetRemaining => Ok(ResolvedVar::PetRemaining),
        VarPath::PetBuffActive(a) => Ok(ResolvedVar::PetBuffActive(resolver.resolve_aura(a)?)),

        // Talent
        VarPath::Talent(t) => Ok(ResolvedVar::Talent(resolver.resolve_talent(t)?)),

        // Equipment
        VarPath::Equipped(_) => {
            // TODO: Item resolution
            Ok(ResolvedVar::Talent(false))
        }
        VarPath::TrinketReady(slot) => Ok(ResolvedVar::TrinketReady(*slot)),
        VarPath::TrinketRemaining(slot) => Ok(ResolvedVar::TrinketRemaining(*slot)),

        // Spell info
        VarPath::SpellCost(s) => Ok(ResolvedVar::SpellCost(resolver.resolve_spell(s)?)),
        VarPath::SpellCastTime(s) => Ok(ResolvedVar::SpellCastTime(resolver.resolve_spell(s)?)),
    }
}

fn check_resource(r: &str, resolver: &SpecResolver) -> Result<()> {
    if let Some(primary) = resolver.primary_resource() {
        if r == primary {
            return Ok(());
        }
    }
    // Allow any resource name for now
    Ok(())
}

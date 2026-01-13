//! Runtime context for JIT-compiled rotations.
//!
//! Dynamically builds a context schema based on what variables the rotation uses,
//! then populates it at runtime from SimState.

use std::collections::HashMap;

use crate::sim::SimState;

use super::resolver::ResolvedVar;

/// Context schema - describes the layout of the runtime context buffer.
#[derive(Debug, Clone)]
pub struct ContextSchema {
    /// Total size in bytes.
    pub size: usize,
    /// Field definitions with offsets.
    pub fields: Vec<ContextField>,
    /// Map from resolved var to offset for quick lookup.
    offsets: HashMap<ResolvedVar, usize>,
}

/// A single field in the context.
#[derive(Debug, Clone)]
pub struct ContextField {
    pub var: ResolvedVar,
    pub offset: usize,
    pub field_type: FieldType,
}

/// Field type for memory layout.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FieldType {
    Bool,  // 1 byte
    Int,   // 4 bytes (i32)
    Float, // 8 bytes (f64)
}

impl FieldType {
    pub fn size(self) -> usize {
        match self {
            Self::Bool => 1,
            Self::Int => 4,
            Self::Float => 8,
        }
    }

    pub fn alignment(self) -> usize {
        self.size()
    }
}

impl ContextSchema {
    /// Create a new schema builder.
    pub fn builder() -> SchemaBuilder {
        SchemaBuilder::new()
    }

    /// Get the offset for a resolved variable.
    pub fn offset(&self, var: &ResolvedVar) -> Option<usize> {
        self.offsets.get(var).copied()
    }

    /// Get field type for a resolved variable.
    pub fn field_type(&self, var: &ResolvedVar) -> Option<FieldType> {
        self.offsets.get(var).and_then(|offset| {
            self.fields
                .iter()
                .find(|f| f.offset == *offset)
                .map(|f| f.field_type)
        })
    }
}

/// Builder for context schema.
pub struct SchemaBuilder {
    fields: Vec<ContextField>,
    seen: HashMap<ResolvedVar, usize>,
    current_offset: usize,
}

impl SchemaBuilder {
    pub fn new() -> Self {
        Self {
            fields: Vec::new(),
            seen: HashMap::new(),
            current_offset: 0,
        }
    }

    /// Add a variable to the schema (deduplicates).
    pub fn add(&mut self, var: ResolvedVar) -> usize {
        if let Some(&offset) = self.seen.get(&var) {
            return offset;
        }

        let field_type = if var.is_bool() {
            FieldType::Bool
        } else if var.is_int() {
            FieldType::Int
        } else {
            FieldType::Float
        };

        // Align offset
        let alignment = field_type.alignment();
        if self.current_offset % alignment != 0 {
            self.current_offset += alignment - (self.current_offset % alignment);
        }

        let offset = self.current_offset;
        self.current_offset += field_type.size();

        self.fields.push(ContextField {
            var: var.clone(),
            offset,
            field_type,
        });
        self.seen.insert(var, offset);

        offset
    }

    /// Build the final schema.
    pub fn build(self) -> ContextSchema {
        // Align total size to 8 bytes
        let size = if self.current_offset % 8 != 0 {
            self.current_offset + (8 - self.current_offset % 8)
        } else {
            self.current_offset.max(8)
        };

        ContextSchema {
            size,
            fields: self.fields,
            offsets: self.seen,
        }
    }
}

impl Default for SchemaBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Populate a context buffer from SimState.
pub fn populate_context(buffer: &mut [u8], schema: &ContextSchema, state: &SimState) {
    let now = state.now();

    for field in &schema.fields {
        match &field.var {
            // Resource
            ResolvedVar::Resource => {
                if let Some(ref r) = state.player.resources.primary {
                    write_f64(buffer, field.offset, r.current as f64);
                }
            }
            ResolvedVar::ResourceMax => {
                if let Some(ref r) = state.player.resources.primary {
                    write_f64(buffer, field.offset, r.max as f64);
                }
            }
            ResolvedVar::ResourceDeficit => {
                if let Some(ref r) = state.player.resources.primary {
                    write_f64(buffer, field.offset, (r.max - r.current) as f64);
                }
            }
            ResolvedVar::ResourcePercent => {
                if let Some(ref r) = state.player.resources.primary {
                    let pct = if r.max > 0.0 {
                        (r.current / r.max) * 100.0
                    } else {
                        0.0
                    };
                    write_f64(buffer, field.offset, pct as f64);
                }
            }
            ResolvedVar::ResourceRegen => {
                // TODO: Add resource regen tracking
                write_f64(buffer, field.offset, 0.0);
            }

            // Player health - TODO: Add health tracking
            ResolvedVar::PlayerHealth => {
                write_f64(buffer, field.offset, 100000.0);
            }
            ResolvedVar::PlayerHealthMax => {
                write_f64(buffer, field.offset, 100000.0);
            }
            ResolvedVar::PlayerHealthPercent => {
                write_f64(buffer, field.offset, 100.0);
            }

            // Cooldowns
            ResolvedVar::CdReady(spell) => {
                let ready = state
                    .player
                    .cooldown(*spell)
                    .map(|cd| cd.is_ready(now))
                    .unwrap_or(true);
                write_bool(buffer, field.offset, ready);
            }
            ResolvedVar::CdRemaining(spell) => {
                let remaining = state
                    .player
                    .cooldown(*spell)
                    .map(|cd| cd.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::CdDuration(spell) => {
                let duration = state
                    .player
                    .cooldown(*spell)
                    .map(|cd| cd.base_duration.as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, duration as f64);
            }
            ResolvedVar::CdCharges(spell) => {
                let charges = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.current_charges as i32)
                    .unwrap_or(0);
                write_i32(buffer, field.offset, charges);
            }
            ResolvedVar::CdChargesMax(spell) => {
                let max = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.max_charges as i32)
                    .unwrap_or(0);
                write_i32(buffer, field.offset, max);
            }
            ResolvedVar::CdRechargeTime(spell) => {
                let time = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.time_until_charge(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, time as f64);
            }
            ResolvedVar::CdFullRecharge(spell) => {
                // Calculate time until all charges are full
                let time = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| {
                        if cd.is_full() {
                            0.0
                        } else {
                            // Time until next charge + recharge time for remaining charges
                            let charges_needed = cd.max_charges - cd.current_charges;
                            let time_to_next = cd.time_until_charge(now).as_secs_f32();
                            let additional = (charges_needed.saturating_sub(1) as f32)
                                * cd.recharge_time.as_secs_f32();
                            time_to_next + additional
                        }
                    })
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, time as f64);
            }

            // Buffs
            ResolvedVar::BuffActive(aura) => {
                let active = state.player.buffs.has(*aura, now);
                write_bool(buffer, field.offset, active);
            }
            ResolvedVar::BuffInactive(aura) => {
                let inactive = !state.player.buffs.has(*aura, now);
                write_bool(buffer, field.offset, inactive);
            }
            ResolvedVar::BuffRemaining(aura) => {
                let remaining = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::BuffStacks(aura) => {
                let stacks = state.player.buffs.stacks(*aura, now) as i32;
                write_i32(buffer, field.offset, stacks);
            }
            ResolvedVar::BuffStacksMax(aura) => {
                let max = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.max_stacks as i32)
                    .unwrap_or(0);
                write_i32(buffer, field.offset, max);
            }
            ResolvedVar::BuffDuration(aura) => {
                let duration = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.base_duration.as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, duration as f64);
            }

            // Debuffs
            ResolvedVar::DebuffActive(aura) => {
                let active = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, field.offset, active);
            }
            ResolvedVar::DebuffInactive(aura) => {
                let inactive = state
                    .enemies
                    .primary()
                    .map(|e| !e.debuffs.has(*aura, now))
                    .unwrap_or(true);
                write_bool(buffer, field.offset, inactive);
            }
            ResolvedVar::DebuffRemaining(aura) => {
                let remaining = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::DebuffStacks(aura) => {
                let stacks = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.stacks(*aura, now) as i32)
                    .unwrap_or(0);
                write_i32(buffer, field.offset, stacks);
            }
            ResolvedVar::DebuffRefreshable(aura) => {
                let refreshable = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| {
                        let remaining = a.remaining(now).as_secs_f32();
                        let duration = a.base_duration.as_secs_f32();
                        remaining < duration * 0.3
                    })
                    .unwrap_or(true);
                write_bool(buffer, field.offset, refreshable);
            }

            // DoTs (same as debuffs)
            ResolvedVar::DotTicking(aura) => {
                let ticking = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, field.offset, ticking);
            }
            ResolvedVar::DotRemaining(aura) => {
                let remaining = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::DotRefreshable(aura) => {
                let refreshable = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| {
                        let remaining = a.remaining(now).as_secs_f32();
                        let duration = a.base_duration.as_secs_f32();
                        remaining < duration * 0.3
                    })
                    .unwrap_or(true);
                write_bool(buffer, field.offset, refreshable);
            }
            ResolvedVar::DotTicksRemaining(aura) => {
                // Approximate based on remaining time / tick interval
                let ticks = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| {
                        let remaining = a.remaining(now).as_secs_f32();
                        // Assume 2s tick interval if unknown
                        (remaining / 2.0).ceil() as i32
                    })
                    .unwrap_or(0);
                write_i32(buffer, field.offset, ticks);
            }

            // Target
            ResolvedVar::TargetHealthPercent => {
                let pct = state
                    .enemies
                    .primary()
                    .map(|e| e.health_percent() * 100.0)
                    .unwrap_or(100.0);
                write_f64(buffer, field.offset, pct as f64);
            }
            ResolvedVar::TargetTimeToDie => {
                // Estimate based on remaining fight duration
                let ttd = state.remaining().as_secs_f32();
                write_f64(buffer, field.offset, ttd as f64);
            }
            ResolvedVar::TargetDistance => {
                // Default to melee range for now
                write_f64(buffer, field.offset, 5.0);
            }

            // Enemy
            ResolvedVar::EnemyCount => {
                let count = state.enemies.alive_count() as i32;
                write_i32(buffer, field.offset, count);
            }

            // Combat
            ResolvedVar::CombatTime => {
                let time = now.as_secs_f32();
                write_f64(buffer, field.offset, time as f64);
            }
            ResolvedVar::CombatRemaining => {
                let remaining = state.remaining().as_secs_f32();
                write_f64(buffer, field.offset, remaining as f64);
            }

            // GCD
            ResolvedVar::GcdRemaining => {
                let remaining = state.player.gcd_remaining(now).as_secs_f32();
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::GcdDuration => {
                // Base GCD is 1.5s, modified by haste
                let base_gcd = 1.5f32;
                let haste = state.player.stats.haste();
                let duration = base_gcd / haste;
                write_f64(buffer, field.offset, duration as f64);
            }

            // Pet
            ResolvedVar::PetActive => {
                let active = state.pets.active_count(now) > 0;
                write_bool(buffer, field.offset, active);
            }
            ResolvedVar::PetRemaining => {
                // Duration of first temporary pet
                let remaining = state
                    .pets
                    .active(now)
                    .filter_map(|p| p.expires_at)
                    .next()
                    .map(|expires| expires.saturating_sub(now).as_secs_f32())
                    .unwrap_or(0.0);
                write_f64(buffer, field.offset, remaining as f64);
            }
            ResolvedVar::PetBuffActive(aura) => {
                // Check first pet's buffs
                let active = state
                    .pets
                    .active(now)
                    .next()
                    .map(|p| p.buffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, field.offset, active);
            }

            // Talent (compile-time constant)
            ResolvedVar::Talent(enabled) => {
                write_bool(buffer, field.offset, *enabled);
            }

            // Trinkets (not yet implemented)
            ResolvedVar::TrinketReady(_) => {
                write_bool(buffer, field.offset, false);
            }
            ResolvedVar::TrinketRemaining(_) => {
                write_f64(buffer, field.offset, 0.0);
            }

            // Spell info
            ResolvedVar::SpellCost(_spell) => {
                // TODO: Look up spell cost from tuning
                write_f64(buffer, field.offset, 0.0);
            }
            ResolvedVar::SpellCastTime(_spell) => {
                // TODO: Look up spell cast time from tuning
                write_f64(buffer, field.offset, 0.0);
            }
        }
    }
}

#[inline]
fn write_bool(buffer: &mut [u8], offset: usize, value: bool) {
    buffer[offset] = if value { 1 } else { 0 };
}

#[inline]
fn write_i32(buffer: &mut [u8], offset: usize, value: i32) {
    let bytes = value.to_ne_bytes();
    buffer[offset..offset + 4].copy_from_slice(&bytes);
}

#[inline]
fn write_f64(buffer: &mut [u8], offset: usize, value: f64) {
    let bytes = value.to_ne_bytes();
    buffer[offset..offset + 8].copy_from_slice(&bytes);
}

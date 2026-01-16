//! Player expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use crate::stats::primary_stat_for_spec;
use crate::types::SimTime;

use super::{write_bool, write_f64, write_i32, FieldType, PopulateContext};

/// Player-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum PlayerExpr {
    /// Current player health.
    Health,
    /// Maximum player health.
    HealthMax,
    /// Player health percentage (0-100).
    HealthPercent,
    /// Health deficit (max - current).
    HealthDeficit,
    /// Haste rating percentage.
    Haste,
    /// Critical strike percentage.
    Crit,
    /// Mastery percentage.
    Mastery,
    /// Versatility percentage.
    Versatility,
    /// Attack power.
    AttackPower,
    /// Spell power.
    SpellPower,
    /// Character level.
    Level,
    /// Armor value.
    Armor,
    /// Stamina stat.
    Stamina,
    /// Primary stat value (str/agi/int based on spec).
    PrimaryStat,
    /// Player is moving.
    Moving,
    /// Remaining movement duration in seconds.
    MovementRemaining,
    /// Player is alive.
    Alive,
    /// Player is in combat.
    InCombat,
    /// Player is stealthed.
    Stealthed,
    /// Player is mounted.
    Mounted,
}

impl PopulateContext for PlayerExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, _now: SimTime) {
        let player = &state.player;
        match self {
            Self::Health => {
                write_f64(buffer, offset, player.health);
            }
            Self::HealthMax => {
                write_f64(buffer, offset, player.max_health);
            }
            Self::HealthPercent => {
                let percent = if player.max_health > 0.0 {
                    (player.health / player.max_health) * 100.0
                } else {
                    0.0
                };
                write_f64(buffer, offset, percent);
            }
            Self::HealthDeficit => {
                let deficit = player.max_health - player.health;
                write_f64(buffer, offset, deficit);
            }
            Self::Haste => {
                // Haste is stored as a multiplier (1.3 = 30% haste), convert to percentage
                let haste_pct = (player.stats.combat.haste - 1.0) * 100.0;
                write_f64(buffer, offset, haste_pct as f64);
            }
            Self::Crit => {
                // Crit is stored as 0-1 value, convert to percentage
                let crit_pct = player.stats.combat.crit_chance * 100.0;
                write_f64(buffer, offset, crit_pct as f64);
            }
            Self::Mastery => {
                // Mastery is already stored as a percentage value
                write_f64(buffer, offset, player.stats.combat.mastery as f64);
            }
            Self::Versatility => {
                // Versatility damage bonus is stored as 0-1 value, convert to percentage
                let vers_pct = player.stats.combat.versatility_damage * 100.0;
                write_f64(buffer, offset, vers_pct as f64);
            }
            Self::AttackPower => {
                write_f64(buffer, offset, player.stats.combat.attack_power as f64);
            }
            Self::SpellPower => {
                write_f64(buffer, offset, player.stats.combat.spell_power as f64);
            }
            Self::Level => {
                write_i32(buffer, offset, player.level as i32);
            }
            Self::Armor => {
                // TODO: Implement armor tracking when needed
                // For now return 0.0 as armor is typically not tracked for DPS simulations
                write_f64(buffer, offset, 0.0);
            }
            Self::Stamina => {
                write_f64(buffer, offset, player.stats.primary.stamina as f64);
            }
            Self::PrimaryStat => {
                let attr = primary_stat_for_spec(player.spec);
                let value = player.stats.primary.get(attr);
                write_f64(buffer, offset, value as f64);
            }
            Self::Moving => {
                write_bool(buffer, offset, player.is_moving);
            }
            Self::MovementRemaining => {
                write_f64(buffer, offset, player.movement_duration);
            }
            Self::Alive => {
                write_bool(buffer, offset, player.alive);
            }
            Self::InCombat => {
                write_bool(buffer, offset, player.in_combat);
            }
            Self::Stealthed => {
                write_bool(buffer, offset, player.stealthed);
            }
            Self::Mounted => {
                write_bool(buffer, offset, player.mounted);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Level => FieldType::Int,
            Self::Moving | Self::Alive | Self::InCombat | Self::Stealthed | Self::Mounted => {
                FieldType::Bool
            }
            _ => FieldType::Float,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::actor::Player;
    use crate::sim::{SimConfig, SimState};
    use crate::types::SpecId;

    fn read_f64(buffer: &[u8], offset: usize) -> f64 {
        assert!(
            offset + 8 <= buffer.len(),
            "read_f64: offset {} + 8 exceeds buffer length {}",
            offset,
            buffer.len()
        );
        let bytes: [u8; 8] = buffer[offset..offset + 8].try_into().unwrap();
        f64::from_ne_bytes(bytes)
    }

    fn read_bool(buffer: &[u8], offset: usize) -> bool {
        buffer[offset] != 0
    }

    fn read_i32(buffer: &[u8], offset: usize) -> i32 {
        assert!(
            offset + 4 <= buffer.len(),
            "read_i32: offset {} + 4 exceeds buffer length {}",
            offset,
            buffer.len()
        );
        let bytes: [u8; 4] = buffer[offset..offset + 4].try_into().unwrap();
        i32::from_ne_bytes(bytes)
    }

    #[test]
    fn test_player_health_percent() {
        let mut player = Player::new(SpecId::BeastMastery);
        player.max_health = 1_000_000.0;
        player.health = 750_000.0;

        let config = SimConfig::default();
        let state = SimState::new(config, player);
        let now = SimTime::ZERO;

        let mut buffer = [0u8; 64];

        // Test health
        PlayerExpr::Health.populate(&mut buffer, 0, &state, now);
        assert!((read_f64(&buffer, 0) - 750_000.0).abs() < 0.001);

        // Test max health
        PlayerExpr::HealthMax.populate(&mut buffer, 0, &state, now);
        assert!((read_f64(&buffer, 0) - 1_000_000.0).abs() < 0.001);

        // Test health percent
        PlayerExpr::HealthPercent.populate(&mut buffer, 0, &state, now);
        assert!((read_f64(&buffer, 0) - 75.0).abs() < 0.001);

        // Test health deficit
        PlayerExpr::HealthDeficit.populate(&mut buffer, 0, &state, now);
        assert!((read_f64(&buffer, 0) - 250_000.0).abs() < 0.001);
    }

    #[test]
    fn test_player_boolean_states() {
        let mut player = Player::new(SpecId::BeastMastery);
        player.alive = true;
        player.in_combat = true;
        player.stealthed = false;
        player.mounted = false;
        player.is_moving = true;

        let config = SimConfig::default();
        let state = SimState::new(config, player);
        let now = SimTime::ZERO;

        let mut buffer = [0u8; 64];

        PlayerExpr::Alive.populate(&mut buffer, 0, &state, now);
        assert!(read_bool(&buffer, 0));

        PlayerExpr::InCombat.populate(&mut buffer, 0, &state, now);
        assert!(read_bool(&buffer, 0));

        PlayerExpr::Stealthed.populate(&mut buffer, 0, &state, now);
        assert!(!read_bool(&buffer, 0));

        PlayerExpr::Mounted.populate(&mut buffer, 0, &state, now);
        assert!(!read_bool(&buffer, 0));

        PlayerExpr::Moving.populate(&mut buffer, 0, &state, now);
        assert!(read_bool(&buffer, 0));
    }

    #[test]
    fn test_player_level() {
        let player = Player::new(SpecId::BeastMastery);

        let config = SimConfig::default();
        let state = SimState::new(config, player);
        let now = SimTime::ZERO;

        let mut buffer = [0u8; 64];

        PlayerExpr::Level.populate(&mut buffer, 0, &state, now);
        assert_eq!(read_i32(&buffer, 0), 80);
    }

    #[test]
    fn test_player_field_types() {
        assert_eq!(PlayerExpr::Health.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::HealthMax.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::HealthPercent.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::HealthDeficit.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Haste.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Crit.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Mastery.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Versatility.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::AttackPower.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::SpellPower.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Level.field_type(), FieldType::Int);
        assert_eq!(PlayerExpr::Armor.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Stamina.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::PrimaryStat.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Moving.field_type(), FieldType::Bool);
        assert_eq!(PlayerExpr::MovementRemaining.field_type(), FieldType::Float);
        assert_eq!(PlayerExpr::Alive.field_type(), FieldType::Bool);
        assert_eq!(PlayerExpr::InCombat.field_type(), FieldType::Bool);
        assert_eq!(PlayerExpr::Stealthed.field_type(), FieldType::Bool);
        assert_eq!(PlayerExpr::Mounted.field_type(), FieldType::Bool);
    }
}

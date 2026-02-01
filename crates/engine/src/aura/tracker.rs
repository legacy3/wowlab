use super::AuraInstance;
use slotmap::{new_key_type, SlotMap};
use wowlab_common::types::{AuraIdx, SimTime, TargetIdx};

new_key_type! {
    /// Generational key for aura entity storage, detects stale references
    pub struct AuraKey;
}

/// Per-target aura tracking with generational keys for safe reference handling
#[derive(Clone, Debug, Default)]
pub struct TargetAuras {
    auras: SlotMap<AuraKey, AuraInstance>,
}

impl TargetAuras {
    pub fn new() -> Self {
        Self {
            auras: SlotMap::with_key(),
        }
    }

    /// Get aura by generational key
    pub fn get_by_key(&self, key: AuraKey) -> Option<&AuraInstance> {
        self.auras.get(key)
    }

    /// Get mutable aura by generational key
    pub fn get_by_key_mut(&mut self, key: AuraKey) -> Option<&mut AuraInstance> {
        self.auras.get_mut(key)
    }

    /// Get aura by AuraIdx (searches all auras)
    pub fn get(&self, aura_id: AuraIdx) -> Option<&AuraInstance> {
        self.auras.values().find(|a| a.aura_id == aura_id)
    }

    /// Get mutable aura by AuraIdx (searches all auras)
    pub fn get_mut(&mut self, aura_id: AuraIdx) -> Option<&mut AuraInstance> {
        self.auras.values_mut().find(|a| a.aura_id == aura_id)
    }

    /// Check if aura is active
    pub fn has(&self, aura_id: AuraIdx, now: SimTime) -> bool {
        self.auras
            .values()
            .any(|a| a.aura_id == aura_id && a.is_active(now))
    }

    /// Get stack count (0 if not present)
    pub fn stacks(&self, aura_id: AuraIdx, now: SimTime) -> u8 {
        self.auras
            .values()
            .find(|a| a.aura_id == aura_id && a.is_active(now))
            .map(|a| a.stacks)
            .unwrap_or(0)
    }

    /// Apply or refresh aura, returns the AuraKey for the aura
    pub fn apply(&mut self, aura: AuraInstance, now: SimTime) -> AuraKey {
        // Find existing aura by AuraIdx
        let existing_key = self
            .auras
            .iter()
            .find(|(_, a)| a.aura_id == aura.aura_id)
            .map(|(k, _)| k);

        if let Some(key) = existing_key {
            if let Some(existing) = self.auras.get_mut(key) {
                if existing.flags.refreshable {
                    existing.refresh(now);
                    existing.add_stack();
                }
            }
            key
        } else {
            self.auras.insert(aura)
        }
    }

    /// Remove aura by AuraIdx
    pub fn remove(&mut self, aura_id: AuraIdx) -> Option<AuraInstance> {
        let key = self
            .auras
            .iter()
            .find(|(_, a)| a.aura_id == aura_id)
            .map(|(k, _)| k);
        key.and_then(|k| self.auras.remove(k))
    }

    /// Remove aura by generational key
    pub fn remove_by_key(&mut self, key: AuraKey) -> Option<AuraInstance> {
        self.auras.remove(key)
    }

    /// Remove expired auras
    pub fn cleanup(&mut self, now: SimTime) {
        self.auras.retain(|_, a| a.is_active(now));
    }

    /// Iterate all auras
    pub fn iter(&self) -> impl Iterator<Item = &AuraInstance> {
        self.auras.values()
    }

    /// Iterate all auras mutably
    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut AuraInstance> {
        self.auras.values_mut()
    }

    /// Iterate all auras with their keys
    pub fn iter_with_keys(&self) -> impl Iterator<Item = (AuraKey, &AuraInstance)> {
        self.auras.iter()
    }

    /// Iterate all auras mutably with their keys
    pub fn iter_with_keys_mut(&mut self) -> impl Iterator<Item = (AuraKey, &mut AuraInstance)> {
        self.auras.iter_mut()
    }

    /// Count of active debuffs
    pub fn debuff_count(&self, now: SimTime) -> usize {
        self.auras
            .values()
            .filter(|a| a.flags.is_debuff && a.is_active(now))
            .count()
    }

    /// Count of active buffs
    pub fn buff_count(&self, now: SimTime) -> usize {
        self.auras
            .values()
            .filter(|a| !a.flags.is_debuff && a.is_active(now))
            .count()
    }
}

/// Tracks auras across all targets
#[derive(Clone, Debug, Default)]
pub struct AuraTracker {
    /// Player's own buffs
    pub player: TargetAuras,
    /// Per-target debuffs (indexed by TargetIdx)
    targets: Vec<TargetAuras>,
}

impl AuraTracker {
    pub fn new() -> Self {
        Self {
            player: TargetAuras::new(),
            targets: Vec::new(),
        }
    }

    pub fn with_targets(mut self, count: usize) -> Self {
        self.targets = (0..count).map(|_| TargetAuras::new()).collect();
        self
    }

    /// Reset for new simulation
    pub fn reset(&mut self) {
        self.player = TargetAuras::new();
        for target in &mut self.targets {
            *target = TargetAuras::new();
        }
    }

    /// Get target's auras
    pub fn target(&self, target: TargetIdx) -> Option<&TargetAuras> {
        self.targets.get(target.0 as usize)
    }

    /// Get target's auras mutably
    pub fn target_mut(&mut self, target: TargetIdx) -> Option<&mut TargetAuras> {
        self.targets.get_mut(target.0 as usize)
    }

    /// Check if aura is on any target
    pub fn on_any_target(&self, aura_id: AuraIdx, now: SimTime) -> bool {
        self.targets.iter().any(|t| t.has(aura_id, now))
    }

    /// Count targets with specific aura
    pub fn targets_with_aura(&self, aura_id: AuraIdx, now: SimTime) -> usize {
        self.targets.iter().filter(|t| t.has(aura_id, now)).count()
    }

    /// Get all periodic auras that need ticking
    pub fn get_pending_ticks(&self, now: SimTime) -> Vec<(TargetIdx, AuraIdx)> {
        let mut pending = Vec::new();

        // Player buffs
        for aura in self.player.iter() {
            if let Some(next) = aura.next_tick {
                if next <= now && aura.is_active(now) {
                    pending.push((TargetIdx(0), aura.aura_id));
                }
            }
        }

        // Target debuffs
        for (i, target) in self.targets.iter().enumerate() {
            for aura in target.iter() {
                if let Some(next) = aura.next_tick {
                    if next <= now && aura.is_active(now) {
                        pending.push((TargetIdx(i as u16), aura.aura_id));
                    }
                }
            }
        }

        pending
    }

    /// Clean up all expired auras
    pub fn cleanup_all(&mut self, now: SimTime) {
        self.player.cleanup(now);
        for target in &mut self.targets {
            target.cleanup(now);
        }
    }
}

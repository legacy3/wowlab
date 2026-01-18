use super::AuraInstance;
use wowlab_types::{AuraIdx, SimTime, TargetIdx};
use smallvec::SmallVec;

/// Per-target aura tracking (stack-allocated for typical aura counts)
#[derive(Clone, Debug, Default)]
pub struct TargetAuras {
    auras: SmallVec<[AuraInstance; 16]>,
}

impl TargetAuras {
    pub fn new() -> Self {
        Self {
            auras: SmallVec::new(),
        }
    }

    /// Get aura by ID
    pub fn get(&self, aura_id: AuraIdx) -> Option<&AuraInstance> {
        self.auras.iter().find(|a| a.aura_id == aura_id)
    }

    /// Get mutable aura by ID
    pub fn get_mut(&mut self, aura_id: AuraIdx) -> Option<&mut AuraInstance> {
        self.auras.iter_mut().find(|a| a.aura_id == aura_id)
    }

    /// Check if aura is active
    pub fn has(&self, aura_id: AuraIdx, now: SimTime) -> bool {
        self.auras
            .iter()
            .any(|a| a.aura_id == aura_id && a.is_active(now))
    }

    /// Get stack count (0 if not present)
    pub fn stacks(&self, aura_id: AuraIdx, now: SimTime) -> u8 {
        self.auras
            .iter()
            .find(|a| a.aura_id == aura_id && a.is_active(now))
            .map(|a| a.stacks)
            .unwrap_or(0)
    }

    /// Apply or refresh aura
    pub fn apply(&mut self, aura: AuraInstance, now: SimTime) {
        if let Some(existing) = self.get_mut(aura.aura_id) {
            if existing.flags.refreshable {
                existing.refresh(now);
                existing.add_stack();
            }
            // If not refreshable, do nothing (or replace based on game rules)
        } else {
            self.auras.push(aura);
        }
    }

    /// Remove aura by ID
    pub fn remove(&mut self, aura_id: AuraIdx) -> Option<AuraInstance> {
        if let Some(pos) = self.auras.iter().position(|a| a.aura_id == aura_id) {
            Some(self.auras.swap_remove(pos))
        } else {
            None
        }
    }

    /// Remove expired auras
    pub fn cleanup(&mut self, now: SimTime) {
        self.auras.retain(|a| a.is_active(now));
    }

    /// Iterate all active auras
    pub fn iter(&self) -> impl Iterator<Item = &AuraInstance> {
        self.auras.iter()
    }

    /// Iterate active auras mutably
    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut AuraInstance> {
        self.auras.iter_mut()
    }

    /// Count of active debuffs
    pub fn debuff_count(&self, now: SimTime) -> usize {
        self.auras
            .iter()
            .filter(|a| a.flags.is_debuff && a.is_active(now))
            .count()
    }

    /// Count of active buffs
    pub fn buff_count(&self, now: SimTime) -> usize {
        self.auras
            .iter()
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

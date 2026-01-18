use super::StatsCollector;
use crate::types::SpellIdx;
use std::collections::HashMap;

/// Damage breakdown entry
#[derive(Clone, Debug)]
pub struct BreakdownEntry {
    pub spell: SpellIdx,
    pub name: String,
    pub damage: f64,
    pub dps: f64,
    pub percent: f32,
    pub count: u32,
    pub average: f32,
    pub crit_rate: f32,
}

/// Complete damage breakdown
#[derive(Clone, Debug)]
pub struct DamageBreakdown {
    pub entries: Vec<BreakdownEntry>,
    pub total_damage: f64,
    pub total_dps: f64,
    pub duration_secs: f32,
}

impl DamageBreakdown {
    /// Build breakdown from collector
    pub fn from_collector(
        collector: &StatsCollector,
        spell_names: &HashMap<SpellIdx, String>,
    ) -> Self {
        let duration = collector.duration().as_secs_f32();
        let total = collector.total_damage;

        let mut entries: Vec<_> = collector
            .spells()
            .map(|stats| {
                let name = spell_names
                    .get(&stats.spell)
                    .cloned()
                    .unwrap_or_else(|| format!("Spell_{}", stats.spell.0));

                let damage = stats.total();
                let dps = if duration > 0.0 {
                    damage / duration as f64
                } else {
                    0.0
                };
                let percent = if total > 0.0 {
                    (damage / total * 100.0) as f32
                } else {
                    0.0
                };

                BreakdownEntry {
                    spell: stats.spell,
                    name,
                    damage,
                    dps,
                    percent,
                    count: stats.count + stats.tick_count,
                    average: ((stats.total_damage + stats.tick_damage)
                        / (stats.count + stats.tick_count).max(1) as f64)
                        as f32,
                    crit_rate: stats.crit_rate(),
                }
            })
            .collect();

        // Sort by damage descending
        entries.sort_by(|a, b| b.damage.partial_cmp(&a.damage).unwrap());

        Self {
            entries,
            total_damage: total,
            total_dps: if duration > 0.0 {
                total / duration as f64
            } else {
                0.0
            },
            duration_secs: duration,
        }
    }

    /// Format as table
    pub fn to_table(&self) -> String {
        let mut output = String::new();

        output.push_str(&format!(
            "\n{:30} {:>12} {:>10} {:>8} {:>8} {:>8}\n",
            "Ability", "Damage", "DPS", "%", "Count", "Avg"
        ));
        output.push_str(&"-".repeat(80));
        output.push('\n');

        for entry in &self.entries {
            output.push_str(&format!(
                "{:30} {:>12.0} {:>10.1} {:>7.1}% {:>8} {:>8.0}\n",
                entry.name, entry.damage, entry.dps, entry.percent, entry.count, entry.average,
            ));
        }

        output.push_str(&"-".repeat(80));
        output.push_str(&format!(
            "\n{:30} {:>12.0} {:>10.1}\n",
            "Total", self.total_damage, self.total_dps,
        ));

        output
    }
}

/// Proc statistics
#[derive(Clone, Debug, Default)]
pub struct ProcBreakdown {
    pub entries: Vec<ProcEntry>,
}

#[derive(Clone, Debug)]
pub struct ProcEntry {
    pub name: String,
    pub procs: u32,
    pub ppm: f32,
    pub uptime: f32,
}

/// Cooldown usage statistics
#[derive(Clone, Debug, Default)]
pub struct CooldownBreakdown {
    pub entries: Vec<CooldownEntry>,
}

#[derive(Clone, Debug)]
pub struct CooldownEntry {
    pub spell: SpellIdx,
    pub name: String,
    pub uses: u32,
    pub possible_uses: u32,
    pub efficiency: f32,
}

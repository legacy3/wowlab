//! Rhai scripting baseline implementation

use rhai::{Engine, AST, Scope, Dynamic, OptimizationLevel};
use crate::{Action, SpellId, GameState};

/// Rhai-based rotation evaluator
pub struct RhaiRotation {
    engine: Engine,
    ast: AST,
}

impl RhaiRotation {
    pub fn new() -> Self {
        let mut engine = Engine::new();
        engine.set_optimization_level(OptimizationLevel::Full);

        // Register cast function
        engine.register_fn("cast", |spell: &str| -> Dynamic {
            let spell_id = match spell {
                "bestial_wrath" => SpellId::BESTIAL_WRATH,
                "kill_command" => SpellId::KILL_COMMAND,
                "barbed_shot" => SpellId::BARBED_SHOT,
                "cobra_shot" => SpellId::COBRA_SHOT,
                "kill_shot" => SpellId::KILL_SHOT,
                "dire_beast" => SpellId::DIRE_BEAST,
                "call_of_the_wild" => SpellId::CALL_OF_THE_WILD,
                _ => SpellId(0),
            };
            Dynamic::from(spell_id.0 as i64)
        });

        engine.register_fn("wait_gcd", || -> Dynamic {
            Dynamic::from(-1_i64) // sentinel for wait_gcd
        });

        // Compile the rotation script
        let script = r#"
            // BM Hunter rotation
            if bestial_wrath_ready {
                cast("bestial_wrath")
            } else if kill_command_ready && focus >= 30.0 {
                cast("kill_command")
            } else if barbed_shot_charges >= 1 && (frenzy_remaining <= 2.0 || !frenzy_active) {
                cast("barbed_shot")
            } else if barbed_shot_charges >= 2 {
                cast("barbed_shot")
            } else if kill_command_ready && focus >= 30.0 {
                cast("kill_command")
            } else if dire_beast_ready {
                cast("dire_beast")
            } else if focus >= 50.0 {
                cast("cobra_shot")
            } else {
                wait_gcd()
            }
        "#;

        let ast = engine.compile(script).expect("Failed to compile script");

        Self { engine, ast }
    }

    /// Evaluate the rotation (plain evaluation, no optimization)
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        let mut scope = Scope::new();
        self.populate_scope(&mut scope, state);

        match self.engine.eval_ast_with_scope::<Dynamic>(&mut scope, &self.ast) {
            Ok(result) => {
                if let Some(spell_id) = result.try_cast::<i64>() {
                    if spell_id == -1 {
                        Action::WaitGcd
                    } else {
                        Action::Cast(SpellId(spell_id as u16))
                    }
                } else {
                    Action::None
                }
            }
            Err(_) => Action::None,
        }
    }

    fn populate_scope(&self, scope: &mut Scope, state: &GameState) {
        // Resources
        scope.push("focus", state.focus as f64);
        scope.push("focus_max", state.focus_max as f64);

        // Target
        scope.push("target_health_pct", state.target_health_pct as f64);
        scope.push("execute_phase", state.execute_phase());

        // Cooldowns
        scope.push("bestial_wrath_ready", state.cooldown_ready(SpellId::BESTIAL_WRATH));
        scope.push("kill_command_ready", state.cooldown_ready(SpellId::KILL_COMMAND));
        scope.push("barbed_shot_ready", state.cooldown_ready(SpellId::BARBED_SHOT));
        scope.push("kill_shot_ready", state.cooldown_ready(SpellId::KILL_SHOT));
        scope.push("dire_beast_ready", state.cooldown_ready(SpellId::DIRE_BEAST));
        scope.push("call_of_the_wild_ready", state.cooldown_ready(SpellId::CALL_OF_THE_WILD));

        // Charges
        scope.push("barbed_shot_charges", state.charge_count(SpellId::BARBED_SHOT) as i64);

        // Auras
        scope.push("bestial_wrath_active", state.aura_active(AuraId::BESTIAL_WRATH));
        scope.push("frenzy_active", state.aura_active(AuraId::FRENZY));
        scope.push("frenzy_remaining", state.aura_remaining(AuraId::FRENZY) as f64);
        scope.push("frenzy_stacks", state.aura_stacks(AuraId::FRENZY) as i64);
    }
}

use crate::AuraId;

impl Default for RhaiRotation {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rhai_rotation() {
        let rotation = RhaiRotation::new();
        let state = GameState::new();
        let action = rotation.evaluate(&state);
        // With default state (all cooldowns ready), should cast bestial wrath
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }
}

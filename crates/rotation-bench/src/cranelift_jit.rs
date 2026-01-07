//! Cranelift JIT compilation for rotation evaluation
//!
//! Compiles rotation logic directly to native machine code at runtime.
//! Achieves near-inline-native performance with runtime flexibility.

use cranelift::prelude::*;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{Linkage, Module};
use std::mem;

use crate::{Action, SpellId, GameState};

/// Offset of fields in GameState struct
mod offsets {
    pub const FOCUS: i32 = 0;
    pub const TARGET_HEALTH_PCT: i32 = 8;
    pub const COOLDOWNS: i32 = 16;      // [f32; 8]
    pub const CHARGES: i32 = 48;        // [u8; 8]
    pub const AURA_REMAINING: i32 = 64; // [f32; 8]
}

/// Simple condition types for the JIT
#[derive(Clone, Debug)]
pub enum JitCondition {
    CooldownReady(u8),
    ChargesGe(u8, u8),
    FocusGe(f32),
    AuraActive(u8),
    AuraRemainingLe(u8, f32),
    TargetHealthLt(f32),
    And(Box<JitCondition>, Box<JitCondition>),
    Or(Box<JitCondition>, Box<JitCondition>),
    Not(Box<JitCondition>),
    True,
}

/// A rotation entry for JIT compilation
#[derive(Clone, Debug)]
pub struct JitEntry {
    pub condition: JitCondition,
    pub spell_id: u8,
}

/// JIT-compiled rotation
pub struct JitRotation {
    func: fn(*const GameState) -> u8,
    _module: JITModule,
}

unsafe impl Send for JitRotation {}
unsafe impl Sync for JitRotation {}

impl JitRotation {
    /// Compile a rotation to native code
    pub fn compile(entries: &[JitEntry], fallback: u8) -> Result<Self, String> {
        let mut flag_builder = settings::builder();
        flag_builder.set("opt_level", "speed").unwrap();
        flag_builder.set("is_pic", "false").unwrap();

        let isa_builder = cranelift_native::builder()
            .map_err(|e| format!("Failed to create ISA builder: {}", e))?;
        let isa = isa_builder
            .finish(settings::Flags::new(flag_builder))
            .map_err(|e| format!("Failed to create ISA: {}", e))?;

        let builder = JITBuilder::with_isa(isa, cranelift_module::default_libcall_names());
        let mut module = JITModule::new(builder);

        let ptr_type = module.target_config().pointer_type();

        // Function signature: fn(*const GameState) -> u8
        let mut sig = module.make_signature();
        sig.params.push(AbiParam::new(ptr_type));
        sig.returns.push(AbiParam::new(types::I8));

        let func_id = module
            .declare_function("rotation", Linkage::Local, &sig)
            .map_err(|e| format!("Failed to declare function: {}", e))?;

        let mut ctx = module.make_context();
        ctx.func.signature = sig;

        let mut func_ctx = FunctionBuilderContext::new();
        {
            let mut builder = FunctionBuilder::new(&mut ctx.func, &mut func_ctx);

            // Build a simple linear if-else chain
            // entry -> check0 -> (then0 | check1 -> (then1 | check2 -> ... | fallback))

            let entry_block = builder.create_block();
            builder.append_block_params_for_function_params(entry_block);

            // Create all blocks upfront
            let mut check_blocks: Vec<Block> = Vec::new();
            let mut then_blocks: Vec<Block> = Vec::new();

            for _ in entries {
                check_blocks.push(builder.create_block());
                then_blocks.push(builder.create_block());
            }
            let fallback_block = builder.create_block();

            // Entry block jumps to first check (or fallback if no entries)
            builder.switch_to_block(entry_block);
            let state_ptr = builder.block_params(entry_block)[0];

            if entries.is_empty() {
                builder.ins().jump(fallback_block, &[]);
            } else {
                builder.ins().jump(check_blocks[0], &[]);
            }
            builder.seal_block(entry_block);

            // Generate check and then blocks
            for (i, entry) in entries.iter().enumerate() {
                let check_block = check_blocks[i];
                let then_block = then_blocks[i];
                let else_block = if i + 1 < entries.len() {
                    check_blocks[i + 1]
                } else {
                    fallback_block
                };

                // Check block: evaluate condition, branch
                builder.switch_to_block(check_block);
                let cond_val = Self::compile_condition(&mut builder, state_ptr, &entry.condition);
                builder.ins().brif(cond_val, then_block, &[], else_block, &[]);
                builder.seal_block(check_block);

                // Then block: return spell_id
                builder.switch_to_block(then_block);
                let spell_val = builder.ins().iconst(types::I8, entry.spell_id as i64);
                builder.ins().return_(&[spell_val]);
                builder.seal_block(then_block);
            }

            // Fallback block: return fallback value
            builder.switch_to_block(fallback_block);
            let fallback_val = builder.ins().iconst(types::I8, fallback as i64);
            builder.ins().return_(&[fallback_val]);
            builder.seal_block(fallback_block);

            builder.finalize();
        }

        module
            .define_function(func_id, &mut ctx)
            .map_err(|e| format!("Failed to define function: {}", e))?;

        module.clear_context(&mut ctx);
        module.finalize_definitions().unwrap();

        let code_ptr = module.get_finalized_function(func_id);
        let func: fn(*const GameState) -> u8 = unsafe { mem::transmute(code_ptr) };

        Ok(Self {
            func,
            _module: module,
        })
    }

    fn compile_condition(
        builder: &mut FunctionBuilder,
        state_ptr: Value,
        cond: &JitCondition,
    ) -> Value {
        match cond {
            JitCondition::True => builder.ins().iconst(types::I8, 1),

            JitCondition::CooldownReady(spell_idx) => {
                let offset = offsets::COOLDOWNS + (*spell_idx as i32) * 4;
                let cd = builder.ins().load(types::F32, MemFlags::new(), state_ptr, offset);
                let zero = builder.ins().f32const(0.0);
                builder.ins().fcmp(FloatCC::LessThanOrEqual, cd, zero)
            }

            JitCondition::ChargesGe(spell_idx, min) => {
                let offset = offsets::CHARGES + (*spell_idx as i32);
                let charges = builder.ins().load(types::I8, MemFlags::new(), state_ptr, offset);
                let threshold = builder.ins().iconst(types::I8, *min as i64);
                builder.ins().icmp(IntCC::UnsignedGreaterThanOrEqual, charges, threshold)
            }

            JitCondition::FocusGe(threshold) => {
                let focus = builder.ins().load(types::F32, MemFlags::new(), state_ptr, offsets::FOCUS);
                let thresh = builder.ins().f32const(*threshold);
                builder.ins().fcmp(FloatCC::GreaterThanOrEqual, focus, thresh)
            }

            JitCondition::AuraActive(aura_idx) => {
                let offset = offsets::AURA_REMAINING + (*aura_idx as i32) * 4;
                let remaining = builder.ins().load(types::F32, MemFlags::new(), state_ptr, offset);
                let zero = builder.ins().f32const(0.0);
                builder.ins().fcmp(FloatCC::GreaterThan, remaining, zero)
            }

            JitCondition::AuraRemainingLe(aura_idx, threshold) => {
                let offset = offsets::AURA_REMAINING + (*aura_idx as i32) * 4;
                let remaining = builder.ins().load(types::F32, MemFlags::new(), state_ptr, offset);
                let thresh = builder.ins().f32const(*threshold);
                builder.ins().fcmp(FloatCC::LessThanOrEqual, remaining, thresh)
            }

            JitCondition::TargetHealthLt(threshold) => {
                let health = builder.ins().load(types::F32, MemFlags::new(), state_ptr, offsets::TARGET_HEALTH_PCT);
                let thresh = builder.ins().f32const(*threshold);
                builder.ins().fcmp(FloatCC::LessThan, health, thresh)
            }

            JitCondition::And(a, b) => {
                let a_val = Self::compile_condition(builder, state_ptr, a);
                let b_val = Self::compile_condition(builder, state_ptr, b);
                builder.ins().band(a_val, b_val)
            }

            JitCondition::Or(a, b) => {
                let a_val = Self::compile_condition(builder, state_ptr, a);
                let b_val = Self::compile_condition(builder, state_ptr, b);
                builder.ins().bor(a_val, b_val)
            }

            JitCondition::Not(c) => {
                let c_val = Self::compile_condition(builder, state_ptr, c);
                let one = builder.ins().iconst(types::I8, 1);
                builder.ins().bxor(c_val, one)
            }
        }
    }

    /// Create BM Hunter rotation
    pub fn bm_hunter() -> Result<Self, String> {
        use JitCondition::*;

        const BESTIAL_WRATH: u8 = 1;
        const KILL_COMMAND: u8 = 2;
        const BARBED_SHOT: u8 = 3;
        const COBRA_SHOT: u8 = 4;
        const DIRE_BEAST: u8 = 6;
        const FRENZY_AURA: u8 = 2;

        let entries = vec![
            JitEntry {
                condition: CooldownReady(BESTIAL_WRATH),
                spell_id: BESTIAL_WRATH,
            },
            JitEntry {
                condition: And(
                    Box::new(CooldownReady(KILL_COMMAND)),
                    Box::new(FocusGe(30.0)),
                ),
                spell_id: KILL_COMMAND,
            },
            JitEntry {
                condition: And(
                    Box::new(ChargesGe(BARBED_SHOT, 1)),
                    Box::new(Or(
                        Box::new(AuraRemainingLe(FRENZY_AURA, 2.0)),
                        Box::new(Not(Box::new(AuraActive(FRENZY_AURA)))),
                    )),
                ),
                spell_id: BARBED_SHOT,
            },
            JitEntry {
                condition: ChargesGe(BARBED_SHOT, 2),
                spell_id: BARBED_SHOT,
            },
            JitEntry {
                condition: CooldownReady(DIRE_BEAST),
                spell_id: DIRE_BEAST,
            },
            JitEntry {
                condition: FocusGe(50.0),
                spell_id: COBRA_SHOT,
            },
        ];

        Self::compile(&entries, 0)
    }

    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        let result = (self.func)(state as *const GameState);
        if result == 0 {
            Action::WaitGcd
        } else {
            Action::Cast(SpellId(result as u16))
        }
    }

    #[inline]
    pub fn get_func(&self) -> fn(*const GameState) -> u8 {
        self.func
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jit_rotation() {
        let rotation = JitRotation::bm_hunter().expect("Failed to compile");
        let state = GameState::new();
        let action = rotation.evaluate(&state);
        assert!(matches!(action, Action::Cast(SpellId(1))));
    }

    #[test]
    fn test_jit_fallback() {
        let rotation = JitRotation::bm_hunter().expect("Failed to compile");
        let mut state = GameState::new();
        state.cooldowns = [15.0; 8];
        state.charges = [0; 8];
        state.focus = 20.0;

        let action = rotation.evaluate(&state);
        assert!(matches!(action, Action::WaitGcd));
    }
}

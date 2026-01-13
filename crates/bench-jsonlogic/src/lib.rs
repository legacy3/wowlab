//! Benchmark comparing JsonLogic evaluation vs native Rust.
//!
//! Tests three approaches:
//! 1. Native Rust conditionals (baseline)
//! 2. datalogic-rs v3 (arena-based)
//! 3. datalogic-rs v4 (serde_json based)

use serde::{Deserialize, Serialize};

/// Simulated game state (simplified version of SimState)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameState {
    pub resource: ResourceState,
    pub target: TargetState,
    pub cooldowns: CooldownState,
    pub buffs: BuffState,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResourceState {
    pub current: f64,
    pub max: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TargetState {
    pub health_pct: f64,
    pub distance: f64,
    pub count: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CooldownState {
    pub kill_command_ready: bool,
    pub bestial_wrath_ready: bool,
    pub barbed_shot_charges: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BuffState {
    pub bestial_wrath_active: bool,
    pub frenzy_stacks: u32,
}

impl GameState {
    pub fn sample() -> Self {
        Self {
            resource: ResourceState {
                current: 75.0,
                max: 100.0,
            },
            target: TargetState {
                health_pct: 0.45,
                distance: 30.0,
                count: 1,
            },
            cooldowns: CooldownState {
                kill_command_ready: true,
                bestial_wrath_ready: false,
                barbed_shot_charges: 2,
            },
            buffs: BuffState {
                bestial_wrath_active: true,
                frenzy_stacks: 3,
            },
        }
    }
}

/// Native Rust evaluation (baseline)
pub mod native {
    use super::GameState;

    /// Simple condition: resource >= 30
    #[inline]
    pub fn simple_condition(state: &GameState) -> bool {
        state.resource.current >= 30.0
    }

    /// Medium condition: resource >= 30 AND cooldown ready
    #[inline]
    pub fn medium_condition(state: &GameState) -> bool {
        state.resource.current >= 30.0 && state.cooldowns.kill_command_ready
    }

    /// Complex condition: (resource >= 30 AND cooldown ready) OR (buff active AND target < 20%)
    #[inline]
    pub fn complex_condition(state: &GameState) -> bool {
        (state.resource.current >= 30.0 && state.cooldowns.kill_command_ready)
            || (state.buffs.bestial_wrath_active && state.target.health_pct < 0.20)
    }

    /// Rotation-like: check multiple conditions in sequence
    #[inline]
    pub fn rotation_check(state: &GameState) -> u32 {
        // Simulate checking a priority list
        if state.cooldowns.bestial_wrath_ready && state.resource.current >= 10.0 {
            return 1; // Cast Bestial Wrath
        }
        if state.cooldowns.barbed_shot_charges > 0
            && (state.buffs.frenzy_stacks < 3 || state.buffs.bestial_wrath_active)
        {
            return 2; // Cast Barbed Shot
        }
        if state.cooldowns.kill_command_ready && state.resource.current >= 30.0 {
            return 3; // Cast Kill Command
        }
        if state.resource.current >= 35.0 {
            return 4; // Cast Cobra Shot
        }
        0 // Wait
    }
}

/// Rhai script evaluation
pub mod rhai_scripts {
    use rhai::{Engine, Scope, AST};

    /// Create a configured Rhai engine with GameState type registered
    pub fn create_engine() -> Engine {
        Engine::new()
    }

    /// Simple script: resource_current >= 30
    pub const SIMPLE: &str = "resource_current >= 30.0";

    /// Medium script: resource >= 30 AND cooldown ready
    pub const MEDIUM: &str = "resource_current >= 30.0 && kill_command_ready";

    /// Complex script: (resource >= 30 AND cooldown ready) OR (buff active AND target < 20%)
    pub const COMPLEX: &str = r#"
        (resource_current >= 30.0 && kill_command_ready) ||
        (bestial_wrath_active && target_health_pct < 0.20)
    "#;

    /// Rotation-like script
    pub const ROTATION: &str = r#"
        if bestial_wrath_ready && resource_current >= 10.0 {
            1
        } else if barbed_shot_charges > 0 && (frenzy_stacks < 3 || bestial_wrath_active) {
            2
        } else if kill_command_ready && resource_current >= 30.0 {
            3
        } else if resource_current >= 35.0 {
            4
        } else {
            0
        }
    "#;

    /// Compile a script to AST
    pub fn compile(engine: &Engine, script: &str) -> AST {
        engine.compile(script).unwrap()
    }

    /// Build a scope from GameState
    pub fn build_scope(state: &super::GameState) -> Scope<'static> {
        let mut scope = Scope::new();
        scope.push("resource_current", state.resource.current);
        scope.push("resource_max", state.resource.max);
        scope.push("target_health_pct", state.target.health_pct);
        scope.push("target_distance", state.target.distance);
        scope.push("target_count", state.target.count as i64);
        scope.push("kill_command_ready", state.cooldowns.kill_command_ready);
        scope.push("bestial_wrath_ready", state.cooldowns.bestial_wrath_ready);
        scope.push("barbed_shot_charges", state.cooldowns.barbed_shot_charges as i64);
        scope.push("bestial_wrath_active", state.buffs.bestial_wrath_active);
        scope.push("frenzy_stacks", state.buffs.frenzy_stacks as i64);
        scope
    }
}

/// Wasmtime WebAssembly evaluation
pub mod wasmtime_eval {
    use wasmtime::*;

    /// WAT (WebAssembly Text) for simple condition: resource >= 30
    pub const SIMPLE_WAT: &str = r#"
        (module
            (func $simple (export "simple") (param $resource f64) (result i32)
                (if (result i32)
                    (f64.ge (local.get $resource) (f64.const 30.0))
                    (then (i32.const 1))
                    (else (i32.const 0))
                )
            )
        )
    "#;

    /// WAT for rotation check
    pub const ROTATION_WAT: &str = r#"
        (module
            (func $rotation (export "rotation")
                (param $resource f64)
                (param $bestial_wrath_ready i32)
                (param $barbed_shot_charges i32)
                (param $frenzy_stacks i32)
                (param $bestial_wrath_active i32)
                (param $kill_command_ready i32)
                (result i32)

                ;; Check BW ready and resource >= 10
                (if (result i32)
                    (i32.and
                        (local.get $bestial_wrath_ready)
                        (f64.ge (local.get $resource) (f64.const 10.0))
                    )
                    (then (i32.const 1))
                    (else
                        ;; Check Barbed Shot
                        (if (result i32)
                            (i32.and
                                (i32.gt_s (local.get $barbed_shot_charges) (i32.const 0))
                                (i32.or
                                    (i32.lt_s (local.get $frenzy_stacks) (i32.const 3))
                                    (local.get $bestial_wrath_active)
                                )
                            )
                            (then (i32.const 2))
                            (else
                                ;; Check Kill Command
                                (if (result i32)
                                    (i32.and
                                        (local.get $kill_command_ready)
                                        (f64.ge (local.get $resource) (f64.const 30.0))
                                    )
                                    (then (i32.const 3))
                                    (else
                                        ;; Check Cobra Shot
                                        (if (result i32)
                                            (f64.ge (local.get $resource) (f64.const 35.0))
                                            (then (i32.const 4))
                                            (else (i32.const 0))
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    "#;

    /// Create a wasmtime Engine
    pub fn create_engine() -> Engine {
        Engine::default()
    }

    /// Compile WAT to a Module
    pub fn compile_wat(engine: &Engine, wat: &str) -> Module {
        Module::new(engine, wat).unwrap()
    }

    /// Create a Store
    pub fn create_store(engine: &Engine) -> Store<()> {
        Store::new(engine, ())
    }
}

/// Cranelift JIT compilation - compiles rotation AST directly to native code
pub mod cranelift_jit {
    use cranelift::prelude::*;
    use cranelift_jit::{JITBuilder, JITModule};
    use cranelift_module::{Module, Linkage};

    /// Simple rotation AST that can be parsed from JSON/YAML/etc
    #[derive(Debug, Clone)]
    pub enum RotationNode {
        /// If condition then A else B
        If {
            cond: Condition,
            then: Box<RotationNode>,
            else_: Box<RotationNode>,
        },
        /// Cast spell (return spell ID)
        Cast(i32),
        /// Wait (return 0)
        Wait,
    }

    #[derive(Debug, Clone)]
    pub enum Condition {
        And(Box<Condition>, Box<Condition>),
        Or(Box<Condition>, Box<Condition>),
        Gte(Operand, Operand),
        Lt(Operand, Operand),
        Gt(Operand, Operand),
        Var(VarRef), // bool variable
    }

    #[derive(Debug, Clone)]
    pub enum Operand {
        Var(VarRef),
        Const(f64),
        ConstInt(i32),
    }

    #[derive(Debug, Clone, Copy)]
    pub enum VarRef {
        ResourceCurrent,    // f64
        BestialWrathReady,  // bool
        KillCommandReady,   // bool
        BarbedShotCharges,  // i32
        BestialWrathActive, // bool
        FrenzyStacks,       // i32
    }

    /// Build the sample rotation AST (equivalent to native::rotation_check)
    pub fn sample_rotation() -> RotationNode {
        use Condition::{And, Gt, Gte, Lt, Or, Var as CondVar};
        use Operand::{Const, ConstInt, Var as OpVar};
        use RotationNode::*;
        use VarRef::*;

        // if bw_ready && resource >= 10 -> 1
        // else if barbed_charges > 0 && (frenzy < 3 || bw_active) -> 2
        // else if kc_ready && resource >= 30 -> 3
        // else if resource >= 35 -> 4
        // else -> 0

        If {
            cond: And(
                Box::new(CondVar(BestialWrathReady)),
                Box::new(Gte(OpVar(ResourceCurrent), Const(10.0))),
            ),
            then: Box::new(Cast(1)),
            else_: Box::new(If {
                cond: And(
                    Box::new(Gt(OpVar(BarbedShotCharges), ConstInt(0))),
                    Box::new(Or(
                        Box::new(Lt(OpVar(FrenzyStacks), ConstInt(3))),
                        Box::new(CondVar(BestialWrathActive)),
                    )),
                ),
                then: Box::new(Cast(2)),
                else_: Box::new(If {
                    cond: And(
                        Box::new(CondVar(KillCommandReady)),
                        Box::new(Gte(OpVar(ResourceCurrent), Const(30.0))),
                    ),
                    then: Box::new(Cast(3)),
                    else_: Box::new(If {
                        cond: Gte(OpVar(ResourceCurrent), Const(35.0)),
                        then: Box::new(Cast(4)),
                        else_: Box::new(Wait),
                    }),
                }),
            }),
        }
    }

    /// Parameter indices in the function signature
    struct ParamIdx {
        resource_current: usize,    // 0: f64
        bw_ready: usize,            // 1: i32 (bool)
        kc_ready: usize,            // 2: i32 (bool)
        barbed_charges: usize,      // 3: i32
        bw_active: usize,           // 4: i32 (bool)
        frenzy_stacks: usize,       // 5: i32
    }

    const PARAMS: ParamIdx = ParamIdx {
        resource_current: 0,
        bw_ready: 1,
        kc_ready: 2,
        barbed_charges: 3,
        bw_active: 4,
        frenzy_stacks: 5,
    };

    /// JIT-compiled rotation
    pub struct JitRotation {
        #[allow(dead_code)]
        module: JITModule,
        func_ptr: fn(f64, i32, i32, i32, i32, i32) -> i32,
    }

    impl JitRotation {
        pub fn compile(ast: &RotationNode) -> Self {
            let mut flag_builder = settings::builder();
            flag_builder.set("opt_level", "speed").unwrap();
            let flags = settings::Flags::new(flag_builder);

            let isa = cranelift_native::builder()
                .unwrap()
                .finish(flags)
                .unwrap();

            let builder = JITBuilder::with_isa(isa, cranelift_module::default_libcall_names());
            let mut module = JITModule::new(builder);

            let mut ctx = module.make_context();
            let ptr_ty = module.target_config().pointer_type();
            let _ = ptr_ty; // unused but good to have

            // Signature: fn(f64, i32, i32, i32, i32, i32) -> i32
            let mut sig = module.make_signature();
            sig.params.push(AbiParam::new(types::F64)); // resource_current
            sig.params.push(AbiParam::new(types::I32)); // bw_ready
            sig.params.push(AbiParam::new(types::I32)); // kc_ready
            sig.params.push(AbiParam::new(types::I32)); // barbed_charges
            sig.params.push(AbiParam::new(types::I32)); // bw_active
            sig.params.push(AbiParam::new(types::I32)); // frenzy_stacks
            sig.returns.push(AbiParam::new(types::I32)); // spell_id

            let func_id = module
                .declare_function("rotation", Linkage::Local, &sig)
                .unwrap();

            ctx.func.signature = sig;

            {
                let mut fn_builder_ctx = FunctionBuilderContext::new();
                let mut builder = FunctionBuilder::new(&mut ctx.func, &mut fn_builder_ctx);

                let entry_block = builder.create_block();
                builder.append_block_params_for_function_params(entry_block);
                builder.switch_to_block(entry_block);
                builder.seal_block(entry_block);

                let result = compile_node(&mut builder, ast, entry_block);
                builder.ins().return_(&[result]);

                builder.finalize();
            }

            module.define_function(func_id, &mut ctx).unwrap();
            module.clear_context(&mut ctx);
            module.finalize_definitions().unwrap();

            let func_ptr = module.get_finalized_function(func_id);
            let func_ptr: fn(f64, i32, i32, i32, i32, i32) -> i32 =
                unsafe { std::mem::transmute(func_ptr) };

            Self { module, func_ptr }
        }

        #[inline]
        pub fn call(&self, resource: f64, bw_ready: i32, kc_ready: i32,
                    barbed_charges: i32, bw_active: i32, frenzy_stacks: i32) -> i32 {
            (self.func_ptr)(resource, bw_ready, kc_ready, barbed_charges, bw_active, frenzy_stacks)
        }

        #[inline]
        pub fn evaluate(&self, state: &super::GameState) -> i32 {
            (self.func_ptr)(
                state.resource.current,
                state.cooldowns.bestial_wrath_ready as i32,
                state.cooldowns.kill_command_ready as i32,
                state.cooldowns.barbed_shot_charges as i32,
                state.buffs.bestial_wrath_active as i32,
                state.buffs.frenzy_stacks as i32,
            )
        }
    }

    fn compile_node(builder: &mut FunctionBuilder, node: &RotationNode, entry_block: Block) -> Value {
        match node {
            RotationNode::Cast(spell_id) => builder.ins().iconst(types::I32, *spell_id as i64),
            RotationNode::Wait => builder.ins().iconst(types::I32, 0),
            RotationNode::If { cond, then, else_ } => {
                let cond_val = compile_condition(builder, cond, entry_block);

                let then_block = builder.create_block();
                let else_block = builder.create_block();
                let merge_block = builder.create_block();
                builder.append_block_param(merge_block, types::I32);

                builder.ins().brif(cond_val, then_block, &[], else_block, &[]);

                builder.switch_to_block(then_block);
                builder.seal_block(then_block);
                let then_val = compile_node(builder, then, entry_block);
                builder.ins().jump(merge_block, &[then_val]);

                builder.switch_to_block(else_block);
                builder.seal_block(else_block);
                let else_val = compile_node(builder, else_, entry_block);
                builder.ins().jump(merge_block, &[else_val]);

                builder.switch_to_block(merge_block);
                builder.seal_block(merge_block);
                builder.block_params(merge_block)[0]
            }
        }
    }

    fn compile_condition(builder: &mut FunctionBuilder, cond: &Condition, entry_block: Block) -> Value {
        match cond {
            Condition::And(a, b) => {
                let a_val = compile_condition(builder, a, entry_block);
                let b_val = compile_condition(builder, b, entry_block);
                builder.ins().band(a_val, b_val)
            }
            Condition::Or(a, b) => {
                let a_val = compile_condition(builder, a, entry_block);
                let b_val = compile_condition(builder, b, entry_block);
                builder.ins().bor(a_val, b_val)
            }
            Condition::Gte(a, b) => {
                let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, entry_block);
                if is_float {
                    builder.ins().fcmp(FloatCC::GreaterThanOrEqual, a_val, b_val)
                } else {
                    builder.ins().icmp(IntCC::SignedGreaterThanOrEqual, a_val, b_val)
                }
            }
            Condition::Gt(a, b) => {
                let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, entry_block);
                if is_float {
                    builder.ins().fcmp(FloatCC::GreaterThan, a_val, b_val)
                } else {
                    builder.ins().icmp(IntCC::SignedGreaterThan, a_val, b_val)
                }
            }
            Condition::Lt(a, b) => {
                let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, entry_block);
                if is_float {
                    builder.ins().fcmp(FloatCC::LessThan, a_val, b_val)
                } else {
                    builder.ins().icmp(IntCC::SignedLessThan, a_val, b_val)
                }
            }
            Condition::Var(var_ref) => {
                // Bool variable - just load it (already 0 or 1)
                let params = builder.block_params(entry_block);
                let val = match var_ref {
                    VarRef::BestialWrathReady => params[PARAMS.bw_ready],
                    VarRef::KillCommandReady => params[PARAMS.kc_ready],
                    VarRef::BestialWrathActive => params[PARAMS.bw_active],
                    _ => panic!("Non-bool var used as condition"),
                };
                // Convert to bool (non-zero = true)
                builder.ins().icmp_imm(IntCC::NotEqual, val, 0)
            }
        }
    }

    fn compile_operand_pair(
        builder: &mut FunctionBuilder,
        a: &Operand,
        b: &Operand,
        entry_block: Block,
    ) -> (Value, Value, bool) {
        // Copy param values to avoid borrow issues
        let params: Vec<Value> = builder.block_params(entry_block).to_vec();

        let (a_val, a_float) = compile_operand(builder, a, &params);
        let (b_val, b_float) = compile_operand(builder, b, &params);

        // If either is float, both should be float
        let is_float = a_float || b_float;

        let a_val = if is_float && !a_float {
            builder.ins().fcvt_from_sint(types::F64, a_val)
        } else {
            a_val
        };

        let b_val = if is_float && !b_float {
            builder.ins().fcvt_from_sint(types::F64, b_val)
        } else {
            b_val
        };

        (a_val, b_val, is_float)
    }

    fn compile_operand(builder: &mut FunctionBuilder, op: &Operand, params: &[Value]) -> (Value, bool) {
        match op {
            Operand::Const(f) => (builder.ins().f64const(*f), true),
            Operand::ConstInt(i) => (builder.ins().iconst(types::I32, *i as i64), false),
            Operand::Var(var_ref) => match var_ref {
                VarRef::ResourceCurrent => (params[PARAMS.resource_current], true),
                VarRef::BestialWrathReady => (params[PARAMS.bw_ready], false),
                VarRef::KillCommandReady => (params[PARAMS.kc_ready], false),
                VarRef::BarbedShotCharges => (params[PARAMS.barbed_charges], false),
                VarRef::BestialWrathActive => (params[PARAMS.bw_active], false),
                VarRef::FrenzyStacks => (params[PARAMS.frenzy_stacks], false),
            },
        }
    }
}

/// JsonLogic expressions for benchmarking
pub mod jsonlogic_exprs {
    use serde_json::{json, Value};

    /// Simple: {">=": [{"var": "resource.current"}, 30]}
    pub fn simple() -> Value {
        json!({
            ">=": [{"var": "resource.current"}, 30]
        })
    }

    /// Medium: {"and": [{">=": [{"var": "resource.current"}, 30]}, {"var": "cooldowns.kill_command_ready"}]}
    pub fn medium() -> Value {
        json!({
            "and": [
                {">=": [{"var": "resource.current"}, 30]},
                {"var": "cooldowns.kill_command_ready"}
            ]
        })
    }

    /// Complex: {"or": [{"and": [...]}, {"and": [...]}]}
    pub fn complex() -> Value {
        json!({
            "or": [
                {
                    "and": [
                        {">=": [{"var": "resource.current"}, 30]},
                        {"var": "cooldowns.kill_command_ready"}
                    ]
                },
                {
                    "and": [
                        {"var": "buffs.bestial_wrath_active"},
                        {"<": [{"var": "target.health_pct"}, 0.20]}
                    ]
                }
            ]
        })
    }

    /// Rotation-like: nested if-else
    pub fn rotation() -> Value {
        json!({
            "if": [
                // Condition 1: BW ready and resource >= 10
                {"and": [
                    {"var": "cooldowns.bestial_wrath_ready"},
                    {">=": [{"var": "resource.current"}, 10]}
                ]},
                1,
                // Condition 2: Barbed Shot charges and (frenzy < 3 or BW active)
                {"and": [
                    {">": [{"var": "cooldowns.barbed_shot_charges"}, 0]},
                    {"or": [
                        {"<": [{"var": "buffs.frenzy_stacks"}, 3]},
                        {"var": "buffs.bestial_wrath_active"}
                    ]}
                ]},
                2,
                // Condition 3: KC ready and resource >= 30
                {"and": [
                    {"var": "cooldowns.kill_command_ready"},
                    {">=": [{"var": "resource.current"}, 30]}
                ]},
                3,
                // Condition 4: Cobra Shot
                {">=": [{"var": "resource.current"}, 35]},
                4,
                // Default: wait
                0
            ]
        })
    }
}

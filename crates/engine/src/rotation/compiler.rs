//! Cranelift JIT compiler for rotations.
//!
//! Compiles rotation AST to native code via Cranelift.

use std::cell::RefCell;
use std::collections::HashMap;

use cranelift::codegen::ir::BlockArg;
use cranelift::prelude::*;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{Linkage, Module};

use crate::sim::SimState;
use wowlab_common::types::SpellIdx;

use super::ast::{Action as AstAction, Expr, Rotation, ValueType, VarOp};
use super::context::{populate_context, ContextSchema, ExprKey, SchemaBuilder};
use super::error::{Error, Result};
use super::expr::{FieldType, TalentExpr};
use super::resolver::SpecResolver;

// Maximum size for stack-allocated context buffer.
// Rotations with larger schemas will fall back to thread-local allocation.
const MAX_STACK_BUFFER_SIZE: usize = 512;

// Thread-local buffer for rotation context evaluation (fallback for large schemas).
thread_local! {
    static EVAL_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::with_capacity(1024));
}

/// Convert ValueType to FieldType.
fn value_type_to_field_type(vt: ValueType) -> FieldType {
    match vt {
        ValueType::Bool => FieldType::Bool,
        ValueType::Int => FieldType::Int,
        ValueType::Float => FieldType::Float,
    }
}

/// Rotation evaluation result.
#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub struct EvalResult {
    /// Action kind: 0=none, 1=cast, 2=wait, 3=pool
    pub kind: u8,
    /// Spell ID (for cast) or 0
    pub spell_id: u32,
    /// Wait duration in seconds (for wait) or pool target (for pool)
    pub wait_time: f32,
}

impl EvalResult {
    pub const NONE: Self = Self {
        kind: 0,
        spell_id: 0,
        wait_time: 0.0,
    };

    pub fn cast(spell: SpellIdx) -> Self {
        Self {
            kind: 1,
            spell_id: spell.0,
            wait_time: 0.0,
        }
    }

    pub fn wait(seconds: f32) -> Self {
        Self {
            kind: 2,
            spell_id: 0,
            wait_time: seconds,
        }
    }

    /// Create a pool result with the target resource amount.
    pub fn pool(target: f32) -> Self {
        Self {
            kind: 3,
            spell_id: 0,
            wait_time: target, // Reuse wait_time field for pool target
        }
    }

    pub fn is_none(&self) -> bool {
        self.kind == 0
    }

    pub fn is_cast(&self) -> bool {
        self.kind == 1
    }

    pub fn is_wait(&self) -> bool {
        self.kind == 2
    }

    /// Returns true if this is a pool result.
    pub fn is_pool(&self) -> bool {
        self.kind == 3
    }

    /// Returns the pool target if this is a pool result.
    pub fn pool_target(&self) -> Option<f32> {
        if self.is_pool() {
            Some(self.wait_time)
        } else {
            None
        }
    }
}

/// Function signature: fn(*const u8) -> u64 (packed EvalResult)
type RotationFn = unsafe extern "C" fn(*const u8) -> u64;

/// A Send+Sync wrapper for the function pointer.
#[derive(Clone, Copy)]
struct SyncFnPtr(RotationFn);

unsafe impl Send for SyncFnPtr {}
unsafe impl Sync for SyncFnPtr {}

/// Wrapper to make JITModule Send+Sync.
/// Safe because we never mutate the module after compilation - it's just keeping memory alive.
struct SyncJitModule(#[allow(dead_code)] JITModule);
unsafe impl Send for SyncJitModule {}
unsafe impl Sync for SyncJitModule {}

/// A compiled rotation ready for execution.
pub struct CompiledRotation {
    func_ptr: SyncFnPtr,
    _module: SyncJitModule, // Owns JIT memory, dropped when rotation is dropped
    schema: ContextSchema,
}

impl CompiledRotation {
    /// Compile a rotation from JSON string with a spec resolver.
    ///
    /// This is the preferred entry point as it parses and resolves in one step.
    pub fn compile_json(json: &str, resolver: &SpecResolver) -> Result<Self> {
        let resolved = Rotation::from_json_resolved(json, resolver)?;
        Self::compile_resolved(resolved, resolver)
    }

    /// Compile a rotation with a spec resolver.
    ///
    /// Note: The rotation must have been parsed with `from_json_resolved`,
    /// or this function will re-parse it from JSON which may not work correctly
    /// for already-processed ASTs.
    pub fn compile(rotation: &Rotation, resolver: &SpecResolver) -> Result<Self> {
        // If the rotation was parsed with from_json_resolved, it's already resolved.
        // If it was parsed with from_json (unresolved), we need to re-parse from JSON.
        // Try to detect this by checking if we have any domain expressions.
        let needs_resolution = rotation.actions.iter().any(|a| {
            if let AstAction::Cast {
                condition: Some(c), ..
            } = a
            {
                matches!(c, Expr::UserVar { .. })
            } else {
                false
            }
        }) || rotation
            .variables
            .values()
            .any(|v| matches!(v, Expr::UserVar { .. }));

        if needs_resolution {
            // Re-serialize and re-parse - this works because we use the original JSON format
            // Note: This won't work correctly because serde serialization uses different format
            // Use compile_json instead for unresolved rotations
            return Err(Error::Compilation(
                "Rotation appears unresolved. Use compile_json() with the original JSON string instead.".to_string()
            ));
        }

        Self::compile_resolved(rotation.clone(), resolver)
    }

    /// Compile an already-resolved rotation.
    fn compile_resolved(resolved: Rotation, resolver: &SpecResolver) -> Result<Self> {
        // Build context schema by walking all expressions
        let mut schema_builder = SchemaBuilder::new();

        // First pass: Register all user variables from the variables map.
        // These have initial values defined as expressions.
        for (name, expr) in &resolved.variables {
            let var_type = value_type_to_field_type(expr.value_type());
            schema_builder.add_user_var(name, var_type);
        }

        // Second pass: Register any user variables from SetVar actions
        // (they may not be in the variables map if they have no initial expression)
        fn register_vars_from_actions(actions: &[AstAction], schema: &mut SchemaBuilder) {
            for action in actions {
                if let AstAction::SetVar { name, value, .. } = action {
                    let var_type = value_type_to_field_type(value.value_type());
                    // add_user_var deduplicates, so this is safe
                    schema.add_user_var(name, var_type);
                }
            }
        }
        register_vars_from_actions(&resolved.actions, &mut schema_builder);
        for actions in resolved.lists.values() {
            register_vars_from_actions(actions, &mut schema_builder);
        }

        // Third pass: Walk all actions and expressions to find domain variables
        for action in &resolved.actions {
            collect_vars_from_action(action, &mut schema_builder);
        }
        for actions in resolved.lists.values() {
            for action in actions {
                collect_vars_from_action(action, &mut schema_builder);
            }
        }
        for expr in resolved.variables.values() {
            collect_vars_from_expr(expr, &mut schema_builder);
        }

        let schema = schema_builder.build();

        // Compile to native code
        let (module, func_ptr) = compile_rotation(&resolved, resolver, &schema)?;

        Ok(Self {
            func_ptr: SyncFnPtr(func_ptr),
            _module: module,
            schema,
        })
    }

    /// Evaluate the rotation.
    pub fn evaluate(&self, state: &SimState) -> EvalResult {
        let required = self.schema.size.max(8);

        // Fast path: use stack buffer for typical small schemas
        if required <= MAX_STACK_BUFFER_SIZE {
            let mut buffer = [0u8; MAX_STACK_BUFFER_SIZE];
            populate_context(&mut buffer[..required], &self.schema, state);
            let packed = unsafe { (self.func_ptr.0)(buffer.as_ptr()) };
            EvalResult {
                kind: (packed >> 56) as u8,
                spell_id: ((packed >> 32) & 0x00FFFFFF) as u32,
                wait_time: f32::from_bits(packed as u32),
            }
        } else {
            // Fallback: thread-local for large schemas
            EVAL_BUFFER.with(|buf| {
                let mut buffer = buf.borrow_mut();
                if buffer.len() < required {
                    buffer.resize(required, 0);
                }
                populate_context(&mut buffer[..required], &self.schema, state);
                let packed = unsafe { (self.func_ptr.0)(buffer.as_ptr()) };
                EvalResult {
                    kind: (packed >> 56) as u8,
                    spell_id: ((packed >> 32) & 0x00FFFFFF) as u32,
                    wait_time: f32::from_bits(packed as u32),
                }
            })
        }
    }

    /// Get the context schema.
    pub fn schema(&self) -> &ContextSchema {
        &self.schema
    }
}

fn collect_vars_from_action(action: &AstAction, schema: &mut SchemaBuilder) {
    match action {
        AstAction::Cast { condition, .. }
        | AstAction::Call { condition, .. }
        | AstAction::Run { condition, .. }
        | AstAction::Wait { condition, .. }
        | AstAction::Pool { condition, .. }
        | AstAction::UseTrinket { condition, .. }
        | AstAction::UseItem { condition, .. } => {
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, schema);
            }
        }
        AstAction::SetVar {
            value, condition, ..
        } => {
            collect_vars_from_expr(value, schema);
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, schema);
            }
        }
        AstAction::ModifyVar {
            value, condition, ..
        } => {
            collect_vars_from_expr(value, schema);
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, schema);
            }
        }
        AstAction::WaitUntil { condition } => {
            collect_vars_from_expr(condition, schema);
        }
    }
}

fn collect_vars_from_expr(expr: &Expr, schema: &mut SchemaBuilder) {
    // Add domain expressions to schema
    schema.add(expr);

    // Recurse into sub-expressions
    match expr {
        Expr::And { operands } | Expr::Or { operands } => {
            for e in operands {
                collect_vars_from_expr(e, schema);
            }
        }

        Expr::Not { operand }
        | Expr::Floor { operand }
        | Expr::Ceil { operand }
        | Expr::Abs { operand } => {
            collect_vars_from_expr(operand, schema);
        }

        Expr::Gt { left, right }
        | Expr::Gte { left, right }
        | Expr::Lt { left, right }
        | Expr::Lte { left, right }
        | Expr::Eq { left, right }
        | Expr::Ne { left, right }
        | Expr::Add { left, right }
        | Expr::Sub { left, right }
        | Expr::Mul { left, right }
        | Expr::Div { left, right }
        | Expr::Mod { left, right }
        | Expr::Min { left, right }
        | Expr::Max { left, right } => {
            collect_vars_from_expr(left, schema);
            collect_vars_from_expr(right, schema);
        }

        _ => {}
    }
}

fn compile_rotation(
    rotation: &Rotation,
    resolver: &SpecResolver,
    schema: &ContextSchema,
) -> Result<(SyncJitModule, RotationFn)> {
    let mut flag_builder = settings::builder();
    flag_builder
        .set("opt_level", "speed")
        .map_err(|e| Error::Compilation(format!("failed to set opt_level: {}", e)))?;
    let flags = settings::Flags::new(flag_builder);

    let isa = cranelift_native::builder()
        .map_err(|e| Error::Compilation(format!("failed to create ISA builder: {}", e)))?
        .finish(flags)
        .map_err(|e| Error::Compilation(format!("failed to finish ISA: {}", e)))?;

    let builder = JITBuilder::with_isa(isa, cranelift_module::default_libcall_names());
    let mut module = JITModule::new(builder);

    let ptr_ty = module.target_config().pointer_type();

    // Signature: fn(*const u8) -> EvalResult (packed as i64)
    let mut sig = module.make_signature();
    sig.params.push(AbiParam::new(ptr_ty));
    sig.returns.push(AbiParam::new(types::I64)); // EvalResult packed

    let func_id = module
        .declare_function("rotation", Linkage::Local, &sig)
        .map_err(|e| Error::Compilation(format!("failed to declare function: {}", e)))?;

    let mut ctx = module.make_context();
    ctx.func.signature = sig;

    {
        let mut fn_builder_ctx = FunctionBuilderContext::new();
        let mut builder = FunctionBuilder::new(&mut ctx.func, &mut fn_builder_ctx);

        let entry_block = builder.create_block();
        builder.append_block_params_for_function_params(entry_block);
        builder.switch_to_block(entry_block);
        builder.seal_block(entry_block);

        let ctx_ptr = builder.block_params(entry_block)[0];

        // Compile the rotation
        let result = {
            let mut compiler = ExprCompiler {
                builder: &mut builder,
                resolver,
                schema,
                variables: &rotation.variables,
                ctx_ptr,
            };
            // Initialize user variables with their default values
            compiler.init_user_variables()?;
            compiler.compile_actions(&rotation.actions, &rotation.lists)?
        };

        // Return the result and finalize
        builder.ins().return_(&[result]);
        builder.finalize();
    }

    module
        .define_function(func_id, &mut ctx)
        .map_err(|e| Error::Compilation(format!("failed to define function: {}", e)))?;
    module.clear_context(&mut ctx);
    module
        .finalize_definitions()
        .map_err(|e| Error::Compilation(format!("failed to finalize: {}", e)))?;

    let func_ptr = module.get_finalized_function(func_id);
    let func_ptr: RotationFn = unsafe { std::mem::transmute(func_ptr) };

    Ok((SyncJitModule(module), func_ptr))
}

struct ExprCompiler<'a, 'b> {
    builder: &'a mut FunctionBuilder<'b>,
    resolver: &'a SpecResolver,
    schema: &'a ContextSchema,
    variables: &'a HashMap<String, Expr>,
    ctx_ptr: Value,
}

impl<'a, 'b> ExprCompiler<'a, 'b> {
    /// Initialize all user variables with their default values.
    ///
    /// This emits code at the start of the function to write initial values
    /// to the context buffer for all user variables defined in `variables`.
    fn init_user_variables(&mut self) -> Result<()> {
        for (name, init_expr) in self.variables.clone().iter() {
            // Get the variable's offset and type
            let offset = match self.schema.user_var_offset(name) {
                Some(o) => o,
                None => continue, // Variable not in schema (shouldn't happen)
            };
            let field_type = match self.schema.user_var_type(name) {
                Some(t) => t,
                None => continue,
            };

            let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);

            // Compile the initial value and store it
            match field_type {
                FieldType::Bool => {
                    let val = self.compile_bool_expr(init_expr)?;
                    self.builder.ins().store(MemFlags::trusted(), val, addr, 0);
                }
                FieldType::Int => {
                    let (val, is_float) = self.compile_numeric_expr(init_expr)?;
                    let int_val = if is_float {
                        self.builder.ins().fcvt_to_sint(types::I32, val)
                    } else {
                        let val_type = self.builder.func.dfg.value_type(val);
                        if val_type == types::I8 {
                            self.builder.ins().uextend(types::I32, val)
                        } else {
                            val
                        }
                    };
                    self.builder
                        .ins()
                        .store(MemFlags::trusted(), int_val, addr, 0);
                }
                FieldType::Float => {
                    let (val, is_float) = self.compile_numeric_expr(init_expr)?;
                    let float_val = if is_float {
                        val
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, val)
                    };
                    self.builder
                        .ins()
                        .store(MemFlags::trusted(), float_val, addr, 0);
                }
            }
        }
        Ok(())
    }

    fn compile_actions(
        &mut self,
        actions: &[AstAction],
        lists: &HashMap<String, Vec<AstAction>>,
    ) -> Result<Value> {
        // Build chain: if cond1 then action1 else if cond2 then action2 else ...
        self.compile_action_chain(actions, 0, lists)
    }

    fn compile_action_chain(
        &mut self,
        actions: &[AstAction],
        idx: usize,
        lists: &HashMap<String, Vec<AstAction>>,
    ) -> Result<Value> {
        if idx >= actions.len() {
            // No action found - return NONE
            return Ok(self.pack_result(0, 0, 0.0));
        }

        let action = &actions[idx];
        let next = |s: &mut Self| s.compile_action_chain(actions, idx + 1, lists);

        match action {
            AstAction::Cast { spell, condition } => {
                let spell_id = self.resolver.resolve_spell(spell)?;
                let result = self.pack_result(1, spell_id.0, 0.0);

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |_| Ok(result), |s| next(s))
                } else {
                    Ok(result)
                }
            }

            AstAction::Call { list, condition } => {
                let list_actions = lists
                    .get(list)
                    .ok_or_else(|| Error::UnknownList(list.clone()))?;

                let call_list = |s: &mut Self| -> Result<Value> {
                    let list_result = s.compile_action_chain(list_actions, 0, lists)?;
                    // If list returned NONE, continue to next action; otherwise return the result
                    let kind = s.builder.ins().ushr_imm(list_result, 56);
                    let is_none = s.builder.ins().icmp_imm(IntCC::Equal, kind, 0);
                    s.compile_if_then_else(is_none, |s| next(s), |_| Ok(list_result))
                };

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| call_list(s), |s| next(s))
                } else {
                    call_list(self)
                }
            }

            AstAction::Run { list, condition } => {
                let list_actions = lists
                    .get(list)
                    .ok_or_else(|| Error::UnknownList(list.clone()))?;

                let run_list = |s: &mut Self| -> Result<Value> {
                    s.compile_action_chain(list_actions, 0, lists)
                };

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| run_list(s), |s| next(s))
                } else {
                    run_list(self)
                }
            }

            AstAction::Wait { seconds, condition } => {
                let result = self.pack_result(2, 0, *seconds as f32);

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |_| Ok(result), |s| next(s))
                } else {
                    Ok(result)
                }
            }

            AstAction::WaitUntil { condition } => {
                let cond_val = self.compile_bool_expr(condition)?;
                let wait_result = self.pack_result(2, 0, 0.1); // Short wait
                self.compile_if_then_else(cond_val, |s| next(s), |_| Ok(wait_result))
            }

            AstAction::SetVar {
                name,
                value,
                condition,
            } => {
                let do_set = |s: &mut Self| -> Result<Value> {
                    s.compile_set_var(name, value)?;
                    next(s)
                };

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| do_set(s), |s| next(s))
                } else {
                    do_set(self)
                }
            }

            AstAction::ModifyVar {
                name,
                op,
                value,
                condition,
            } => {
                let do_modify = |s: &mut Self| -> Result<Value> {
                    s.compile_modify_var(name, op, value)?;
                    next(s)
                };

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| do_modify(s), |s| next(s))
                } else {
                    do_modify(self)
                }
            }

            AstAction::Pool { extra, condition } => {
                // Pool returns a Pool result with the extra amount as target.
                // The simulation loop should wait until resources are sufficient.
                let target = extra.unwrap_or(0.0) as f32;
                let pool_result = self.pack_result(3, 0, target);

                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |_| Ok(pool_result), |s| next(s))
                } else {
                    Ok(pool_result)
                }
            }

            AstAction::UseTrinket { slot, condition } => {
                // TODO: Implement when equipment system exists.
                // For now, skip and continue to next action.
                // Stub: treat as if trinket is always on cooldown.
                let _ = slot; // Acknowledge the slot parameter
                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| next(s), |s| next(s))
                } else {
                    next(self)
                }
            }

            AstAction::UseItem { name, condition } => {
                // TODO: Implement when equipment/inventory system exists.
                // For now, skip and continue to next action.
                // Stub: treat as if item is not available.
                let _ = name; // Acknowledge the name parameter
                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| next(s), |s| next(s))
                } else {
                    next(self)
                }
            }
        }
    }

    fn compile_if_then_else<T, E>(&mut self, cond: Value, then_val: T, else_val: E) -> Result<Value>
    where
        T: FnOnce(&mut Self) -> Result<Value>,
        E: FnOnce(&mut Self) -> Result<Value>,
    {
        let then_block = self.builder.create_block();
        let else_block = self.builder.create_block();
        let merge_block = self.builder.create_block();
        self.builder.append_block_param(merge_block, types::I64);

        self.builder
            .ins()
            .brif(cond, then_block, &[], else_block, &[]);

        self.builder.switch_to_block(then_block);
        self.builder.seal_block(then_block);
        let then_result = then_val(self)?;
        let then_args = [BlockArg::Value(then_result)];
        self.builder.ins().jump(merge_block, &then_args);

        self.builder.switch_to_block(else_block);
        self.builder.seal_block(else_block);
        let else_result = else_val(self)?;
        let else_args = [BlockArg::Value(else_result)];
        self.builder.ins().jump(merge_block, &else_args);

        self.builder.switch_to_block(merge_block);
        self.builder.seal_block(merge_block);
        Ok(self.builder.block_params(merge_block)[0])
    }

    /// Compile short-circuit AND: evaluates operands left-to-right,
    /// returns false immediately when any operand is false.
    fn compile_short_circuit_and(&mut self, operands: &[Expr]) -> Result<Value> {
        if operands.is_empty() {
            return Ok(self.builder.ins().iconst(types::I8, 1));
        }
        if operands.len() == 1 {
            return self.compile_bool_expr(&operands[0]);
        }

        // Evaluate first operand
        let first = self.compile_bool_expr(&operands[0])?;

        // Create blocks
        let continue_block = self.builder.create_block();
        let merge_block = self.builder.create_block();
        self.builder.append_block_param(merge_block, types::I8);

        // If first is false, short-circuit to false
        let false_val = self.builder.ins().iconst(types::I8, 0);
        let false_args = [BlockArg::Value(false_val)];
        self.builder
            .ins()
            .brif(first, continue_block, &[], merge_block, &false_args);

        // Continue evaluating rest
        self.builder.switch_to_block(continue_block);
        self.builder.seal_block(continue_block);

        // Recursively evaluate remaining operands
        let rest_result = self.compile_short_circuit_and(&operands[1..])?;
        let rest_args = [BlockArg::Value(rest_result)];
        self.builder.ins().jump(merge_block, &rest_args);

        self.builder.switch_to_block(merge_block);
        self.builder.seal_block(merge_block);
        Ok(self.builder.block_params(merge_block)[0])
    }

    /// Compile short-circuit OR: evaluates operands left-to-right,
    /// returns true immediately when any operand is true.
    fn compile_short_circuit_or(&mut self, operands: &[Expr]) -> Result<Value> {
        if operands.is_empty() {
            return Ok(self.builder.ins().iconst(types::I8, 0));
        }
        if operands.len() == 1 {
            return self.compile_bool_expr(&operands[0]);
        }

        // Evaluate first operand
        let first = self.compile_bool_expr(&operands[0])?;

        // Create blocks
        let continue_block = self.builder.create_block();
        let merge_block = self.builder.create_block();
        self.builder.append_block_param(merge_block, types::I8);

        // If first is true, short-circuit to true
        let true_val = self.builder.ins().iconst(types::I8, 1);
        let true_args = [BlockArg::Value(true_val)];
        self.builder
            .ins()
            .brif(first, merge_block, &true_args, continue_block, &[]);

        // Continue evaluating rest
        self.builder.switch_to_block(continue_block);
        self.builder.seal_block(continue_block);

        // Recursively evaluate remaining operands
        let rest_result = self.compile_short_circuit_or(&operands[1..])?;
        let rest_args = [BlockArg::Value(rest_result)];
        self.builder.ins().jump(merge_block, &rest_args);

        self.builder.switch_to_block(merge_block);
        self.builder.seal_block(merge_block);
        Ok(self.builder.block_params(merge_block)[0])
    }

    fn pack_result(&mut self, kind: u8, spell_id: u32, wait_time: f32) -> Value {
        // Pack EvalResult into i64:
        // bits 0-31: wait_time as u32
        // bits 32-55: spell_id (lower 24 bits)
        // bits 56-63: kind
        let wait_bits = wait_time.to_bits() as i64;
        let spell_bits = (spell_id as i64) << 32;
        let kind_bits = (kind as i64) << 56;
        self.builder
            .ins()
            .iconst(types::I64, wait_bits | spell_bits | kind_bits)
    }

    fn compile_bool_expr(&mut self, expr: &Expr) -> Result<Value> {
        match expr {
            Expr::Bool { value } => Ok(self
                .builder
                .ins()
                .iconst(types::I8, if *value { 1 } else { 0 })),

            // Talent is a compile-time constant
            Expr::Talent(TalentExpr::Enabled { value }) => Ok(self
                .builder
                .ins()
                .iconst(types::I8, if *value { 1 } else { 0 })),

            // Domain expressions - load from context
            Expr::Resource(_)
            | Expr::Cooldown(_)
            | Expr::Buff(_)
            | Expr::Debuff(_)
            | Expr::Dot(_)
            | Expr::Combat(_)
            | Expr::Target(_)
            | Expr::Player(_)
            | Expr::Spell(_)
            | Expr::Gcd(_)
            | Expr::Pet(_)
            | Expr::TrinketReady { .. }
            | Expr::TrinketRemaining { .. }
            | Expr::Equipped { .. } => self.load_bool_var(expr),

            Expr::UserVar { name } => {
                // Load from context buffer - this enables runtime mutation
                self.load_user_var_bool(name)
            }

            Expr::And { operands } => {
                // Logical AND with short-circuit evaluation
                // Returns false as soon as any operand is false
                if operands.is_empty() {
                    return Ok(self.builder.ins().iconst(types::I8, 1));
                }
                if operands.len() == 1 {
                    return self.compile_bool_expr(&operands[0]);
                }

                // Short-circuit: if first is false, return false immediately
                // Otherwise, evaluate the rest
                self.compile_short_circuit_and(&operands[..])
            }

            Expr::Or { operands } => {
                // Logical OR with short-circuit evaluation
                // Returns true as soon as any operand is true
                if operands.is_empty() {
                    return Ok(self.builder.ins().iconst(types::I8, 0));
                }
                if operands.len() == 1 {
                    return self.compile_bool_expr(&operands[0]);
                }

                // Short-circuit: if first is true, return true immediately
                // Otherwise, evaluate the rest
                self.compile_short_circuit_or(&operands[..])
            }

            Expr::Not { operand } => {
                let val = self.compile_bool_expr(operand)?;
                let one = self.builder.ins().iconst(types::I8, 1);
                Ok(self.builder.ins().bxor(val, one))
            }

            Expr::Gt { left, right } => {
                self.compile_comparison(FloatCC::GreaterThan, IntCC::SignedGreaterThan, left, right)
            }
            Expr::Gte { left, right } => self.compile_comparison(
                FloatCC::GreaterThanOrEqual,
                IntCC::SignedGreaterThanOrEqual,
                left,
                right,
            ),
            Expr::Lt { left, right } => {
                self.compile_comparison(FloatCC::LessThan, IntCC::SignedLessThan, left, right)
            }
            Expr::Lte { left, right } => self.compile_comparison(
                FloatCC::LessThanOrEqual,
                IntCC::SignedLessThanOrEqual,
                left,
                right,
            ),
            Expr::Eq { left, right } => {
                // For float equality, use epsilon comparison: |a - b| < EPSILON
                self.compile_eq_comparison(left, right, false)
            }
            Expr::Ne { left, right } => {
                // For float inequality, use epsilon comparison: |a - b| >= EPSILON
                self.compile_eq_comparison(left, right, true)
            }

            _ => Err(Error::TypeError {
                expected: "bool",
                got: "number",
            }),
        }
    }

    fn compile_comparison(
        &mut self,
        float_cc: FloatCC,
        int_cc: IntCC,
        a: &Expr,
        b: &Expr,
    ) -> Result<Value> {
        let (a_val, a_float) = self.compile_numeric_expr(a)?;
        let (b_val, b_float) = self.compile_numeric_expr(b)?;

        let is_float = a_float || b_float;

        let (a_val, b_val) = if is_float {
            let a_val = if a_float {
                a_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, a_val)
            };
            let b_val = if b_float {
                b_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, b_val)
            };
            (a_val, b_val)
        } else {
            (a_val, b_val)
        };

        if is_float {
            Ok(self.builder.ins().fcmp(float_cc, a_val, b_val))
        } else {
            Ok(self.builder.ins().icmp(int_cc, a_val, b_val))
        }
    }

    /// Compile equality/inequality comparison with epsilon tolerance for floats.
    ///
    /// For floats: compares |a - b| < EPSILON (eq) or |a - b| >= EPSILON (ne)
    /// For ints: uses exact comparison
    fn compile_eq_comparison(&mut self, a: &Expr, b: &Expr, is_ne: bool) -> Result<Value> {
        use super::eval::EPSILON;

        let (a_val, a_float) = self.compile_numeric_expr(a)?;
        let (b_val, b_float) = self.compile_numeric_expr(b)?;

        let is_float = a_float || b_float;

        if is_float {
            let a_f = if a_float {
                a_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, a_val)
            };
            let b_f = if b_float {
                b_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, b_val)
            };

            // Compute |a - b|
            let diff = self.builder.ins().fsub(a_f, b_f);
            let abs_diff = self.builder.ins().fabs(diff);

            // Compare with epsilon
            let epsilon = self.builder.ins().f64const(EPSILON);
            if is_ne {
                // ne: |a - b| >= EPSILON
                Ok(self
                    .builder
                    .ins()
                    .fcmp(FloatCC::GreaterThanOrEqual, abs_diff, epsilon))
            } else {
                // eq: |a - b| < EPSILON
                Ok(self
                    .builder
                    .ins()
                    .fcmp(FloatCC::LessThan, abs_diff, epsilon))
            }
        } else {
            // Integer comparison is exact
            if is_ne {
                Ok(self.builder.ins().icmp(IntCC::NotEqual, a_val, b_val))
            } else {
                Ok(self.builder.ins().icmp(IntCC::Equal, a_val, b_val))
            }
        }
    }

    fn compile_numeric_expr(&mut self, expr: &Expr) -> Result<(Value, bool)> {
        match expr {
            Expr::Int { value } => Ok((self.builder.ins().iconst(types::I32, *value), false)),

            Expr::Float { value } => Ok((self.builder.ins().f64const(*value), true)),

            // Domain expressions - load from context
            Expr::Resource(_)
            | Expr::Cooldown(_)
            | Expr::Buff(_)
            | Expr::Debuff(_)
            | Expr::Dot(_)
            | Expr::Combat(_)
            | Expr::Target(_)
            | Expr::Player(_)
            | Expr::Spell(_)
            | Expr::Gcd(_)
            | Expr::Pet(_)
            | Expr::TrinketReady { .. }
            | Expr::TrinketRemaining { .. } => self.load_numeric_var(expr),

            Expr::UserVar { name } => {
                // Load from context buffer - this enables runtime mutation
                self.load_user_var_numeric(name)
            }

            Expr::Add { left, right } => self.compile_binop(
                left,
                right,
                |b, a, c| b.ins().fadd(a, c),
                |b, a, c| b.ins().iadd(a, c),
            ),
            Expr::Sub { left, right } => self.compile_binop(
                left,
                right,
                |b, a, c| b.ins().fsub(a, c),
                |b, a, c| b.ins().isub(a, c),
            ),
            Expr::Mul { left, right } => self.compile_binop(
                left,
                right,
                |b, a, c| b.ins().fmul(a, c),
                |b, a, c| b.ins().imul(a, c),
            ),
            Expr::Div { left, right } => {
                // Safe division: check for zero and return 0.0 if divisor is zero
                // Always convert to float for safe division (avoids integer div-by-zero trap)
                let (a_val, a_float) = self.compile_numeric_expr(left)?;
                let (b_val, b_float) = self.compile_numeric_expr(right)?;

                let a_f = if a_float {
                    a_val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, a_val)
                };
                let b_f = if b_float {
                    b_val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, b_val)
                };

                // Check if b is zero
                let zero = self.builder.ins().f64const(0.0);
                let is_zero = self.builder.ins().fcmp(FloatCC::Equal, b_f, zero);
                // Compute division (safe for floats - returns inf/nan for div by zero)
                let div_result = self.builder.ins().fdiv(a_f, b_f);
                // Select zero if divisor was zero, otherwise use division result
                Ok((self.builder.ins().select(is_zero, zero, div_result), true))
            }
            Expr::Mod { left, right } => {
                // True modulo: result has same sign as divisor
                // Formula: ((a % b) + b) % b
                // With division by zero protection: returns 0.0 if b == 0
                let (a_val, a_float) = self.compile_numeric_expr(left)?;
                let (b_val, b_float) = self.compile_numeric_expr(right)?;
                let a_f = if a_float {
                    a_val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, a_val)
                };
                let b_f = if b_float {
                    b_val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, b_val)
                };

                // Check for division by zero
                let zero = self.builder.ins().f64const(0.0);
                let is_zero = self.builder.ins().fcmp(FloatCC::Equal, b_f, zero);

                // Compute standard modulo: a % b = a - b * floor(a / b)
                let div = self.builder.ins().fdiv(a_f, b_f);
                let floored = self.builder.ins().floor(div);
                let prod = self.builder.ins().fmul(b_f, floored);
                let std_mod = self.builder.ins().fsub(a_f, prod);

                // True modulo: ((a % b) + b) % b
                let with_b = self.builder.ins().fadd(std_mod, b_f);
                let div2 = self.builder.ins().fdiv(with_b, b_f);
                let floored2 = self.builder.ins().floor(div2);
                let prod2 = self.builder.ins().fmul(b_f, floored2);
                let true_mod_result = self.builder.ins().fsub(with_b, prod2);

                // Return 0.0 if divisor was zero
                Ok((
                    self.builder.ins().select(is_zero, zero, true_mod_result),
                    true,
                ))
            }

            Expr::Floor { operand } => {
                let (val, is_float) = self.compile_numeric_expr(operand)?;
                let float_val = if is_float {
                    val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, val)
                };
                Ok((self.builder.ins().floor(float_val), true))
            }

            Expr::Ceil { operand } => {
                let (val, is_float) = self.compile_numeric_expr(operand)?;
                let float_val = if is_float {
                    val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, val)
                };
                Ok((self.builder.ins().ceil(float_val), true))
            }

            Expr::Abs { operand } => {
                let (val, is_float) = self.compile_numeric_expr(operand)?;
                if is_float {
                    Ok((self.builder.ins().fabs(val), true))
                } else {
                    // Integer abs
                    let neg = self.builder.ins().ineg(val);
                    let zero = self.builder.ins().iconst(types::I32, 0);
                    let is_neg = self.builder.ins().icmp(IntCC::SignedLessThan, val, zero);
                    Ok((self.builder.ins().select(is_neg, neg, val), false))
                }
            }

            Expr::Min { left, right } => {
                let (a_val, a_float) = self.compile_numeric_expr(left)?;
                let (b_val, b_float) = self.compile_numeric_expr(right)?;
                let is_float = a_float || b_float;
                if is_float {
                    let a_f = if a_float {
                        a_val
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, a_val)
                    };
                    let b_f = if b_float {
                        b_val
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, b_val)
                    };
                    Ok((self.builder.ins().fmin(a_f, b_f), true))
                } else {
                    let cmp = self.builder.ins().icmp(IntCC::SignedLessThan, a_val, b_val);
                    Ok((self.builder.ins().select(cmp, a_val, b_val), false))
                }
            }

            Expr::Max { left, right } => {
                let (a_val, a_float) = self.compile_numeric_expr(left)?;
                let (b_val, b_float) = self.compile_numeric_expr(right)?;
                let is_float = a_float || b_float;
                if is_float {
                    let a_f = if a_float {
                        a_val
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, a_val)
                    };
                    let b_f = if b_float {
                        b_val
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, b_val)
                    };
                    Ok((self.builder.ins().fmax(a_f, b_f), true))
                } else {
                    let cmp = self
                        .builder
                        .ins()
                        .icmp(IntCC::SignedGreaterThan, a_val, b_val);
                    Ok((self.builder.ins().select(cmp, a_val, b_val), false))
                }
            }

            _ => Err(Error::TypeError {
                expected: "number",
                got: "bool",
            }),
        }
    }

    fn compile_binop<F, I>(
        &mut self,
        a: &Expr,
        b: &Expr,
        float_op: F,
        int_op: I,
    ) -> Result<(Value, bool)>
    where
        F: FnOnce(&mut FunctionBuilder, Value, Value) -> Value,
        I: FnOnce(&mut FunctionBuilder, Value, Value) -> Value,
    {
        let (a_val, a_float) = self.compile_numeric_expr(a)?;
        let (b_val, b_float) = self.compile_numeric_expr(b)?;

        let is_float = a_float || b_float;

        if is_float {
            let a_f = if a_float {
                a_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, a_val)
            };
            let b_f = if b_float {
                b_val
            } else {
                self.builder.ins().fcvt_from_sint(types::F64, b_val)
            };
            Ok((float_op(self.builder, a_f, b_f), true))
        } else {
            Ok((int_op(self.builder, a_val, b_val), false))
        }
    }

    fn load_bool_var(&mut self, expr: &Expr) -> Result<Value> {
        // Talents are compile-time constants
        if let Expr::Talent(TalentExpr::Enabled { value }) = expr {
            return Ok(self
                .builder
                .ins()
                .iconst(types::I8, if *value { 1 } else { 0 }));
        }

        let key = ExprKey::from_expr(expr)
            .ok_or_else(|| Error::Compilation(format!("expression not loadable: {:?}", expr)))?;

        let offset = self
            .schema
            .offset(&key)
            .ok_or_else(|| Error::Compilation(format!("variable not in schema: {:?}", key)))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);
        let val = self
            .builder
            .ins()
            .load(types::I8, MemFlags::trusted(), addr, 0);
        Ok(val)
    }

    fn load_numeric_var(&mut self, expr: &Expr) -> Result<(Value, bool)> {
        let key = ExprKey::from_expr(expr)
            .ok_or_else(|| Error::Compilation(format!("expression not loadable: {:?}", expr)))?;

        let offset = self
            .schema
            .offset(&key)
            .ok_or_else(|| Error::Compilation(format!("variable not in schema: {:?}", key)))?;
        let field_type = key.field_type();

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);

        match field_type {
            FieldType::Bool => {
                let val = self
                    .builder
                    .ins()
                    .load(types::I8, MemFlags::trusted(), addr, 0);
                let extended = self.builder.ins().uextend(types::I32, val);
                Ok((extended, false))
            }
            FieldType::Int => {
                let val = self
                    .builder
                    .ins()
                    .load(types::I32, MemFlags::trusted(), addr, 0);
                Ok((val, false))
            }
            FieldType::Float => {
                let val = self
                    .builder
                    .ins()
                    .load(types::F64, MemFlags::trusted(), addr, 0);
                Ok((val, true))
            }
        }
    }

    /// Load a user variable as a boolean value.
    fn load_user_var_bool(&mut self, name: &str) -> Result<Value> {
        let offset = self
            .schema
            .user_var_offset(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);
        let val = self
            .builder
            .ins()
            .load(types::I8, MemFlags::trusted(), addr, 0);
        Ok(val)
    }

    /// Load a user variable as a numeric value.
    /// Returns (value, is_float).
    fn load_user_var_numeric(&mut self, name: &str) -> Result<(Value, bool)> {
        let offset = self
            .schema
            .user_var_offset(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;
        let field_type = self
            .schema
            .user_var_type(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);

        match field_type {
            FieldType::Bool => {
                let val = self
                    .builder
                    .ins()
                    .load(types::I8, MemFlags::trusted(), addr, 0);
                let extended = self.builder.ins().uextend(types::I32, val);
                Ok((extended, false))
            }
            FieldType::Int => {
                let val = self
                    .builder
                    .ins()
                    .load(types::I32, MemFlags::trusted(), addr, 0);
                Ok((val, false))
            }
            FieldType::Float => {
                let val = self
                    .builder
                    .ins()
                    .load(types::F64, MemFlags::trusted(), addr, 0);
                Ok((val, true))
            }
        }
    }

    /// Store a value to a user variable.
    fn store_user_var(&mut self, name: &str, val: Value, is_float: bool) -> Result<()> {
        let offset = self
            .schema
            .user_var_offset(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;
        let field_type = self
            .schema
            .user_var_type(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);

        match field_type {
            FieldType::Bool => {
                // Convert to bool (truncate or compare)
                let bool_val = if is_float {
                    // float != 0.0
                    let zero = self.builder.ins().f64const(0.0);
                    self.builder.ins().fcmp(FloatCC::NotEqual, val, zero)
                } else {
                    // For i32/i8, truncate to i8
                    let val_type = self.builder.func.dfg.value_type(val);
                    if val_type == types::I32 {
                        self.builder.ins().ireduce(types::I8, val)
                    } else {
                        val
                    }
                };
                self.builder
                    .ins()
                    .store(MemFlags::trusted(), bool_val, addr, 0);
            }
            FieldType::Int => {
                // Convert to i32
                let int_val = if is_float {
                    self.builder.ins().fcvt_to_sint(types::I32, val)
                } else {
                    let val_type = self.builder.func.dfg.value_type(val);
                    if val_type == types::I8 {
                        self.builder.ins().uextend(types::I32, val)
                    } else {
                        val
                    }
                };
                self.builder
                    .ins()
                    .store(MemFlags::trusted(), int_val, addr, 0);
            }
            FieldType::Float => {
                // Convert to f64
                let float_val = if is_float {
                    val
                } else {
                    self.builder.ins().fcvt_from_sint(types::F64, val)
                };
                self.builder
                    .ins()
                    .store(MemFlags::trusted(), float_val, addr, 0);
            }
        }
        Ok(())
    }

    /// Compile a SetVar action: evaluate value and store to variable slot.
    fn compile_set_var(&mut self, name: &str, value: &Expr) -> Result<()> {
        let field_type = self
            .schema
            .user_var_type(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;

        match field_type {
            FieldType::Bool => {
                let val = self.compile_bool_expr(value)?;
                self.store_user_var(name, val, false)
            }
            FieldType::Int | FieldType::Float => {
                let (val, is_float) = self.compile_numeric_expr(value)?;
                self.store_user_var(name, val, is_float)
            }
        }
    }

    /// Compile a ModifyVar action: read, modify, write.
    fn compile_modify_var(&mut self, name: &str, op: &VarOp, value: &Expr) -> Result<()> {
        let field_type = self
            .schema
            .user_var_type(name)
            .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;

        // For Reset, we just set to the initial value (compile the definition)
        if *op == VarOp::Reset {
            if let Some(init_expr) = self.variables.get(name).cloned() {
                return self.compile_set_var(name, &init_expr);
            } else {
                // No initial value - set to zero/false
                let offset = self
                    .schema
                    .user_var_offset(name)
                    .ok_or_else(|| Error::UnknownUserVar(name.to_string()))?;
                let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);
                match field_type {
                    FieldType::Bool => {
                        let zero = self.builder.ins().iconst(types::I8, 0);
                        self.builder.ins().store(MemFlags::trusted(), zero, addr, 0);
                    }
                    FieldType::Int => {
                        let zero = self.builder.ins().iconst(types::I32, 0);
                        self.builder.ins().store(MemFlags::trusted(), zero, addr, 0);
                    }
                    FieldType::Float => {
                        let zero = self.builder.ins().f64const(0.0);
                        self.builder.ins().store(MemFlags::trusted(), zero, addr, 0);
                    }
                }
                return Ok(());
            }
        }

        // For Set, just set the value directly
        if *op == VarOp::Set {
            return self.compile_set_var(name, value);
        }

        // For other ops, we need to read, modify, write
        match field_type {
            FieldType::Bool => {
                // Bool only supports Set/Reset, other ops don't make sense
                // Just treat as Set for safety
                let val = self.compile_bool_expr(value)?;
                self.store_user_var(name, val, false)
            }
            FieldType::Int | FieldType::Float => {
                // Load current value
                let (current, current_is_float) = self.load_user_var_numeric(name)?;
                // Compile the operand
                let (operand, operand_is_float) = self.compile_numeric_expr(value)?;

                // Promote to float if needed
                let is_float =
                    current_is_float || operand_is_float || field_type == FieldType::Float;
                let (curr_val, op_val) = if is_float {
                    let c = if current_is_float {
                        current
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, current)
                    };
                    let o = if operand_is_float {
                        operand
                    } else {
                        self.builder.ins().fcvt_from_sint(types::F64, operand)
                    };
                    (c, o)
                } else {
                    (current, operand)
                };

                // Apply operation
                let result = match op {
                    VarOp::Add => {
                        if is_float {
                            self.builder.ins().fadd(curr_val, op_val)
                        } else {
                            self.builder.ins().iadd(curr_val, op_val)
                        }
                    }
                    VarOp::Sub => {
                        if is_float {
                            self.builder.ins().fsub(curr_val, op_val)
                        } else {
                            self.builder.ins().isub(curr_val, op_val)
                        }
                    }
                    VarOp::Mul => {
                        if is_float {
                            self.builder.ins().fmul(curr_val, op_val)
                        } else {
                            self.builder.ins().imul(curr_val, op_val)
                        }
                    }
                    VarOp::Div => {
                        // Always use float division for safety
                        let c_f = if is_float {
                            curr_val
                        } else {
                            self.builder.ins().fcvt_from_sint(types::F64, curr_val)
                        };
                        let o_f = if is_float {
                            op_val
                        } else {
                            self.builder.ins().fcvt_from_sint(types::F64, op_val)
                        };
                        self.builder.ins().fdiv(c_f, o_f)
                    }
                    VarOp::Min => {
                        if is_float {
                            self.builder.ins().fmin(curr_val, op_val)
                        } else {
                            let cmp =
                                self.builder
                                    .ins()
                                    .icmp(IntCC::SignedLessThan, curr_val, op_val);
                            self.builder.ins().select(cmp, curr_val, op_val)
                        }
                    }
                    VarOp::Max => {
                        if is_float {
                            self.builder.ins().fmax(curr_val, op_val)
                        } else {
                            let cmp =
                                self.builder
                                    .ins()
                                    .icmp(IntCC::SignedGreaterThan, curr_val, op_val);
                            self.builder.ins().select(cmp, curr_val, op_val)
                        }
                    }
                    VarOp::Set | VarOp::Reset => unreachable!("handled above"),
                };

                // Store result
                let result_is_float = is_float || matches!(op, VarOp::Div);
                self.store_user_var(name, result, result_is_float)
            }
        }
    }
}

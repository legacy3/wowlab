//! Cranelift JIT compiler for rotations.
//!
//! Compiles rotation AST to native code via Cranelift.

use std::collections::HashMap;

use cranelift::prelude::*;
use cranelift::codegen::ir::BlockArg;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{Linkage, Module};

use crate::sim::SimState;
use crate::types::SpellIdx;

use super::ast::{Action as AstAction, Expr, Rotation};
use super::context::{populate_context, ContextSchema, FieldType, SchemaBuilder};
use super::error::{Error, Result};
use super::resolver::{resolve_var, ResolvedVar, SpecResolver};

/// Rotation evaluation result.
#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub struct EvalResult {
    /// Action kind: 0=none, 1=cast, 2=wait
    pub kind: u8,
    /// Spell ID (for cast) or 0
    pub spell_id: u32,
    /// Wait duration in seconds (for wait)
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

    pub fn is_none(&self) -> bool {
        self.kind == 0
    }

    pub fn is_cast(&self) -> bool {
        self.kind == 1
    }

    pub fn is_wait(&self) -> bool {
        self.kind == 2
    }
}

/// Function signature: fn(*const u8) -> u64 (packed EvalResult)
type RotationFn = unsafe extern "C" fn(*const u8) -> u64;

/// A Send+Sync wrapper for the function pointer.
#[derive(Clone, Copy)]
struct SyncFnPtr(RotationFn);

unsafe impl Send for SyncFnPtr {}
unsafe impl Sync for SyncFnPtr {}

/// A compiled rotation ready for execution.
pub struct CompiledRotation {
    func_ptr: SyncFnPtr,
    schema: ContextSchema,
}

impl CompiledRotation {
    /// Compile a rotation with a spec resolver.
    pub fn compile(rotation: &Rotation, resolver: &SpecResolver) -> Result<Self> {
        // Build context schema by walking all expressions
        let mut schema_builder = SchemaBuilder::new();

        // Walk all actions and expressions to find variables
        for action in &rotation.actions {
            collect_vars_from_action(action, resolver, &mut schema_builder)?;
        }
        for actions in rotation.lists.values() {
            for action in actions {
                collect_vars_from_action(action, resolver, &mut schema_builder)?;
            }
        }
        for expr in rotation.variables.values() {
            collect_vars_from_expr(expr, resolver, &mut schema_builder)?;
        }

        let schema = schema_builder.build();

        // Compile to native code
        let func_ptr = compile_rotation(rotation, resolver, &schema)?;

        Ok(Self {
            func_ptr: SyncFnPtr(func_ptr),
            schema,
        })
    }

    /// Evaluate the rotation.
    pub fn evaluate(&self, state: &SimState) -> EvalResult {
        let mut buffer = vec![0u8; self.schema.size.max(8)];
        populate_context(&mut buffer, &self.schema, state);
        let packed = unsafe { (self.func_ptr.0)(buffer.as_ptr()) };
        // Unpack: bits 0-31 = wait_time, bits 32-55 = spell_id, bits 56-63 = kind
        EvalResult {
            kind: (packed >> 56) as u8,
            spell_id: ((packed >> 32) & 0x00FFFFFF) as u32,
            wait_time: f32::from_bits(packed as u32),
        }
    }

    /// Get the context schema.
    pub fn schema(&self) -> &ContextSchema {
        &self.schema
    }
}

fn collect_vars_from_action(
    action: &AstAction,
    resolver: &SpecResolver,
    schema: &mut SchemaBuilder,
) -> Result<()> {
    match action {
        AstAction::Cast { condition, .. }
        | AstAction::Call { condition, .. }
        | AstAction::Run { condition, .. }
        | AstAction::Wait { condition, .. }
        | AstAction::Pool { condition, .. }
        | AstAction::UseTrinket { condition, .. }
        | AstAction::UseItem { condition, .. } => {
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, resolver, schema)?;
            }
        }
        AstAction::SetVar {
            value, condition, ..
        } => {
            collect_vars_from_expr(value, resolver, schema)?;
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, resolver, schema)?;
            }
        }
        AstAction::ModifyVar {
            value, condition, ..
        } => {
            collect_vars_from_expr(value, resolver, schema)?;
            if let Some(cond) = condition {
                collect_vars_from_expr(cond, resolver, schema)?;
            }
        }
        AstAction::WaitUntil { condition } => {
            collect_vars_from_expr(condition, resolver, schema)?;
        }
    }
    Ok(())
}

fn collect_vars_from_expr(
    expr: &Expr,
    resolver: &SpecResolver,
    schema: &mut SchemaBuilder,
) -> Result<()> {
    match expr {
        Expr::Bool { .. } | Expr::Int { .. } | Expr::Float { .. } | Expr::UserVar { .. } => {}

        Expr::Var { path } => {
            let resolved = resolve_var(path, resolver)?;
            schema.add(resolved);
        }

        Expr::And { operands } | Expr::Or { operands } => {
            for e in operands {
                collect_vars_from_expr(e, resolver, schema)?;
            }
        }

        Expr::Not { operand }
        | Expr::Floor { operand }
        | Expr::Ceil { operand }
        | Expr::Abs { operand } => {
            collect_vars_from_expr(operand, resolver, schema)?;
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
            collect_vars_from_expr(left, resolver, schema)?;
            collect_vars_from_expr(right, resolver, schema)?;
        }
    }
    Ok(())
}

fn compile_rotation(
    rotation: &Rotation,
    resolver: &SpecResolver,
    schema: &ContextSchema,
) -> Result<RotationFn> {
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

    // Leak the module to keep JIT memory alive
    Box::leak(Box::new(module));

    Ok(func_ptr)
}

struct ExprCompiler<'a, 'b> {
    builder: &'a mut FunctionBuilder<'b>,
    resolver: &'a SpecResolver,
    schema: &'a ContextSchema,
    variables: &'a HashMap<String, Expr>,
    ctx_ptr: Value,
}

impl<'a, 'b> ExprCompiler<'a, 'b> {
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

                let run_list =
                    |s: &mut Self| -> Result<Value> { s.compile_action_chain(list_actions, 0, lists) };

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

            // For now, skip variable operations and continue
            AstAction::SetVar { condition, .. } | AstAction::ModifyVar { condition, .. } => {
                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| next(s), |s| next(s))
                } else {
                    next(self)
                }
            }

            AstAction::Pool { condition, .. }
            | AstAction::UseTrinket { condition, .. }
            | AstAction::UseItem { condition, .. } => {
                // Skip for now
                if let Some(cond) = condition {
                    let cond_val = self.compile_bool_expr(cond)?;
                    self.compile_if_then_else(cond_val, |s| next(s), |s| next(s))
                } else {
                    next(self)
                }
            }
        }
    }

    fn compile_if_then_else<T, E>(
        &mut self,
        cond: Value,
        then_val: T,
        else_val: E,
    ) -> Result<Value>
    where
        T: FnOnce(&mut Self) -> Result<Value>,
        E: FnOnce(&mut Self) -> Result<Value>,
    {
        let then_block = self.builder.create_block();
        let else_block = self.builder.create_block();
        let merge_block = self.builder.create_block();
        self.builder.append_block_param(merge_block, types::I64);

        self.builder.ins().brif(cond, then_block, &[], else_block, &[]);

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

    fn pack_result(&mut self, kind: u8, spell_id: u32, wait_time: f32) -> Value {
        // Pack EvalResult into i64:
        // bits 0-31: wait_time as u32
        // bits 32-55: spell_id (lower 24 bits)
        // bits 56-63: kind
        let wait_bits = wait_time.to_bits() as i64;
        let spell_bits = (spell_id as i64) << 32;
        let kind_bits = (kind as i64) << 56;
        self.builder.ins().iconst(types::I64, wait_bits | spell_bits | kind_bits)
    }

    fn compile_bool_expr(&mut self, expr: &Expr) -> Result<Value> {
        match expr {
            Expr::Bool { value } => {
                Ok(self.builder.ins().iconst(types::I8, if *value { 1 } else { 0 }))
            }

            Expr::Var { path } => {
                let resolved = resolve_var(path, self.resolver)?;
                self.load_bool_var(&resolved)
            }

            Expr::UserVar { name } => {
                let expr = self
                    .variables
                    .get(name)
                    .ok_or_else(|| Error::UnknownUserVar(name.clone()))?
                    .clone();
                self.compile_bool_expr(&expr)
            }

            Expr::And { operands } => {
                // Logical AND (all expressions evaluated - no short-circuit for JIT simplicity)
                if operands.is_empty() {
                    return Ok(self.builder.ins().iconst(types::I8, 1));
                }
                let mut result = self.compile_bool_expr(&operands[0])?;
                for expr in &operands[1..] {
                    let next = self.compile_bool_expr(expr)?;
                    result = self.builder.ins().band(result, next);
                }
                Ok(result)
            }

            Expr::Or { operands } => {
                // Logical OR (all expressions evaluated - no short-circuit for JIT simplicity)
                if operands.is_empty() {
                    return Ok(self.builder.ins().iconst(types::I8, 0));
                }
                let mut result = self.compile_bool_expr(&operands[0])?;
                for expr in &operands[1..] {
                    let next = self.compile_bool_expr(expr)?;
                    result = self.builder.ins().bor(result, next);
                }
                Ok(result)
            }

            Expr::Not { operand } => {
                let val = self.compile_bool_expr(operand)?;
                let one = self.builder.ins().iconst(types::I8, 1);
                Ok(self.builder.ins().bxor(val, one))
            }

            Expr::Gt { left, right } => self.compile_comparison(FloatCC::GreaterThan, IntCC::SignedGreaterThan, left, right),
            Expr::Gte { left, right } => self.compile_comparison(FloatCC::GreaterThanOrEqual, IntCC::SignedGreaterThanOrEqual, left, right),
            Expr::Lt { left, right } => self.compile_comparison(FloatCC::LessThan, IntCC::SignedLessThan, left, right),
            Expr::Lte { left, right } => self.compile_comparison(FloatCC::LessThanOrEqual, IntCC::SignedLessThanOrEqual, left, right),
            Expr::Eq { left, right } => self.compile_comparison(FloatCC::Equal, IntCC::Equal, left, right),
            Expr::Ne { left, right } => self.compile_comparison(FloatCC::NotEqual, IntCC::NotEqual, left, right),

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

    fn compile_numeric_expr(&mut self, expr: &Expr) -> Result<(Value, bool)> {
        match expr {
            Expr::Int { value } => {
                Ok((self.builder.ins().iconst(types::I32, *value), false))
            }

            Expr::Float { value } => {
                Ok((self.builder.ins().f64const(*value), true))
            }

            Expr::Var { path } => {
                let resolved = resolve_var(path, self.resolver)?;
                self.load_numeric_var(&resolved)
            }

            Expr::UserVar { name } => {
                let expr = self
                    .variables
                    .get(name)
                    .ok_or_else(|| Error::UnknownUserVar(name.clone()))?
                    .clone();
                self.compile_numeric_expr(&expr)
            }

            Expr::Add { left, right } => self.compile_binop(left, right, |b, a, c| b.ins().fadd(a, c), |b, a, c| b.ins().iadd(a, c)),
            Expr::Sub { left, right } => self.compile_binop(left, right, |b, a, c| b.ins().fsub(a, c), |b, a, c| b.ins().isub(a, c)),
            Expr::Mul { left, right } => self.compile_binop(left, right, |b, a, c| b.ins().fmul(a, c), |b, a, c| b.ins().imul(a, c)),
            Expr::Div { left, right } => self.compile_binop(left, right, |b, a, c| b.ins().fdiv(a, c), |b, a, c| b.ins().sdiv(a, c)),
            Expr::Mod { left, right } => {
                // Modulo: convert to float if needed, then compute f % g = f - g * floor(f / g)
                let (a_val, a_float) = self.compile_numeric_expr(left)?;
                let (b_val, b_float) = self.compile_numeric_expr(right)?;
                let a_f = if a_float { a_val } else { self.builder.ins().fcvt_from_sint(types::F64, a_val) };
                let b_f = if b_float { b_val } else { self.builder.ins().fcvt_from_sint(types::F64, b_val) };
                let div = self.builder.ins().fdiv(a_f, b_f);
                let floored = self.builder.ins().floor(div);
                let prod = self.builder.ins().fmul(b_f, floored);
                Ok((self.builder.ins().fsub(a_f, prod), true))
            }

            Expr::Floor { operand } => {
                let (val, is_float) = self.compile_numeric_expr(operand)?;
                let float_val = if is_float { val } else { self.builder.ins().fcvt_from_sint(types::F64, val) };
                Ok((self.builder.ins().floor(float_val), true))
            }

            Expr::Ceil { operand } => {
                let (val, is_float) = self.compile_numeric_expr(operand)?;
                let float_val = if is_float { val } else { self.builder.ins().fcvt_from_sint(types::F64, val) };
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
                    let a_f = if a_float { a_val } else { self.builder.ins().fcvt_from_sint(types::F64, a_val) };
                    let b_f = if b_float { b_val } else { self.builder.ins().fcvt_from_sint(types::F64, b_val) };
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
                    let a_f = if a_float { a_val } else { self.builder.ins().fcvt_from_sint(types::F64, a_val) };
                    let b_f = if b_float { b_val } else { self.builder.ins().fcvt_from_sint(types::F64, b_val) };
                    Ok((self.builder.ins().fmax(a_f, b_f), true))
                } else {
                    let cmp = self.builder.ins().icmp(IntCC::SignedGreaterThan, a_val, b_val);
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

    fn load_bool_var(&mut self, var: &ResolvedVar) -> Result<Value> {
        // Talents are compile-time constants
        if let ResolvedVar::Talent(enabled) = var {
            return Ok(self.builder.ins().iconst(types::I8, if *enabled { 1 } else { 0 }));
        }

        let offset = self
            .schema
            .offset(var)
            .ok_or_else(|| Error::Compilation(format!("variable not in schema: {:?}", var)))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);
        let val = self.builder.ins().load(types::I8, MemFlags::trusted(), addr, 0);
        Ok(val)
    }

    fn load_numeric_var(&mut self, var: &ResolvedVar) -> Result<(Value, bool)> {
        let offset = self
            .schema
            .offset(var)
            .ok_or_else(|| Error::Compilation(format!("variable not in schema: {:?}", var)))?;
        let field_type = self
            .schema
            .field_type(var)
            .ok_or_else(|| Error::Compilation(format!("variable not in schema: {:?}", var)))?;

        let addr = self.builder.ins().iadd_imm(self.ctx_ptr, offset as i64);

        match field_type {
            FieldType::Bool => {
                let val = self.builder.ins().load(types::I8, MemFlags::trusted(), addr, 0);
                let extended = self.builder.ins().uextend(types::I32, val);
                Ok((extended, false))
            }
            FieldType::Int => {
                let val = self.builder.ins().load(types::I32, MemFlags::trusted(), addr, 0);
                Ok((val, false))
            }
            FieldType::Float => {
                let val = self.builder.ins().load(types::F64, MemFlags::trusted(), addr, 0);
                Ok((val, true))
            }
        }
    }
}

//! Cranelift JIT compiler for rotations.

use cranelift::prelude::*;
use cranelift::codegen::ir::BlockArg;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{Linkage, Module};

use super::ast::{Condition, Operand, Rotation, RotationNode, VarId};
use super::context::RotationContext;
use super::error::{Error, Result};

/// Function signature: fn(*const RotationContext) -> u32
type RotationFn = unsafe extern "C" fn(*const RotationContext) -> u32;

/// A Send+Sync wrapper for the function pointer.
#[derive(Clone, Copy)]
struct SyncFnPtr(RotationFn);

// SAFETY: The function pointer points to JIT-compiled code that only reads
// from the RotationContext passed to it. The underlying memory is leaked
// and remains valid for the lifetime of the program.
unsafe impl Send for SyncFnPtr {}
unsafe impl Sync for SyncFnPtr {}

/// A JIT-compiled rotation ready for execution.
///
/// This is safe to share between threads because:
/// - The JIT module memory is leaked (never deallocated)
/// - The function pointer only reads from the passed context
pub struct CompiledRotation {
    func_ptr: SyncFnPtr,
}

impl CompiledRotation {
    /// Compile a rotation to native code.
    pub fn compile(rotation: &Rotation) -> Result<Self> {
        let ast = rotation.to_ast();
        Self::compile_ast(&ast)
    }

    /// Compile a raw AST node.
    pub fn compile_ast(ast: &RotationNode) -> Result<Self> {
        let mut flag_builder = settings::builder();
        flag_builder.set("opt_level", "speed").map_err(|e| {
            Error::Compilation(format!("failed to set opt_level: {}", e))
        })?;
        let flags = settings::Flags::new(flag_builder);

        let isa = cranelift_native::builder()
            .map_err(|e| Error::Compilation(format!("failed to create ISA builder: {}", e)))?
            .finish(flags)
            .map_err(|e| Error::Compilation(format!("failed to finish ISA: {}", e)))?;

        let builder = JITBuilder::with_isa(isa, cranelift_module::default_libcall_names());
        let mut module = JITModule::new(builder);

        let ptr_ty = module.target_config().pointer_type();

        // Signature: fn(*const RotationContext) -> u32
        let mut sig = module.make_signature();
        sig.params.push(AbiParam::new(ptr_ty));
        sig.returns.push(AbiParam::new(types::I32));

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

            let result = compile_node(&mut builder, ast, ctx_ptr, ptr_ty)?;
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

        // Leak the module to keep the JIT memory alive forever.
        // This is intentional - rotations are compiled once at startup.
        Box::leak(Box::new(module));

        Ok(Self {
            func_ptr: SyncFnPtr(func_ptr),
        })
    }

    /// Execute the compiled rotation.
    #[inline]
    pub fn evaluate(&self, ctx: &RotationContext) -> u32 {
        unsafe { (self.func_ptr.0)(ctx as *const RotationContext) }
    }
}

fn compile_node(
    builder: &mut FunctionBuilder,
    node: &RotationNode,
    ctx_ptr: Value,
    ptr_ty: Type,
) -> Result<Value> {
    match node {
        RotationNode::Cast(spell_id) => {
            Ok(builder.ins().iconst(types::I32, *spell_id as i64))
        }
        RotationNode::Wait => Ok(builder.ins().iconst(types::I32, 0)),
        RotationNode::If { cond, then, else_ } => {
            let cond_val = compile_condition(builder, cond, ctx_ptr, ptr_ty)?;

            let then_block = builder.create_block();
            let else_block = builder.create_block();
            let merge_block = builder.create_block();
            builder.append_block_param(merge_block, types::I32);

            builder.ins().brif(cond_val, then_block, &[], else_block, &[]);

            builder.switch_to_block(then_block);
            builder.seal_block(then_block);
            let then_val = compile_node(builder, then, ctx_ptr, ptr_ty)?;
            let then_arg = BlockArg::from(then_val);
            builder.ins().jump(merge_block, &[then_arg]);

            builder.switch_to_block(else_block);
            builder.seal_block(else_block);
            let else_val = compile_node(builder, else_, ctx_ptr, ptr_ty)?;
            let else_arg = BlockArg::from(else_val);
            builder.ins().jump(merge_block, &[else_arg]);

            builder.switch_to_block(merge_block);
            builder.seal_block(merge_block);
            Ok(builder.block_params(merge_block)[0])
        }
    }
}

fn compile_condition(
    builder: &mut FunctionBuilder,
    cond: &Condition,
    ctx_ptr: Value,
    ptr_ty: Type,
) -> Result<Value> {
    match cond {
        Condition::And(a, b) => {
            let a_val = compile_condition(builder, a, ctx_ptr, ptr_ty)?;
            let b_val = compile_condition(builder, b, ctx_ptr, ptr_ty)?;
            Ok(builder.ins().band(a_val, b_val))
        }

        Condition::Or(a, b) => {
            let a_val = compile_condition(builder, a, ctx_ptr, ptr_ty)?;
            let b_val = compile_condition(builder, b, ctx_ptr, ptr_ty)?;
            Ok(builder.ins().bor(a_val, b_val))
        }

        Condition::Not(inner) => {
            let inner_val = compile_condition(builder, inner, ctx_ptr, ptr_ty)?;
            let one = builder.ins().iconst(types::I8, 1);
            Ok(builder.ins().bxor(inner_val, one))
        }

        Condition::Gte(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::GreaterThanOrEqual, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::SignedGreaterThanOrEqual, a_val, b_val))
            }
        }

        Condition::Gt(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::GreaterThan, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::SignedGreaterThan, a_val, b_val))
            }
        }

        Condition::Lte(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::LessThanOrEqual, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::SignedLessThanOrEqual, a_val, b_val))
            }
        }

        Condition::Lt(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::LessThan, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::SignedLessThan, a_val, b_val))
            }
        }

        Condition::Eq(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::Equal, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::Equal, a_val, b_val))
            }
        }

        Condition::Ne(a, b) => {
            let (a_val, b_val, is_float) = compile_operand_pair(builder, a, b, ctx_ptr, ptr_ty)?;
            if is_float {
                Ok(builder.ins().fcmp(FloatCC::NotEqual, a_val, b_val))
            } else {
                Ok(builder.ins().icmp(IntCC::NotEqual, a_val, b_val))
            }
        }

        Condition::Var(var_id) => {
            let val = load_var(builder, *var_id, ctx_ptr)?;
            Ok(builder.ins().icmp_imm(IntCC::NotEqual, val, 0))
        }

        Condition::Literal(b) => {
            Ok(builder.ins().iconst(types::I8, if *b { 1 } else { 0 }))
        }
    }
}

fn compile_operand_pair(
    builder: &mut FunctionBuilder,
    a: &Operand,
    b: &Operand,
    ctx_ptr: Value,
    _ptr_ty: Type,
) -> Result<(Value, Value, bool)> {
    let (a_val, a_float) = compile_operand(builder, a, ctx_ptr)?;
    let (b_val, b_float) = compile_operand(builder, b, ctx_ptr)?;

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

    Ok((a_val, b_val, is_float))
}

fn compile_operand(
    builder: &mut FunctionBuilder,
    op: &Operand,
    ctx_ptr: Value,
) -> Result<(Value, bool)> {
    match op {
        Operand::Float(f) => Ok((builder.ins().f64const(*f), true)),
        Operand::Int(i) => Ok((builder.ins().iconst(types::I32, *i as i64), false)),
        Operand::Var(var_id) => {
            let val = load_var(builder, *var_id, ctx_ptr)?;
            Ok((val, var_id.is_float()))
        }
    }
}

fn load_var(
    builder: &mut FunctionBuilder,
    var_id: VarId,
    ctx_ptr: Value,
) -> Result<Value> {
    let (offset, ty) = var_offset_and_type(var_id)?;
    let addr = builder.ins().iadd_imm(ctx_ptr, offset as i64);
    let flags = MemFlags::trusted();

    if ty == types::I8 {
        let val = builder.ins().load(types::I8, flags, addr, 0);
        Ok(builder.ins().uextend(types::I32, val))
    } else {
        Ok(builder.ins().load(ty, flags, addr, 0))
    }
}

fn var_offset_and_type(var_id: VarId) -> Result<(usize, Type)> {
    use std::mem::offset_of;

    match var_id {
        VarId::Focus => Ok((offset_of!(RotationContext, focus), types::F64)),
        VarId::FocusMax => Ok((offset_of!(RotationContext, focus_max), types::F64)),
        VarId::FocusDeficit => {
            Err(Error::Compilation("focus_deficit requires special handling".into()))
        }
        VarId::Time => Ok((offset_of!(RotationContext, time), types::F64)),
        VarId::GcdRemains => Ok((offset_of!(RotationContext, gcd_remains), types::F64)),
        VarId::TargetHealthPct => Ok((offset_of!(RotationContext, target_health_pct), types::F64)),
        VarId::TargetTimeToDie => Ok((offset_of!(RotationContext, target_time_to_die), types::F64)),
        VarId::TargetCount => Ok((offset_of!(RotationContext, target_count), types::I32)),

        // Cooldowns - slot-indexed arrays
        VarId::CooldownReady(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("cooldown slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, cd_ready);
            Ok((base + slot as usize, types::I8))
        }
        VarId::CooldownRemains(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("cooldown slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, cd_remains);
            Ok((base + (slot as usize) * 8, types::F64))
        }
        VarId::CooldownCharges(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("cooldown slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, cd_charges);
            Ok((base + (slot as usize) * 4, types::I32))
        }

        // Buffs - slot-indexed arrays
        VarId::BuffActive(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("buff slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, buff_active);
            Ok((base + slot as usize, types::I8))
        }
        VarId::BuffStacks(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("buff slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, buff_stacks);
            Ok((base + (slot as usize) * 4, types::I32))
        }
        VarId::BuffRemains(slot) => {
            if slot >= 16 {
                return Err(Error::Compilation(format!("buff slot {} out of range", slot)));
            }
            let base = offset_of!(RotationContext, buff_remains);
            Ok((base + (slot as usize) * 8, types::F64))
        }

        // Debuffs - for now, error (need to add to context)
        VarId::DebuffActive(_) | VarId::DebuffStacks(_) | VarId::DebuffRemains(_) => {
            Err(Error::Compilation("debuff vars not yet implemented".into()))
        }

        VarId::PetActive => Ok((offset_of!(RotationContext, pet_active), types::I8)),
    }
}

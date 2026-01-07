//! Custom bytecode VM for rotation evaluation
//!
//! A minimal register-based VM optimized for rotation logic.

use crate::{Action, SpellId, GameState};

/// Bytecode opcodes
#[repr(u8)]
#[derive(Clone, Copy, Debug)]
pub enum Op {
    /// Load float from state slot into register
    LoadFloat = 0,
    /// Load bool from state slot into flags
    LoadBool = 1,
    /// Load immediate float into register
    ImmFloat = 2,
    /// Compare register >= immediate, result in flags
    CmpGe = 3,
    /// Compare register <= immediate, result in flags
    CmpLe = 4,
    /// Compare register > immediate
    CmpGt = 5,
    /// Compare register < immediate
    CmpLt = 6,
    /// Logical AND with flags
    And = 7,
    /// Logical OR with flags
    Or = 8,
    /// Logical NOT
    Not = 9,
    /// Jump if flags false
    JumpIfFalse = 10,
    /// Unconditional jump
    Jump = 11,
    /// Return Cast action
    Cast = 12,
    /// Return WaitGcd action
    WaitGcd = 13,
    /// Halt (return None)
    Halt = 14,
}

/// State slot indices
#[repr(u8)]
#[derive(Clone, Copy)]
pub enum Slot {
    Focus = 0,
    FocusMax = 1,
    TargetHealthPct = 2,
    BestialWrathReady = 3,
    KillCommandReady = 4,
    BarbedShotCharges = 5,
    FrenzyRemaining = 6,
    FrenzyActive = 7,
    DireBeastReady = 8,
}

/// Compiled bytecode rotation
pub struct BytecodeRotation {
    code: Vec<u8>,
    constants: Vec<f32>,
}

/// VM execution state
pub struct VM {
    registers: [f32; 8],
    flags: bool,
    ip: usize,
}

impl BytecodeRotation {
    /// Create BM Hunter rotation bytecode
    pub fn bm_hunter() -> Self {
        let mut compiler = BytecodeCompiler::new();

        // if bestial_wrath_ready { cast(bestial_wrath) }
        compiler.load_bool(Slot::BestialWrathReady);
        let j1 = compiler.jump_if_false(0);
        compiler.cast(SpellId::BESTIAL_WRATH);

        // else if kill_command_ready && focus >= 30.0 { cast(kill_command) }
        compiler.patch_jump(j1);
        compiler.load_bool(Slot::KillCommandReady);
        let j2 = compiler.jump_if_false(0);
        compiler.load_float(Slot::Focus);
        compiler.cmp_ge(30.0);
        let j3 = compiler.jump_if_false(0);
        compiler.cast(SpellId::KILL_COMMAND);

        // else if barbed_shot_charges >= 1 && (frenzy_remaining <= 2.0 || !frenzy_active)
        compiler.patch_jump(j2);
        compiler.patch_jump(j3);
        compiler.load_float(Slot::BarbedShotCharges);
        compiler.cmp_ge(1.0);
        let j4 = compiler.jump_if_false(0);
        // Check frenzy condition
        compiler.load_float(Slot::FrenzyRemaining);
        compiler.cmp_le(2.0);
        let j5 = compiler.jump_if_false(0);
        compiler.cast(SpellId::BARBED_SHOT);
        compiler.patch_jump(j5);
        compiler.load_bool(Slot::FrenzyActive);
        compiler.not();
        let j6 = compiler.jump_if_false(0);
        compiler.cast(SpellId::BARBED_SHOT);

        // else if barbed_shot_charges >= 2
        compiler.patch_jump(j4);
        compiler.patch_jump(j6);
        compiler.load_float(Slot::BarbedShotCharges);
        compiler.cmp_ge(2.0);
        let j7 = compiler.jump_if_false(0);
        compiler.cast(SpellId::BARBED_SHOT);

        // else if dire_beast_ready
        compiler.patch_jump(j7);
        compiler.load_bool(Slot::DireBeastReady);
        let j8 = compiler.jump_if_false(0);
        compiler.cast(SpellId::DIRE_BEAST);

        // else if focus >= 50.0
        compiler.patch_jump(j8);
        compiler.load_float(Slot::Focus);
        compiler.cmp_ge(50.0);
        let j9 = compiler.jump_if_false(0);
        compiler.cast(SpellId::COBRA_SHOT);

        // else wait_gcd
        compiler.patch_jump(j9);
        compiler.wait_gcd();

        compiler.finish()
    }

    /// Execute bytecode against state
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        let mut vm = VM::new();
        let state_slots = self.prepare_state(state);

        loop {
            if vm.ip >= self.code.len() {
                return Action::None;
            }

            let op = self.code[vm.ip];
            vm.ip += 1;

            match op {
                0 => { // LoadFloat
                    let slot = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.registers[0] = state_slots[slot];
                }
                1 => { // LoadBool
                    let slot = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = state_slots[slot] != 0.0;
                }
                2 => { // ImmFloat
                    let idx = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.registers[0] = self.constants[idx];
                }
                3 => { // CmpGe
                    let idx = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.registers[0] >= self.constants[idx];
                }
                4 => { // CmpLe
                    let idx = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.registers[0] <= self.constants[idx];
                }
                5 => { // CmpGt
                    let idx = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.registers[0] > self.constants[idx];
                }
                6 => { // CmpLt
                    let idx = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.registers[0] < self.constants[idx];
                }
                7 => { // And
                    let slot = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.flags && state_slots[slot] != 0.0;
                }
                8 => { // Or
                    let slot = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.flags = vm.flags || state_slots[slot] != 0.0;
                }
                9 => { // Not
                    vm.flags = !vm.flags;
                }
                10 => { // JumpIfFalse
                    let offset = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    if !vm.flags {
                        vm.ip = offset;
                    }
                }
                11 => { // Jump
                    let offset = self.code[vm.ip] as usize;
                    vm.ip += 1;
                    vm.ip = offset;
                }
                12 => { // Cast
                    let spell_id = self.code[vm.ip] as u16;
                    return Action::Cast(SpellId(spell_id));
                }
                13 => { // WaitGcd
                    return Action::WaitGcd;
                }
                14 => { // Halt
                    return Action::None;
                }
                _ => return Action::None,
            }
        }
    }

    #[inline]
    fn prepare_state(&self, state: &GameState) -> [f32; 16] {
        [
            state.focus,                                                    // 0: Focus
            state.focus_max,                                                // 1: FocusMax
            state.target_health_pct,                                        // 2: TargetHealthPct
            if state.cooldown_ready(SpellId::BESTIAL_WRATH) { 1.0 } else { 0.0 }, // 3
            if state.cooldown_ready(SpellId::KILL_COMMAND) { 1.0 } else { 0.0 },  // 4
            state.charge_count(SpellId::BARBED_SHOT) as f32,               // 5
            state.aura_remaining(crate::AuraId::FRENZY),                   // 6
            if state.aura_active(crate::AuraId::FRENZY) { 1.0 } else { 0.0 }, // 7
            if state.cooldown_ready(SpellId::DIRE_BEAST) { 1.0 } else { 0.0 }, // 8
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        ]
    }
}

impl VM {
    fn new() -> Self {
        Self {
            registers: [0.0; 8],
            flags: false,
            ip: 0,
        }
    }
}

/// Bytecode compiler helper
struct BytecodeCompiler {
    code: Vec<u8>,
    constants: Vec<f32>,
}

impl BytecodeCompiler {
    fn new() -> Self {
        Self {
            code: Vec::new(),
            constants: Vec::new(),
        }
    }

    fn load_float(&mut self, slot: Slot) {
        self.code.push(Op::LoadFloat as u8);
        self.code.push(slot as u8);
    }

    fn load_bool(&mut self, slot: Slot) {
        self.code.push(Op::LoadBool as u8);
        self.code.push(slot as u8);
    }

    fn cmp_ge(&mut self, value: f32) {
        let idx = self.add_constant(value);
        self.code.push(Op::CmpGe as u8);
        self.code.push(idx as u8);
    }

    fn cmp_le(&mut self, value: f32) {
        let idx = self.add_constant(value);
        self.code.push(Op::CmpLe as u8);
        self.code.push(idx as u8);
    }

    fn not(&mut self) {
        self.code.push(Op::Not as u8);
    }

    fn jump_if_false(&mut self, _target: usize) -> usize {
        let pos = self.code.len();
        self.code.push(Op::JumpIfFalse as u8);
        self.code.push(0); // placeholder
        pos + 1 // return position of the offset byte
    }

    fn patch_jump(&mut self, offset_pos: usize) {
        self.code[offset_pos] = self.code.len() as u8;
    }

    fn cast(&mut self, spell: SpellId) {
        self.code.push(Op::Cast as u8);
        self.code.push(spell.0 as u8);
    }

    fn wait_gcd(&mut self) {
        self.code.push(Op::WaitGcd as u8);
    }

    fn add_constant(&mut self, value: f32) -> usize {
        // Check if constant already exists
        for (i, &c) in self.constants.iter().enumerate() {
            if (c - value).abs() < f32::EPSILON {
                return i;
            }
        }
        let idx = self.constants.len();
        self.constants.push(value);
        idx
    }

    fn finish(self) -> BytecodeRotation {
        BytecodeRotation {
            code: self.code,
            constants: self.constants,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bytecode_vm() {
        let rotation = BytecodeRotation::bm_hunter();
        let state = GameState::new();
        let action = rotation.evaluate(&state);
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }
}

//! WASM rotation script engine using wasmtime.

use wasmtime::{Caller, Engine, Linker, Module, Store, TypedFunc};

use crate::config::SimConfig;
use crate::sim::SimState;
use crate::EngineError;

/// State accessible to host functions during script execution.
struct ScriptState {
    // Pointers to sim state (set before each call)
    time: u32,
    duration: u32,
    resource: f32,
    resource_max: f32,
    gcd_ready: u32,
    spell_count: u32,
    // Spell states (cooldown_ready, charges) - flat arrays for simplicity
    spell_cooldown_ready: Vec<u32>,
    spell_charges: Vec<u8>,
    spell_cost: Vec<f32>,
    // Aura states
    aura_expires: Vec<u32>,
    aura_stacks: Vec<u8>,
}

impl ScriptState {
    fn new(config: &SimConfig) -> Self {
        let spell_count = config.spells.len();
        let aura_count = config.auras.len();
        Self {
            time: 0,
            duration: 0,
            resource: 0.0,
            resource_max: 0.0,
            gcd_ready: 0,
            spell_count: spell_count as u32,
            spell_cooldown_ready: vec![0; spell_count],
            spell_charges: vec![0; spell_count],
            spell_cost: config.spells.iter().map(|s| s.cost.amount).collect(),
            aura_expires: vec![0; aura_count],
            aura_stacks: vec![0; aura_count],
        }
    }

    fn sync_from_sim(&mut self, state: &SimState) {
        self.time = state.time;
        self.duration = state.duration;
        self.resource = state.player.resources.current;
        self.resource_max = state.player.resources.max;
        self.gcd_ready = state.player.gcd_ready;

        for (i, spell_state) in state.player.spell_states.iter().enumerate() {
            self.spell_cooldown_ready[i] = spell_state.cooldown_ready;
            self.spell_charges[i] = spell_state.charges;
        }

        for i in 0..self.aura_expires.len() {
            if let Some(aura) = state.player.auras.get_slot(i) {
                self.aura_expires[i] = aura.expires;
                self.aura_stacks[i] = aura.stacks;
            } else {
                self.aura_expires[i] = 0;
                self.aura_stacks[i] = 0;
            }
        }
    }
}

/// WASM rotation script runtime.
pub struct RotationScript {
    store: Store<ScriptState>,
    get_next_action: TypedFunc<(), i32>,
}

impl RotationScript {
    pub fn new(wasm_bytes: &[u8], config: &SimConfig) -> Result<Self, EngineError> {
        let engine = Engine::default();
        let module = Module::new(&engine, wasm_bytes)?;

        let mut linker: Linker<ScriptState> = Linker::new(&engine);

        // Host functions the rotation script can call
        linker.func_wrap("env", "time", |caller: Caller<'_, ScriptState>| -> u32 {
            caller.data().time
        })?;

        linker.func_wrap("env", "duration", |caller: Caller<'_, ScriptState>| -> u32 {
            caller.data().duration
        })?;

        linker.func_wrap("env", "resource", |caller: Caller<'_, ScriptState>| -> f32 {
            caller.data().resource
        })?;

        linker.func_wrap("env", "resource_max", |caller: Caller<'_, ScriptState>| -> f32 {
            caller.data().resource_max
        })?;

        linker.func_wrap("env", "gcd_ready", |caller: Caller<'_, ScriptState>| -> i32 {
            if caller.data().gcd_ready <= caller.data().time { 1 } else { 0 }
        })?;

        linker.func_wrap("env", "spell_count", |caller: Caller<'_, ScriptState>| -> u32 {
            caller.data().spell_count
        })?;

        linker.func_wrap("env", "spell_ready", |caller: Caller<'_, ScriptState>, idx: u32| -> i32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.spell_cooldown_ready.len() {
                return 0;
            }
            let cd_ready = data.spell_charges[i] > 0 || data.spell_cooldown_ready[i] <= data.time;
            let has_resource = data.resource >= data.spell_cost[i];
            if cd_ready && has_resource { 1 } else { 0 }
        })?;

        linker.func_wrap("env", "spell_cooldown", |caller: Caller<'_, ScriptState>, idx: u32| -> u32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.spell_cooldown_ready.len() {
                return u32::MAX;
            }
            data.spell_cooldown_ready[i].saturating_sub(data.time)
        })?;

        linker.func_wrap("env", "spell_charges", |caller: Caller<'_, ScriptState>, idx: u32| -> u32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.spell_charges.len() {
                return 0;
            }
            data.spell_charges[i] as u32
        })?;

        linker.func_wrap("env", "aura_active", |caller: Caller<'_, ScriptState>, idx: u32| -> i32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.aura_expires.len() {
                return 0;
            }
            if data.aura_expires[i] > data.time { 1 } else { 0 }
        })?;

        linker.func_wrap("env", "aura_stacks", |caller: Caller<'_, ScriptState>, idx: u32| -> u32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.aura_stacks.len() {
                return 0;
            }
            if data.aura_expires[i] > data.time {
                data.aura_stacks[i] as u32
            } else {
                0
            }
        })?;

        linker.func_wrap("env", "aura_remaining", |caller: Caller<'_, ScriptState>, idx: u32| -> u32 {
            let data = caller.data();
            let i = idx as usize;
            if i >= data.aura_expires.len() {
                return 0;
            }
            data.aura_expires[i].saturating_sub(data.time)
        })?;

        let state = ScriptState::new(config);
        let mut store = Store::new(&engine, state);

        let instance = linker.instantiate(&mut store, &module)?;
        let get_next_action = instance.get_typed_func::<(), i32>(&mut store, "get_next_action")?;

        Ok(Self {
            store,
            get_next_action,
        })
    }

    /// Call the rotation script and return the next spell index to cast.
    /// Returns None if the script returns -1 (wait).
    #[inline]
    pub fn get_next_action(&mut self, state: &SimState) -> Option<usize> {
        // Sync state from simulation
        self.store.data_mut().sync_from_sim(state);

        // Call the WASM function
        match self.get_next_action.call(&mut self.store, ()) {
            Ok(idx) if idx >= 0 => Some(idx as usize),
            _ => None,
        }
    }
}

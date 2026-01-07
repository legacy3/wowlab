# Decision Tree / State Machine Alternatives to Rhai Scripting

This document analyzes alternative approaches to Rhai scripting for rotation logic in the WoW simulation engine. The goal is to find a solution that maintains flexibility while dramatically improving performance.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Decision Tree Approach](#decision-tree-approach)
3. [State Machine Approaches](#state-machine-approaches)
4. [Binary Decision Diagrams (BDDs)](#binary-decision-diagrams-bdds)
5. [Compiling If/Else to Lookup Tables](#compiling-ifelse-to-lookup-tables)
6. [Cache-Friendly Memory Layouts](#cache-friendly-memory-layouts)
7. [Industry Approaches](#industry-approaches)
8. [Tradeoffs vs Scripting](#tradeoffs-vs-scripting)
9. [Recommended Architecture](#recommended-architecture)
10. [Implementation Plan](#implementation-plan)

---

## Problem Statement

### Current State (Rhai)

The current Rhai-based rotation system has these performance characteristics:

| Operation | Time |
|-----------|------|
| `optimize_partial()` | ~12 us |
| `optimize_from_partial()` | ~2 us |
| Cached evaluation | ~0.05 us |
| Plain Rhai eval | ~1.6 us |

Even with aggressive optimization (AST folding, method caching), we're still paying:
- **Script interpretation overhead** on every state change
- **Dynamic dispatch** through Rhai's type system
- **Memory indirection** through `Dynamic` values
- **Hash lookups** for variable resolution

### Target Performance

For a high-throughput simulation running millions of iterations:
- **Decision time**: < 50 ns (20x improvement)
- **Memory access**: Single cache line per decision
- **Branch prediction**: Predictable patterns

---

## Decision Tree Approach

### Concept

A decision tree is a directed acyclic graph where:
- **Internal nodes** are conditions (predicates)
- **Edges** represent true/false outcomes
- **Leaf nodes** are actions (spells to cast)

```
                    ┌─────────────────────┐
                    │ focus >= 30?        │
                    └─────────┬───────────┘
                       yes    │    no
                    ┌─────────┴───────────┐
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │ kill_cmd_rdy? │     │ wait_gcd      │
            └───────┬───────┘     └───────────────┘
               yes  │  no
            ┌───────┴───────┐
            │               │
    ┌───────▼───────┐   ┌───▼───────────────┐
    │ cast(kill_cmd)│   │ barbed_shot_chg?  │
    └───────────────┘   └───────┬───────────┘
                           yes  │  no
                        ┌───────┴───────┐
                        │               │
                ┌───────▼───────┐   ┌───▼───────┐
                │cast(barb_shot)│   │ wait_gcd  │
                └───────────────┘   └───────────┘
```

### Data Structure

```rust
/// Compact decision tree node (16 bytes)
#[repr(C)]
pub struct DecisionNode {
    /// Condition to evaluate (index into condition array)
    condition_idx: u16,
    /// Index of true branch (node or action)
    true_branch: u16,
    /// Index of false branch (node or action)
    false_branch: u16,
    /// Flags: is_leaf, branch_type, etc.
    flags: u16,
    /// Padding for alignment
    _pad: [u8; 8],
}

/// Precomputed condition (evaluated once per tick)
#[repr(C)]
pub struct Condition {
    /// Condition type
    kind: ConditionKind,
    /// First operand (state slot index)
    operand_a: u16,
    /// Second operand (immediate value or slot index)
    operand_b: u16,
    /// Comparison operator
    op: CompareOp,
}

#[repr(u8)]
pub enum ConditionKind {
    /// Compare float: state[a] op immediate
    FloatImm,
    /// Compare float: state[a] op state[b]
    FloatSlot,
    /// Check boolean: state[a] is true
    BoolTrue,
    /// Check boolean: state[a] is false
    BoolFalse,
    /// Always true (unconditional branch)
    Always,
}

#[repr(u8)]
pub enum CompareOp {
    Less,
    LessEq,
    Greater,
    GreaterEq,
    Equal,
    NotEqual,
}
```

### Traversal Algorithm

```rust
impl DecisionTree {
    /// Evaluate the tree and return an action.
    /// All conditions are pre-evaluated into a bitset.
    #[inline]
    pub fn evaluate(&self, condition_results: &BitVec) -> SpellIdx {
        let mut node_idx = 0u16;

        loop {
            let node = &self.nodes[node_idx as usize];

            if node.is_leaf() {
                return node.action();
            }

            let condition_met = condition_results[node.condition_idx as usize];
            node_idx = if condition_met {
                node.true_branch
            } else {
                node.false_branch
            };
        }
    }
}
```

### Pre-evaluating Conditions

The key optimization is evaluating all conditions **once** at the start of each tick:

```rust
/// Compact game state for condition evaluation
#[repr(C)]
pub struct GameState {
    // Resources (8 floats = 64 bytes, 1 cache line)
    focus: f32,
    focus_deficit: f32,
    mana: f32,
    rage: f32,
    energy: f32,
    combo_points: f32,
    soul_shards: f32,
    holy_power: f32,

    // Target state (4 floats = 16 bytes)
    target_health_pct: f32,
    target_time_to_die: f32,
    targets_in_range: f32,
    _pad1: f32,

    // Cooldown remaining (packed, 32 spells = 128 bytes)
    cooldown_remaining: [f32; 32],

    // Aura remaining (packed, 32 auras = 128 bytes)
    aura_remaining: [f32; 32],

    // Aura stacks (packed, 32 auras = 32 bytes)
    aura_stacks: [u8; 32],

    // Boolean flags (talents, config) - 8 bytes = 64 bits
    flags: u64,
}

impl GameState {
    /// Evaluate all conditions and return results as a bitset.
    #[inline]
    pub fn evaluate_conditions(&self, conditions: &[Condition]) -> BitVec {
        let mut results = BitVec::with_capacity(conditions.len());

        for cond in conditions {
            let result = match cond.kind {
                ConditionKind::FloatImm => {
                    let a = self.get_float(cond.operand_a);
                    let b = f32::from_bits(cond.operand_b as u32);
                    cond.op.compare(a, b)
                }
                ConditionKind::FloatSlot => {
                    let a = self.get_float(cond.operand_a);
                    let b = self.get_float(cond.operand_b);
                    cond.op.compare(a, b)
                }
                ConditionKind::BoolTrue => {
                    self.get_flag(cond.operand_a)
                }
                ConditionKind::BoolFalse => {
                    !self.get_flag(cond.operand_a)
                }
                ConditionKind::Always => true,
            };
            results.push(result);
        }

        results
    }
}
```

### Advantages

1. **Minimal branching**: Tree traversal is a tight loop
2. **Predictable memory access**: Nodes are contiguous in memory
3. **No dynamic dispatch**: All types are concrete
4. **SIMD-friendly**: Condition evaluation can be vectorized
5. **Compilation**: Trees can be optimized at compile time

### Disadvantages

1. **Static structure**: Trees must be rebuilt for talent changes
2. **Limited expressiveness**: Complex conditions need decomposition
3. **Size explosion**: Deep nesting creates large trees

---

## State Machine Approaches

### Finite State Machine (FSM)

FSMs model rotation phases explicitly:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────┐    cooldowns_ready    ┌──────────┐                │
│  │  IDLE   │ ────────────────────► │  BURST   │                │
│  └────┬────┘                       └────┬─────┘                │
│       │                                 │                       │
│       │ focus < 30                      │ burst_over            │
│       ▼                                 ▼                       │
│  ┌─────────┐                       ┌──────────┐                │
│  │  POOL   │ ◄──────────────────── │ SUSTAIN  │                │
│  └─────────┘    focus >= 80        └──────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```rust
#[repr(u8)]
pub enum RotationPhase {
    Idle,
    Opener,
    Burst,
    Sustain,
    Pool,
    Execute,
    AoE,
}

pub struct StateMachine {
    current_state: RotationPhase,
    /// Transition table: (current_state, condition) -> next_state
    transitions: Vec<Transition>,
    /// Action table: state -> decision_tree
    action_trees: [DecisionTree; 8],
}

impl StateMachine {
    pub fn tick(&mut self, state: &GameState) -> SpellIdx {
        // Check transitions
        for trans in &self.transitions {
            if trans.from == self.current_state && trans.condition.evaluate(state) {
                self.current_state = trans.to;
                break;
            }
        }

        // Get action from current state's tree
        let tree = &self.action_trees[self.current_state as usize];
        let conditions = state.evaluate_conditions(&tree.conditions);
        tree.evaluate(&conditions)
    }
}
```

### Hierarchical State Machine (HSM)

HSMs add nested states for complex behaviors:

```
┌─────────────────────────────────────────────────────────────┐
│ COMBAT                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SINGLE_TARGET                                       │   │
│  │  ┌───────────┐    ┌───────────┐    ┌───────────┐   │   │
│  │  │  OPENER   │───►│   BURST   │───►│  SUSTAIN  │   │   │
│  │  └───────────┘    └───────────┘    └───────────┘   │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │ targets > 3                   │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AOE                                                 │   │
│  │  ┌───────────┐    ┌───────────┐                    │   │
│  │  │ AOE_BURST │───►│ AOE_SUST  │                    │   │
│  │  └───────────┘    └───────────┘                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

```rust
pub struct HierarchicalState {
    /// Stack of active states (innermost last)
    state_stack: SmallVec<[StateId; 4]>,
    /// State definitions
    states: Vec<StateDefinition>,
}

pub struct StateDefinition {
    id: StateId,
    parent: Option<StateId>,
    action_tree: DecisionTree,
    transitions: Vec<Transition>,
    entry_action: Option<SpellIdx>,
    exit_action: Option<SpellIdx>,
}
```

### Pushdown Automaton

For handling sequences (like opener rotations):

```rust
pub struct PushdownAutomaton {
    /// Current state
    state: StateId,
    /// Stack for nested sequences
    stack: SmallVec<[StackFrame; 8]>,
    /// State definitions
    states: Vec<PDAState>,
}

pub struct StackFrame {
    return_state: StateId,
    sequence_position: u8,
}

impl PushdownAutomaton {
    pub fn tick(&mut self, state: &GameState) -> SpellIdx {
        let current = &self.states[self.state.0 as usize];

        match current.kind {
            StateKind::Decision(ref tree) => {
                let conditions = state.evaluate_conditions(&tree.conditions);
                tree.evaluate(&conditions)
            }
            StateKind::Sequence(ref seq) => {
                if let Some(frame) = self.stack.last_mut() {
                    let action = seq.actions[frame.sequence_position as usize];
                    frame.sequence_position += 1;
                    if frame.sequence_position >= seq.actions.len() as u8 {
                        self.stack.pop();
                    }
                    action
                } else {
                    SpellIdx::NONE
                }
            }
            StateKind::Call(target) => {
                self.stack.push(StackFrame {
                    return_state: self.state,
                    sequence_position: 0,
                });
                self.state = target;
                self.tick(state) // recurse
            }
        }
    }
}
```

---

## Binary Decision Diagrams (BDDs)

### Concept

BDDs are a canonical form for representing boolean functions. They can dramatically compress decision logic by sharing common subexpressions.

```
Original if/else tree:              Reduced BDD:

if A && B { X }                        A
else if A && C { Y }                  / \
else if B { Z }                      0   B
else { W }                              / \
                                       C   X
                                      / \
                                     Y   Z

(nodes for W omitted)
```

### Application to Rotations

Many rotation conditions share subexpressions:

```
// These conditions share "focus >= 30" and "kill_command.ready()"
if focus >= 30 && kill_command.ready() && bestial_wrath.active() { ... }
if focus >= 30 && kill_command.ready() && !bestial_wrath.active() { ... }
if focus >= 30 && !kill_command.ready() { ... }
```

A BDD can share the common prefix:

```
                focus >= 30?
                    │
           ┌───────┴───────┐
           │ yes           │ no
           ▼               ▼
    kill_cmd.ready?    [action D]
           │
    ┌──────┴──────┐
    │ yes         │ no
    ▼             ▼
bestial_wrath?  [action C]
    │
┌───┴───┐
│ yes   │ no
▼       ▼
[A]     [B]
```

### BDD Data Structure

```rust
/// BDD node - compact representation
#[repr(C)]
pub struct BddNode {
    /// Variable index for this decision
    var: u16,
    /// Low (false) branch - node index or terminal
    low: u16,
    /// High (true) branch - node index or terminal
    high: u16,
    /// Reserved
    _pad: u16,
}

/// BDD with action terminals
pub struct RotationBdd {
    /// Nodes (index 0 = root)
    nodes: Vec<BddNode>,
    /// Terminal actions (index 0 = none)
    terminals: Vec<SpellIdx>,
    /// Variable ordering
    var_order: Vec<ConditionId>,
}

impl RotationBdd {
    /// Evaluate BDD given variable assignments
    #[inline]
    pub fn evaluate(&self, vars: &BitVec) -> SpellIdx {
        let mut node_idx = 0u16;

        loop {
            let node = &self.nodes[node_idx as usize];

            // Check if terminal (var == 0xFFFF)
            if node.var == 0xFFFF {
                return self.terminals[node.low as usize];
            }

            // Follow appropriate branch
            node_idx = if vars[node.var as usize] {
                node.high
            } else {
                node.low
            };
        }
    }
}
```

### BDD Construction

```rust
/// Build a BDD from a rotation script AST
pub fn build_bdd(ast: &RotationAst, var_order: &[ConditionId]) -> RotationBdd {
    let mut builder = BddBuilder::new(var_order);

    // Convert each if/else branch to a BDD path
    for (conditions, action) in ast.branches() {
        let path_bdd = builder.build_path(&conditions);
        let action_terminal = builder.add_terminal(action);
        builder.add_rule(path_bdd, action_terminal);
    }

    // Reduce and canonicalize
    builder.reduce()
}

/// Variable ordering heuristic for minimal BDD size
pub fn compute_var_order(ast: &RotationAst) -> Vec<ConditionId> {
    // Use SIFT algorithm or simple heuristics:
    // 1. Most frequently used conditions first
    // 2. Conditions with most dependencies together
    // 3. Cooldown checks before resource checks

    let mut freq: HashMap<ConditionId, usize> = HashMap::new();
    for branch in ast.branches() {
        for cond in &branch.conditions {
            *freq.entry(cond.id).or_default() += 1;
        }
    }

    let mut vars: Vec<_> = freq.keys().copied().collect();
    vars.sort_by_key(|v| std::cmp::Reverse(freq[v]));
    vars
}
```

### BDD Limitations

1. **Variable ordering sensitivity**: Poor ordering can cause exponential blowup
2. **Numeric conditions**: BDDs work best with boolean variables
3. **Dynamic thresholds**: `focus >= X` where X varies requires preprocessing
4. **Construction cost**: Building optimal BDDs is NP-hard

### Hybrid Approach: BDD + Decision Tree

Use BDDs for boolean conditions, decision trees for numeric:

```rust
pub struct HybridDecision {
    /// BDD for boolean conditions (cooldowns ready, auras active)
    bool_bdd: RotationBdd,
    /// Decision trees for numeric conditions, indexed by BDD terminal
    numeric_trees: Vec<DecisionTree>,
}

impl HybridDecision {
    pub fn evaluate(&self, state: &GameState) -> SpellIdx {
        // Evaluate boolean conditions once
        let bool_results = state.evaluate_bool_conditions();

        // Traverse BDD to find applicable numeric tree
        let tree_idx = self.bool_bdd.evaluate(&bool_results);

        // Evaluate numeric tree
        let tree = &self.numeric_trees[tree_idx as usize];
        let num_results = state.evaluate_numeric_conditions(&tree.conditions);
        tree.evaluate(&num_results)
    }
}
```

---

## Compiling If/Else to Lookup Tables

### Concept

When conditions are discrete and bounded, the entire decision space can be precomputed into a lookup table.

### Discretization

Convert continuous values to discrete buckets:

```rust
/// Discretize focus into 5 levels
fn discretize_focus(focus: f32, max_focus: f32) -> u8 {
    let ratio = focus / max_focus;
    match ratio {
        r if r < 0.2 => 0,  // Very low
        r if r < 0.4 => 1,  // Low
        r if r < 0.6 => 2,  // Medium
        r if r < 0.8 => 3,  // High
        _ => 4,             // Full
    }
}

/// Discretize time remaining into 4 levels
fn discretize_duration(remaining: f32) -> u8 {
    match remaining {
        r if r <= 0.0 => 0,  // Expired
        r if r < 3.0 => 1,   // Expiring soon
        r if r < 10.0 => 2,  // Active
        _ => 3,              // Long duration
    }
}
```

### Lookup Table Structure

```rust
/// Precomputed action lookup table
pub struct ActionLookupTable {
    /// Flattened N-dimensional array of actions
    table: Vec<SpellIdx>,
    /// Dimensions (one per discretized variable)
    dimensions: Vec<usize>,
    /// Stride for each dimension
    strides: Vec<usize>,
}

impl ActionLookupTable {
    /// Build from decision tree
    pub fn from_tree(tree: &DecisionTree, discretization: &Discretization) -> Self {
        let dimensions: Vec<usize> = discretization.levels.clone();
        let total_size: usize = dimensions.iter().product();

        // Compute strides
        let mut strides = vec![1usize; dimensions.len()];
        for i in (0..dimensions.len() - 1).rev() {
            strides[i] = strides[i + 1] * dimensions[i + 1];
        }

        // Enumerate all states
        let mut table = vec![SpellIdx::NONE; total_size];
        for idx in 0..total_size {
            let discrete_state = index_to_state(idx, &dimensions);
            let continuous_state = discretization.to_continuous(&discrete_state);
            table[idx] = tree.evaluate_with_state(&continuous_state);
        }

        Self { table, dimensions, strides }
    }

    /// O(1) lookup
    #[inline]
    pub fn lookup(&self, discrete_state: &[u8]) -> SpellIdx {
        let mut idx = 0;
        for (i, &level) in discrete_state.iter().enumerate() {
            idx += (level as usize) * self.strides[i];
        }
        self.table[idx]
    }
}
```

### Example: BM Hunter Discretization

```rust
pub struct BmHunterState {
    // 5 levels each = 5^3 = 125 combinations
    focus_level: u8,           // 0-4: focus buckets
    frenzy_stacks: u8,         // 0-3: 0, 1, 2, 3+
    barbed_charges: u8,        // 0-2: 0, 1, 2

    // Binary flags = 2^5 = 32 combinations
    kill_command_ready: bool,
    bestial_wrath_ready: bool,
    bestial_wrath_active: bool,
    call_wild_ready: bool,
    execute_phase: bool,
}

// Total: 125 * 32 = 4,000 entries
// At 2 bytes per SpellIdx = 8 KB table
// Fits in L1 cache!
```

### Hybrid: Hot Path Lookup + Cold Path Tree

```rust
pub struct HybridRotation {
    /// Fast lookup for common states
    hot_table: ActionLookupTable,
    /// Decision tree for edge cases
    cold_tree: DecisionTree,
    /// Bitmap of which table entries are valid
    hot_valid: BitVec,
}

impl HybridRotation {
    pub fn evaluate(&self, state: &GameState) -> SpellIdx {
        let discrete = state.discretize();
        let idx = self.hot_table.compute_index(&discrete);

        if self.hot_valid[idx] {
            // Hot path: direct lookup
            self.hot_table.table[idx]
        } else {
            // Cold path: full tree evaluation
            let conditions = state.evaluate_conditions(&self.cold_tree.conditions);
            self.cold_tree.evaluate(&conditions)
        }
    }
}
```

---

## Cache-Friendly Memory Layouts

### Principles

1. **Data locality**: Keep related data together
2. **Structure of Arrays (SoA)**: Split structures for vectorization
3. **Alignment**: Align to cache line boundaries (64 bytes)
4. **Prefetching**: Predict and prefetch next accesses

### Array of Structures (AoS) vs Structure of Arrays (SoA)

```rust
// AoS: Bad for cache when iterating over single field
struct CooldownAoS {
    spell_id: SpellIdx,
    remaining: f32,
    charges: u8,
    max_charges: u8,
}
type CooldownsAoS = Vec<CooldownAoS>;

// SoA: Good for cache when iterating over single field
struct CooldownsSoA {
    spell_ids: Vec<SpellIdx>,
    remaining: Vec<f32>,
    charges: Vec<u8>,
    max_charges: Vec<u8>,
}

// When checking "which cooldowns are ready?":
// AoS: Load 8 bytes, use 4, waste 4
// SoA: Load 4 bytes, use 4, waste 0
```

### Cache-Aligned Game State

```rust
/// Game state optimized for cache access
#[repr(C, align(64))]
pub struct CacheAlignedState {
    // === Cache line 1: Resources (64 bytes) ===
    resources: ResourceBlock,

    // === Cache line 2-3: Cooldown remaining (64 floats) ===
    cooldown_remaining: [f32; 64],

    // === Cache line 4-5: Aura remaining (64 floats) ===
    aura_remaining: [f32; 64],

    // === Cache line 6: Aura stacks + flags ===
    aura_stacks: [u8; 32],
    flags: u64,
    target_health_pct: f32,
    target_time_to_die: f32,
    targets_in_range: u8,
    _pad: [u8; 15],
}

#[repr(C)]
pub struct ResourceBlock {
    primary: f32,      // Focus/Mana/etc
    secondary: f32,    // Combo points/Soul shards/etc
    tertiary: f32,     // Holy power/Runes/etc
    deficit: f32,      // Primary deficit
    max_primary: f32,
    max_secondary: f32,
    regen_rate: f32,
    _pad: f32,
}
```

### Decision Tree Node Layout

```rust
/// Cache-line aligned decision tree
pub struct CacheOptimizedTree {
    /// Nodes packed into cache lines (4 nodes per line)
    nodes: Vec<PackedNodes>,
    /// Conditions (separate to avoid cache pollution)
    conditions: Vec<Condition>,
    /// Actions at leaves
    actions: Vec<SpellIdx>,
}

/// 4 nodes packed into one cache line (64 bytes)
#[repr(C, align(64))]
pub struct PackedNodes {
    condition_idx: [u16; 4],
    true_branch: [u16; 4],
    false_branch: [u16; 4],
    flags: [u16; 4],
    _pad: [u8; 32],
}

impl CacheOptimizedTree {
    /// Traverse with prefetching
    #[inline]
    pub fn evaluate(&self, condition_results: &BitVec) -> SpellIdx {
        let mut node_idx = 0u16;

        loop {
            let pack_idx = (node_idx / 4) as usize;
            let local_idx = (node_idx % 4) as usize;

            // Prefetch next cache line
            if pack_idx + 1 < self.nodes.len() {
                unsafe {
                    std::arch::x86_64::_mm_prefetch(
                        &self.nodes[pack_idx + 1] as *const _ as *const i8,
                        std::arch::x86_64::_MM_HINT_T0,
                    );
                }
            }

            let pack = &self.nodes[pack_idx];
            let flags = pack.flags[local_idx];

            if flags & LEAF_FLAG != 0 {
                return self.actions[pack.true_branch[local_idx] as usize];
            }

            let cond_idx = pack.condition_idx[local_idx] as usize;
            let condition_met = condition_results[cond_idx];

            node_idx = if condition_met {
                pack.true_branch[local_idx]
            } else {
                pack.false_branch[local_idx]
            };
        }
    }
}
```

### SIMD Condition Evaluation

```rust
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

/// Evaluate 8 float comparisons in parallel
#[inline]
#[target_feature(enable = "avx2")]
unsafe fn eval_float_conditions_simd(
    state_values: &[f32],
    thresholds: &[f32],
    ops: &[CompareOp],
) -> u8 {
    let state = _mm256_loadu_ps(state_values.as_ptr());
    let thresh = _mm256_loadu_ps(thresholds.as_ptr());

    // Compare all 8 at once
    let cmp_lt = _mm256_cmp_ps(state, thresh, _CMP_LT_OQ);
    let cmp_ge = _mm256_cmp_ps(state, thresh, _CMP_GE_OQ);

    // Extract results based on ops
    let mask_lt = _mm256_movemask_ps(cmp_lt) as u8;
    let mask_ge = _mm256_movemask_ps(cmp_ge) as u8;

    // Combine based on operator types
    // (simplified - real impl would handle per-op selection)
    mask_ge
}
```

---

## Industry Approaches

### SimulationCraft (WoW)

SimulationCraft uses **Action Priority Lists (APL)**:

- Conditions are parsed and compiled to expression trees
- Expression trees are evaluated top-to-bottom
- First matching action is executed
- Supports complex expressions with operator precedence

```
actions=auto_attack
actions+=/call_action_list,name=cds
actions+=/kill_command,if=focus>=30
actions+=/barbed_shot,if=charges>=2|pet.frenzy.remains<gcd
actions+=/cobra_shot
```

**Key insight**: SimulationCraft prioritizes readability over raw performance.

### Halo (Behavior Trees)

Halo's AI uses behavior trees with:
- Blackboard for shared state
- Decorator nodes for conditions
- Parallel nodes for concurrent behaviors
- Event-driven updates (not polling)

### GOAP (Goal-Oriented Action Planning)

Used in F.E.A.R. and other games:
- AI reasons backwards from goals
- Actions have preconditions and effects
- Planner finds action sequence to achieve goal

**Not suitable for rotations**: Too expensive for per-tick decisions.

### Utility AI

Evaluates all actions and picks highest "utility":

```rust
pub struct UtilityAction {
    action: SpellIdx,
    considerations: Vec<Consideration>,
}

pub struct Consideration {
    curve: ResponseCurve,
    input: StateInput,
    weight: f32,
}

impl UtilityAction {
    pub fn score(&self, state: &GameState) -> f32 {
        self.considerations.iter()
            .map(|c| c.curve.evaluate(c.input.get(state)) * c.weight)
            .product()
    }
}
```

**Tradeoff**: More flexible but requires tuning curve parameters.

---

## Tradeoffs vs Scripting

### Comparison Matrix

| Aspect | Rhai Script | Decision Tree | BDD | Lookup Table |
|--------|-------------|---------------|-----|--------------|
| **Performance** | ~1.6 us | ~50 ns | ~30 ns | ~10 ns |
| **Memory** | High (AST) | Medium | Low | Variable |
| **Flexibility** | Excellent | Good | Limited | Limited |
| **User authoring** | Easy | Medium | Hard | N/A |
| **Runtime modification** | Yes | Rebuild | Rebuild | Rebuild |
| **Debugging** | Good | Medium | Hard | Easy |
| **Complex expressions** | Yes | Decompose | No | No |

### When to Use Each Approach

**Decision Trees**:
- Moderate complexity rotations
- Readable structure needed
- Runtime rebuilding acceptable

**BDDs**:
- Many boolean conditions
- Sharing between branches
- Memory constrained

**Lookup Tables**:
- Small state space
- Extreme performance needed
- Discrete conditions

**Hybrid**:
- Complex real-world rotations
- Mix of condition types
- Best of all worlds

### User-Facing Language

Even with internal decision trees, expose a script-like language:

```
# User writes this:
if cooldown.bestial_wrath.ready:
  cast bestial_wrath
elif cooldown.kill_command.ready and focus >= 30:
  cast kill_command
elif charges.barbed_shot >= 2:
  cast barbed_shot
else:
  cast cobra_shot

# Compiler produces:
DecisionTree {
  nodes: [...],
  conditions: [...],
  actions: [...],
}
```

---

## Recommended Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Rotation DSL (user-facing)                  │
│  "if cooldown.X.ready && focus >= 30: cast X"                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ compile
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Intermediate Representation                 │
│  - Normalized conditions                                        │
│  - Dead branch elimination                                      │
│  - Common subexpression extraction                              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ optimize
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Hybrid Decision Structure                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  BDD Layer  │  │ Tree Layer  │  │ LUT Layer   │            │
│  │  (boolean)  │  │ (numeric)   │  │ (hot path)  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│                   Unified Evaluator                             │
└─────────────────────────────────────────────────────────────────┘
```

### Components

```rust
/// Compiled rotation ready for execution
pub struct CompiledRotation {
    /// Hot path lookup table (when applicable)
    hot_lut: Option<ActionLookupTable>,
    /// BDD for boolean conditions
    bool_bdd: RotationBdd,
    /// Decision trees for each BDD terminal
    numeric_trees: Vec<DecisionTree>,
    /// All conditions (shared)
    conditions: ConditionSet,
    /// State schema for binding
    schema: StateSchema,
}

/// Condition set with categorization
pub struct ConditionSet {
    /// Boolean conditions (cooldown ready, aura active, talent enabled)
    boolean: Vec<BoolCondition>,
    /// Numeric conditions (focus >= X, health < Y)
    numeric: Vec<NumericCondition>,
    /// Mapping from condition ID to evaluation result slot
    slots: Vec<usize>,
}

impl CompiledRotation {
    /// Evaluate rotation and return action
    #[inline]
    pub fn evaluate(&self, state: &CacheAlignedState) -> SpellIdx {
        // Try hot path first
        if let Some(ref lut) = self.hot_lut {
            let discrete = state.discretize();
            if let Some(action) = lut.try_lookup(&discrete) {
                return action;
            }
        }

        // Evaluate boolean conditions
        let bool_results = self.conditions.eval_boolean(state);

        // Traverse BDD to find applicable tree
        let tree_idx = self.bool_bdd.evaluate(&bool_results);

        // Evaluate numeric tree
        let tree = &self.numeric_trees[tree_idx as usize];
        let num_results = self.conditions.eval_numeric_for_tree(state, tree);
        tree.evaluate(&num_results)
    }
}
```

### DSL Design

```
# Comments start with #

# Variable declarations
let focus_threshold = 30

# Phases (optional state machine layer)
phase opener:
  cast trueshot
  cast aimed_shot
  cast aimed_shot
  -> burst

phase burst:
  if cooldown.aimed_shot.ready and focus >= focus_threshold:
    cast aimed_shot
  elif aura.precise_shots.active:
    cast arcane_shot
  else:
    cast steady_shot

  # Transition when trueshot fades
  if not aura.trueshot.active:
    -> sustain

phase sustain:
  if cooldown.trueshot.ready:
    -> opener

  if cooldown.aimed_shot.ready and focus >= focus_threshold:
    cast aimed_shot
  elif focus >= 50:
    cast arcane_shot
  else:
    cast steady_shot

# Entry point
start opener
```

### Compiler Pipeline

```rust
pub fn compile_rotation(source: &str) -> Result<CompiledRotation, CompileError> {
    // 1. Parse DSL to AST
    let ast = parser::parse(source)?;

    // 2. Semantic analysis (type check, resolve names)
    let typed_ast = analyzer::analyze(ast)?;

    // 3. Extract conditions and normalize
    let (conditions, normalized) = normalizer::normalize(typed_ast)?;

    // 4. Optimize: dead code elimination, constant folding
    let optimized = optimizer::optimize(normalized, &conditions)?;

    // 5. Build BDD for boolean conditions
    let (bool_conditions, bool_bdd) = bdd_builder::build(&optimized)?;

    // 6. Build decision trees for each BDD terminal
    let numeric_trees = tree_builder::build(&optimized, &bool_bdd)?;

    // 7. Optionally build hot path LUT
    let hot_lut = lut_builder::try_build(&optimized)?;

    // 8. Generate schema
    let schema = schema_builder::build(&conditions)?;

    Ok(CompiledRotation {
        hot_lut,
        bool_bdd,
        numeric_trees,
        conditions,
        schema,
    })
}
```

---

## Implementation Plan

### Phase 1: Core Data Structures

1. Define `DecisionNode`, `DecisionTree` structures
2. Implement tree traversal with benchmarks
3. Define `CacheAlignedState` with SoA layout
4. Implement condition evaluation

**Deliverable**: `crates/engine/src/rotation/tree.rs`

### Phase 2: Compiler Frontend

1. Design DSL grammar
2. Implement lexer and parser
3. Build typed AST
4. Implement semantic analysis

**Deliverable**: `crates/engine/src/rotation/dsl/`

### Phase 3: IR and Optimization

1. Define intermediate representation
2. Implement dead code elimination
3. Implement constant propagation
4. Implement common subexpression elimination

**Deliverable**: `crates/engine/src/rotation/ir/`

### Phase 4: Backend Code Generation

1. Implement decision tree builder
2. Implement BDD builder (optional)
3. Implement LUT builder (optional)
4. Implement hybrid evaluator

**Deliverable**: `crates/engine/src/rotation/codegen/`

### Phase 5: Integration

1. Define spec bindings interface
2. Port existing BM Hunter rotation
3. Port existing MM Hunter rotation
4. Benchmark against Rhai baseline

**Deliverable**: Updated `crates/engine/src/specs/*/rotation.rs`

### Phase 6: Tooling

1. Rotation validator CLI
2. Rotation debugger (trace execution)
3. Performance profiler
4. Visual tree viewer (optional)

**Deliverable**: `crates/engine/src/cli/rotation.rs`

---

## Appendix: Performance Estimates

### Micro-benchmarks (Estimated)

| Operation | Rhai | Decision Tree | BDD | LUT |
|-----------|------|---------------|-----|-----|
| Simple rotation (5 conditions) | 1.6 us | 40 ns | 25 ns | 8 ns |
| Medium rotation (15 conditions) | 3.2 us | 80 ns | 45 ns | 12 ns |
| Complex rotation (30 conditions) | 6.0 us | 150 ns | 80 ns | 20 ns |

### Throughput Improvement

At 30 ns per decision vs 1600 ns:
- **53x speedup** per decision
- 300s fight at 1.5s GCD = 200 decisions
- Per iteration: 6 us vs 320 us
- 10,000 iterations: 60 ms vs 3.2 s

### Memory Usage

| Component | Rhai | Decision Tree | Hybrid |
|-----------|------|---------------|--------|
| Rotation data | ~50 KB | ~2 KB | ~4 KB |
| Per-tick state | ~8 KB | 512 B | 768 B |
| Cache lines touched | 50+ | 3-5 | 5-8 |

---

## References

- [Behavior Trees for AI](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- [Binary Decision Diagrams - Wikipedia](https://en.wikipedia.org/wiki/Binary_decision_diagram)
- [Data Locality - Game Programming Patterns](https://gameprogrammingpatterns.com/data-locality.html)
- [SimulationCraft Action Lists](https://github.com/simulationcraft/simc/wiki/ActionLists)
- [Branchless Programming - Algorithmica](https://en.algorithmica.org/hpc/pipelining/branchless/)
- [Growing Cache Friendly Decision Trees (MLSys)](https://mlsys.org/Conferences/doc/2018/89.pdf)
- [BDDs for Player Assistance (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3649921.3650014)

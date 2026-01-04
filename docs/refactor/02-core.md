# Phase 02: Core

## Goal

Create the core simulation infrastructure: event queue (timing wheel), RNG.

## Prerequisites

Phase 01 complete. `cargo test -p engine_new` passes.

## Files to Create

```
src/
├── lib.rs              # Add: pub mod core;
└── core/
    ├── mod.rs
    ├── event.rs
    ├── queue.rs
    └── rng.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
```

### `src/core/mod.rs`

```rust
mod event;
mod queue;
mod rng;

pub use event::*;
pub use queue::*;
pub use rng::*;

#[cfg(test)]
mod tests;
```

### `src/core/event.rs`

```rust
use crate::types::{SimTime, SpellIdx, AuraIdx, UnitIdx, TargetIdx, ProcIdx};

/// All possible simulation events
#[derive(Clone, Debug)]
pub enum SimEvent {
    /// GCD ends, can cast again
    GcdEnd,

    /// Cast completes, apply effects
    CastComplete {
        spell: SpellIdx,
        target: TargetIdx,
    },

    /// Spell damage lands (after travel time)
    SpellDamage {
        spell: SpellIdx,
        target: TargetIdx,
        snapshot_id: u32,
    },

    /// Aura expires
    AuraExpire {
        aura: AuraIdx,
        target: TargetIdx,
    },

    /// Periodic tick (DoT/HoT)
    AuraTick {
        aura: AuraIdx,
        target: TargetIdx,
    },

    /// Cooldown ready
    CooldownReady {
        spell: SpellIdx,
    },

    /// Charge regenerates
    ChargeReady {
        spell: SpellIdx,
    },

    /// Auto-attack swing
    AutoAttack {
        unit: UnitIdx,
    },

    /// Pet auto-attack
    PetAttack {
        pet: UnitIdx,
    },

    /// Resource tick (energy/focus regen)
    ResourceTick,

    /// Proc internal cooldown ends
    ProcIcdEnd {
        proc: ProcIdx,
    },

    /// Simulation ends
    SimEnd,
}

/// Event with scheduled time
#[derive(Clone, Debug)]
pub struct ScheduledEvent {
    pub time: SimTime,
    pub event: SimEvent,
}
```

### `src/core/queue.rs`

Timing wheel implementation with bitmap acceleration.

```rust
use super::{SimEvent, ScheduledEvent};
use crate::types::SimTime;

/// Timing wheel slot granularity in milliseconds
const SLOT_MS: u32 = 32;
/// Number of slots in the wheel (power of 2)
const NUM_SLOTS: usize = 4096;
/// Mask for fast modulo
const SLOT_MASK: u32 = (NUM_SLOTS as u32) - 1;
/// Bitmap words (4096 / 64 = 64 words)
const BITMAP_WORDS: usize = NUM_SLOTS / 64;

/// High-performance event queue using a timing wheel
pub struct EventQueue {
    /// Current simulation time
    current_time: SimTime,
    /// Slots containing events
    slots: Vec<Vec<SimEvent>>,
    /// Bitmap tracking non-empty slots (1 bit per slot)
    bitmap: [u64; BITMAP_WORDS],
    /// Overflow for events > wheel range
    overflow: Vec<ScheduledEvent>,
    /// Current slot index
    current_slot: usize,
}

impl EventQueue {
    pub fn new() -> Self {
        Self {
            current_time: SimTime::ZERO,
            slots: (0..NUM_SLOTS).map(|_| Vec::with_capacity(4)).collect(),
            bitmap: [0; BITMAP_WORDS],
            overflow: Vec::new(),
            current_slot: 0,
        }
    }

    /// Reset queue for new simulation
    pub fn reset(&mut self) {
        self.current_time = SimTime::ZERO;
        self.current_slot = 0;
        for slot in &mut self.slots {
            slot.clear();
        }
        self.bitmap = [0; BITMAP_WORDS];
        self.overflow.clear();
    }

    /// Current simulation time
    #[inline]
    pub fn now(&self) -> SimTime {
        self.current_time
    }

    /// Schedule an event at absolute time
    pub fn schedule(&mut self, time: SimTime, event: SimEvent) {
        debug_assert!(time >= self.current_time, "Cannot schedule in the past");

        let delta = time.as_millis() - self.current_time.as_millis();
        let slots_ahead = delta / SLOT_MS;

        if slots_ahead >= NUM_SLOTS as u32 {
            // Too far ahead, goes to overflow
            self.overflow.push(ScheduledEvent { time, event });
        } else {
            let slot = ((self.current_slot as u32 + slots_ahead) & SLOT_MASK) as usize;
            self.slots[slot].push(event);
            self.set_bitmap(slot);
        }
    }

    /// Schedule event relative to now
    #[inline]
    pub fn schedule_in(&mut self, delay: SimTime, event: SimEvent) {
        self.schedule(self.current_time + delay, event);
    }

    /// Pop next event, advancing time
    pub fn pop(&mut self) -> Option<ScheduledEvent> {
        // Check current slot first
        if let Some(event) = self.slots[self.current_slot].pop() {
            if self.slots[self.current_slot].is_empty() {
                self.clear_bitmap(self.current_slot);
            }
            return Some(ScheduledEvent {
                time: self.current_time,
                event,
            });
        }

        // Find next non-empty slot using bitmap
        let next_slot = self.find_next_slot()?;

        // Advance time
        let slots_advanced = if next_slot >= self.current_slot {
            next_slot - self.current_slot
        } else {
            NUM_SLOTS - self.current_slot + next_slot
        };

        self.current_time = SimTime::from_millis(
            self.current_time.as_millis() + (slots_advanced as u32 * SLOT_MS)
        );
        self.current_slot = next_slot;

        // Refill from overflow if we've advanced enough
        self.refill_from_overflow();

        // Pop from the slot we moved to
        if let Some(event) = self.slots[self.current_slot].pop() {
            if self.slots[self.current_slot].is_empty() {
                self.clear_bitmap(self.current_slot);
            }
            return Some(ScheduledEvent {
                time: self.current_time,
                event,
            });
        }

        None
    }

    /// Check if queue is empty
    pub fn is_empty(&self) -> bool {
        self.bitmap.iter().all(|&w| w == 0) && self.overflow.is_empty()
    }

    #[inline]
    fn set_bitmap(&mut self, slot: usize) {
        let word = slot / 64;
        let bit = slot % 64;
        self.bitmap[word] |= 1 << bit;
    }

    #[inline]
    fn clear_bitmap(&mut self, slot: usize) {
        let word = slot / 64;
        let bit = slot % 64;
        self.bitmap[word] &= !(1 << bit);
    }

    fn find_next_slot(&self) -> Option<usize> {
        let start_word = self.current_slot / 64;
        let start_bit = self.current_slot % 64;

        // Check current word (masked to only bits >= current position)
        let mask = !((1u64 << start_bit) - 1);
        let masked = self.bitmap[start_word] & mask;
        if masked != 0 {
            return Some(start_word * 64 + masked.trailing_zeros() as usize);
        }

        // Check subsequent words
        for i in 1..BITMAP_WORDS {
            let word_idx = (start_word + i) % BITMAP_WORDS;
            if self.bitmap[word_idx] != 0 {
                return Some(word_idx * 64 + self.bitmap[word_idx].trailing_zeros() as usize);
            }
        }

        // Check overflow
        if !self.overflow.is_empty() {
            // Return a sentinel that will trigger overflow processing
            return Some(self.current_slot);
        }

        None
    }

    fn refill_from_overflow(&mut self) {
        let wheel_end = self.current_time.as_millis() + (NUM_SLOTS as u32 * SLOT_MS);

        let mut i = 0;
        while i < self.overflow.len() {
            if self.overflow[i].time.as_millis() < wheel_end {
                let ev = self.overflow.swap_remove(i);
                let delta = ev.time.as_millis() - self.current_time.as_millis();
                let slot = ((self.current_slot as u32 + delta / SLOT_MS) & SLOT_MASK) as usize;
                self.slots[slot].push(ev.event);
                self.set_bitmap(slot);
            } else {
                i += 1;
            }
        }
    }
}

impl Default for EventQueue {
    fn default() -> Self {
        Self::new()
    }
}
```

### `src/core/rng.rs`

Fast RNG using xoshiro256++.

```rust
/// Fast, high-quality RNG (xoshiro256++)
pub struct FastRng {
    state: [u64; 4],
}

impl FastRng {
    /// Create new RNG with seed
    pub fn new(seed: u64) -> Self {
        // Use SplitMix64 to initialize state from seed
        let mut sm = seed;
        let mut state = [0u64; 4];
        for s in &mut state {
            sm = sm.wrapping_add(0x9e3779b97f4a7c15);
            let mut z = sm;
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            *s = z ^ (z >> 31);
        }
        Self { state }
    }

    /// Generate random u64
    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        let result = (self.state[0].wrapping_add(self.state[3]))
            .rotate_left(23)
            .wrapping_add(self.state[0]);

        let t = self.state[1] << 17;

        self.state[2] ^= self.state[0];
        self.state[3] ^= self.state[1];
        self.state[1] ^= self.state[2];
        self.state[0] ^= self.state[3];

        self.state[2] ^= t;
        self.state[3] = self.state[3].rotate_left(45);

        result
    }

    /// Generate random f32 in [0, 1)
    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        // Use upper 24 bits for mantissa
        (self.next_u64() >> 40) as f32 * (1.0 / (1u64 << 24) as f32)
    }

    /// Generate random f64 in [0, 1)
    #[inline]
    pub fn next_f64(&mut self) -> f64 {
        // Use upper 53 bits for mantissa
        (self.next_u64() >> 11) as f64 * (1.0 / (1u64 << 53) as f64)
    }

    /// Roll against probability (0.0 to 1.0)
    #[inline]
    pub fn roll(&mut self, probability: f32) -> bool {
        self.next_f32() < probability
    }

    /// Random integer in [0, max)
    #[inline]
    pub fn next_u32(&mut self, max: u32) -> u32 {
        ((self.next_u64() >> 32) as u32) % max
    }

    /// Random value in range [min, max]
    #[inline]
    pub fn range(&mut self, min: f32, max: f32) -> f32 {
        min + self.next_f32() * (max - min)
    }
}
```

### `src/core/tests.rs`

```rust
use super::*;
use crate::types::SimTime;

#[test]
fn event_queue_basic() {
    let mut q = EventQueue::new();
    assert!(q.is_empty());

    q.schedule(SimTime::from_millis(100), SimEvent::GcdEnd);
    assert!(!q.is_empty());

    let ev = q.pop().unwrap();
    assert_eq!(ev.time.as_millis(), 96); // Rounded to slot granularity
    assert!(matches!(ev.event, SimEvent::GcdEnd));
}

#[test]
fn event_queue_ordering() {
    let mut q = EventQueue::new();

    q.schedule(SimTime::from_millis(300), SimEvent::SimEnd);
    q.schedule(SimTime::from_millis(100), SimEvent::GcdEnd);
    q.schedule(SimTime::from_millis(200), SimEvent::ResourceTick);

    let e1 = q.pop().unwrap();
    let e2 = q.pop().unwrap();
    let e3 = q.pop().unwrap();

    assert!(e1.time <= e2.time);
    assert!(e2.time <= e3.time);
}

#[test]
fn event_queue_schedule_in() {
    let mut q = EventQueue::new();
    q.schedule(SimTime::from_millis(100), SimEvent::GcdEnd);
    q.pop(); // Advance to 96ms

    q.schedule_in(SimTime::from_millis(50), SimEvent::ResourceTick);

    let ev = q.pop().unwrap();
    assert!(ev.time.as_millis() >= 96 + 32); // At least one slot later
}

#[test]
fn event_queue_overflow() {
    let mut q = EventQueue::new();

    // Schedule way in the future (beyond wheel range)
    q.schedule(SimTime::from_secs(200), SimEvent::SimEnd);

    // Schedule something soon
    q.schedule(SimTime::from_millis(100), SimEvent::GcdEnd);

    // Pop the near one
    let ev = q.pop().unwrap();
    assert!(matches!(ev.event, SimEvent::GcdEnd));

    // The overflow event is still there
    assert!(!q.is_empty());
}

#[test]
fn rng_distribution() {
    let mut rng = FastRng::new(12345);

    // Check f32 is in [0, 1)
    for _ in 0..1000 {
        let v = rng.next_f32();
        assert!(v >= 0.0 && v < 1.0);
    }
}

#[test]
fn rng_roll() {
    let mut rng = FastRng::new(42);

    // 0% should never proc
    for _ in 0..100 {
        assert!(!rng.roll(0.0));
    }

    // 100% should always proc
    for _ in 0..100 {
        assert!(rng.roll(1.0));
    }

    // 50% should be roughly half (with tolerance)
    let mut count = 0;
    for _ in 0..10000 {
        if rng.roll(0.5) {
            count += 1;
        }
    }
    assert!(count > 4500 && count < 5500);
}

#[test]
fn rng_range() {
    let mut rng = FastRng::new(99);

    for _ in 0..1000 {
        let v = rng.range(10.0, 20.0);
        assert!(v >= 10.0 && v <= 20.0);
    }
}

#[test]
fn rng_deterministic() {
    let mut rng1 = FastRng::new(12345);
    let mut rng2 = FastRng::new(12345);

    for _ in 0..100 {
        assert_eq!(rng1.next_u64(), rng2.next_u64());
    }
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (11 from phase 01 + 7 from phase 02 = 18 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod core;`
- [ ] Create `src/core/mod.rs`
- [ ] Create `src/core/event.rs`
- [ ] Create `src/core/queue.rs`
- [ ] Create `src/core/rng.rs`
- [ ] Create `src/core/tests.rs`
- [ ] Run `cargo test` — 18 tests pass
- [ ] Run `cargo build --release` — no warnings

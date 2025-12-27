//! Event system with configurable optimizations via feature flags.
//!
//! Features:
//! - `quaternary_heap`: Use 4-ary heap instead of binary (2-ary) for better cache locality
//! - `front_buffer`: Use front buffer for same-time events to avoid heap ops

use std::cmp::Ordering;

#[cfg(feature = "quaternary_heap")]
use dary_heap::QuaternaryHeap as Heap;

#[cfg(not(feature = "quaternary_heap"))]
use dary_heap::BinaryHeap as Heap;

/// Maximum events in the front buffer (immediate-next events).
#[cfg(feature = "front_buffer")]
const FRONT_BUFFER_SIZE: usize = 4;

/// Event types in the simulation - compact enum.
/// Ordered by frequency for branch prediction optimization.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum SimEvent {
    /// GCD has finished, evaluate rotation (most frequent)
    GcdReady = 0,

    /// Cooldown/charge has finished
    CooldownReady { spell_idx: u8 } = 1,

    /// DoT/HoT tick (periodic effects)
    AuraTick { aura_idx: u8 } = 2,

    /// Aura has expired
    AuraExpire { aura_idx: u8 } = 3,

    /// Apply an aura (from spell effect)
    AuraApply { aura_idx: u8, stacks: u8 } = 4,

    /// Resource regeneration tick (if using tick-based regen)
    ResourceTick = 5,

    /// Auto-attack (player)
    AutoAttack = 6,

    /// Pet auto-attack
    PetAttack = 7,

    /// Delayed spell damage (for travel time/delayed effects)
    SpellDamage { spell_idx: u8, damage_x100: u32 } = 8,

    /// A spell cast has completed (for cast-time spells)
    CastComplete { spell_idx: u8 } = 9,
}

/// Compact timed event.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct TimedEvent {
    pub time: f32,
    seq: u32,
    pub event: SimEvent,
}

impl TimedEvent {
    #[inline(always)]
    pub const fn new(time: f32, seq: u32, event: SimEvent) -> Self {
        Self { time, seq, event }
    }
}

impl PartialEq for TimedEvent {
    #[inline(always)]
    fn eq(&self, other: &Self) -> bool {
        self.time == other.time && self.seq == other.seq
    }
}

impl Eq for TimedEvent {}

impl PartialOrd for TimedEvent {
    #[inline(always)]
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for TimedEvent {
    #[inline(always)]
    fn cmp(&self, other: &Self) -> Ordering {
        // Min-heap ordering: smaller time/seq comes first
        // Reverse comparison so heap pops minimum first
        match other.time.partial_cmp(&self.time) {
            Some(Ordering::Equal) => other.seq.cmp(&self.seq),
            Some(ord) => ord,
            None => Ordering::Equal,
        }
    }
}

/// Event queue with configurable optimizations.
pub struct EventQueue {
    heap: Heap<TimedEvent>,

    #[cfg(feature = "front_buffer")]
    front_buffer: [Option<TimedEvent>; FRONT_BUFFER_SIZE],
    #[cfg(feature = "front_buffer")]
    front_count: u8,
    #[cfg(feature = "front_buffer")]
    front_time: f32,

    next_seq: u32,
    pub events_processed: u32,
    pub events_scheduled: u32,
}

impl EventQueue {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            heap: Heap::with_capacity(capacity),

            #[cfg(feature = "front_buffer")]
            front_buffer: [None; FRONT_BUFFER_SIZE],
            #[cfg(feature = "front_buffer")]
            front_count: 0,
            #[cfg(feature = "front_buffer")]
            front_time: f32::NEG_INFINITY,

            next_seq: 0,
            events_processed: 0,
            events_scheduled: 0,
        }
    }

    #[inline]
    pub fn clear(&mut self) {
        self.heap.clear();

        #[cfg(feature = "front_buffer")]
        {
            self.front_buffer = [None; FRONT_BUFFER_SIZE];
            self.front_count = 0;
            self.front_time = f32::NEG_INFINITY;
        }

        self.next_seq = 0;
        self.events_processed = 0;
        self.events_scheduled = 0;
    }

    #[inline(always)]
    pub fn push(&mut self, time: f32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        #[cfg(feature = "front_buffer")]
        {
            // Try front buffer for same-time events
            if time == self.front_time && (self.front_count as usize) < FRONT_BUFFER_SIZE {
                self.front_buffer[self.front_count as usize] = Some(TimedEvent::new(time, seq, event));
                self.front_count += 1;
                return;
            }
        }

        self.heap.push(TimedEvent::new(time, seq, event));
    }

    /// Push an event for immediate processing (same timestamp).
    #[cfg(feature = "front_buffer")]
    #[inline(always)]
    pub fn push_immediate(&mut self, time: f32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        if (self.front_count as usize) < FRONT_BUFFER_SIZE {
            if self.front_count == 0 {
                self.front_time = time;
            }
            self.front_buffer[self.front_count as usize] = Some(TimedEvent::new(time, seq, event));
            self.front_count += 1;
        } else {
            self.heap.push(TimedEvent::new(time, seq, event));
        }
    }

    #[cfg(not(feature = "front_buffer"))]
    #[inline(always)]
    pub fn push_immediate(&mut self, time: f32, event: SimEvent) {
        self.push(time, event);
    }

    #[inline(always)]
    pub fn pop(&mut self) -> Option<TimedEvent> {
        #[cfg(feature = "front_buffer")]
        {
            // Drain front buffer first
            if self.front_count > 0 {
                self.front_count -= 1;
                let event = self.front_buffer[self.front_count as usize].take();
                self.events_processed += 1;
                return event;
            }
        }

        if let Some(event) = self.heap.pop() {
            self.events_processed += 1;

            #[cfg(feature = "front_buffer")]
            {
                // Refill front buffer with same-time events
                self.front_time = event.time;
                while (self.front_count as usize) < FRONT_BUFFER_SIZE {
                    if let Some(next) = self.heap.peek() {
                        if next.time == event.time {
                            self.front_buffer[self.front_count as usize] = self.heap.pop();
                            self.front_count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            return Some(event);
        }

        None
    }

    #[inline]
    pub fn peek(&self) -> Option<&TimedEvent> {
        #[cfg(feature = "front_buffer")]
        {
            if self.front_count > 0 {
                return self.front_buffer[(self.front_count - 1) as usize].as_ref();
            }
        }
        self.heap.peek()
    }

    #[inline]
    pub fn is_empty(&self) -> bool {
        #[cfg(feature = "front_buffer")]
        {
            if self.front_count > 0 {
                return false;
            }
        }
        self.heap.is_empty()
    }

    #[inline]
    pub fn len(&self) -> usize {
        #[cfg(feature = "front_buffer")]
        {
            return self.front_count as usize + self.heap.len();
        }
        #[cfg(not(feature = "front_buffer"))]
        self.heap.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_queue_ordering() {
        let mut queue = EventQueue::with_capacity(16);

        queue.push(3.0, SimEvent::GcdReady);
        queue.push(1.0, SimEvent::GcdReady);
        queue.push(2.0, SimEvent::GcdReady);

        assert_eq!(queue.pop().unwrap().time, 1.0);
        assert_eq!(queue.pop().unwrap().time, 2.0);
        assert_eq!(queue.pop().unwrap().time, 3.0);
        assert!(queue.pop().is_none());
    }

    #[test]
    fn test_same_time_fifo() {
        let mut queue = EventQueue::with_capacity(16);

        queue.push(1.0, SimEvent::GcdReady);
        queue.push(1.0, SimEvent::ResourceTick);
        queue.push(1.0, SimEvent::PetAttack);

        let e1 = queue.pop().unwrap();
        let e2 = queue.pop().unwrap();
        let e3 = queue.pop().unwrap();

        assert!(e1.seq < e2.seq);
        assert!(e2.seq < e3.seq);
    }

    #[test]
    fn test_event_size() {
        assert!(std::mem::size_of::<TimedEvent>() <= 16);
        assert!(std::mem::size_of::<SimEvent>() <= 8);
    }
}

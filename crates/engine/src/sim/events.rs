//! Event system with configurable optimizations via feature flags.
//!
//! Features:
//! - `quaternary_heap`: Use 4-ary heap instead of binary (2-ary) - slower in benchmarks
//! - `front_buffer`: Use front buffer for same-time events - adds overhead, not worth it
//! - `meta_events`: Process same-time events as a batch - semantic correctness, ~5% slower
//!
//! Default: dary_heap::BinaryHeap - fast and allows swapping to quaternary for testing

use std::cmp::Ordering;

// Default: dary_heap::BinaryHeap (allows swapping to quaternary later)
#[cfg(feature = "quaternary_heap")]
use dary_heap::QuaternaryHeap as Heap;

#[cfg(not(feature = "quaternary_heap"))]
use dary_heap::BinaryHeap as Heap;

/// Maximum events in the front buffer (immediate-next events).
#[cfg(feature = "front_buffer")]
const FRONT_BUFFER_SIZE: usize = 4;

/// Maximum events in a meta event batch.
#[cfg(feature = "meta_events")]
const META_BATCH_SIZE: usize = 64;

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
        // Use total_cmp for faster f32 comparison (no NaN handling branches)
        match other.time.total_cmp(&self.time) {
            Ordering::Equal => other.seq.cmp(&self.seq),
            ord => ord,
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

    /// Cached: does next event have same timestamp as last popped?
    /// Avoids repeated peek() calls in meta_events batching
    next_time_cache: f32,

    /// Track batch statistics (for meta_events analysis)
    #[cfg(feature = "meta_events")]
    pub batches_processed: u32,
    #[cfg(feature = "meta_events")]
    pub max_batch_size: u32,
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

            next_time_cache: f32::MAX,

            #[cfg(feature = "meta_events")]
            batches_processed: 0,
            #[cfg(feature = "meta_events")]
            max_batch_size: 0,
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
        self.next_time_cache = f32::MAX;

        #[cfg(feature = "meta_events")]
        {
            self.batches_processed = 0;
            self.max_batch_size = 0;
        }
    }

    /// Peek and cache the next event's timestamp (call once per batch)
    #[inline(always)]
    pub fn cache_next_time(&mut self) {
        self.next_time_cache = if let Some(e) = self.heap.peek() {
            e.time
        } else {
            f32::MAX
        };
    }

    /// Check if next event has same timestamp (uses cached peek result)
    /// Must call cache_next_time() first to populate the cache!
    #[inline(always)]
    pub fn next_has_same_time(&self, current_time: f32) -> bool {
        self.next_time_cache == current_time
    }

    /// Process all events at the same timestamp with a callback.
    /// Returns the timestamp processed, or None if empty.
    #[cfg(feature = "meta_events")]
    #[inline]
    pub fn drain_batch<F>(&mut self, mut f: F) -> Option<f32>
    where
        F: FnMut(SimEvent),
    {
        let first = self.heap.pop()?;
        let time = first.time;

        f(first.event);
        self.events_processed += 1;

        // Process all events at same time
        loop {
            if let Some(next) = self.heap.peek() {
                if next.time == time {
                    f(self.heap.pop().unwrap().event);
                    self.events_processed += 1;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        Some(time)
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
                // Cache next time for front buffer events
                if self.front_count > 0 {
                    if let Some(ref next) = self.front_buffer[(self.front_count - 1) as usize] {
                        self.next_time_cache = next.time;
                    }
                } else if let Some(next) = self.heap.peek() {
                    self.next_time_cache = next.time;
                } else {
                    self.next_time_cache = f32::MAX;
                }
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
                // Update cache after front buffer fill
                if self.front_count > 0 {
                    if let Some(ref next) = self.front_buffer[(self.front_count - 1) as usize] {
                        self.next_time_cache = next.time;
                    }
                }
            }

            return Some(event);
        }

        self.next_time_cache = f32::MAX;
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

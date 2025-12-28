//! Event system with configurable optimizations via feature flags.
//!
//! Features:
//! - `bucket_queue`: O(1) bucket-based queue for simulation events (RECOMMENDED)
//! - `quaternary_heap`: Use 4-ary heap instead of binary (2-ary) - slower in benchmarks
//! - `front_buffer`: Use front buffer for same-time events - adds overhead, not worth it
//! - `meta_events`: Process same-time events as a batch - semantic correctness, ~5% slower
//!
//! Default: dary_heap::BinaryHeap - fast and allows swapping to quaternary for testing

use std::cmp::Ordering;

// Timing wheel (SimC-style): O(1) amortized insert/pop
// - wheel_shift=5 means each slot covers 32ms
// - 4K slots = ~131 seconds coverage, wraps for longer sims
// Benchmarked: 4K optimal across 60s/300s/600s durations
#[cfg(feature = "bucket_queue")]
const WHEEL_SHIFT: u32 = 5; // divide time_ms by 32
#[cfg(feature = "bucket_queue")]
const WHEEL_SIZE: usize = 4096; // 2^12 slots - 32KB cache footprint
#[cfg(feature = "bucket_queue")]
const WHEEL_MASK: usize = WHEEL_SIZE - 1;

// Heap-based queue (default fallback)
#[cfg(all(not(feature = "bucket_queue"), feature = "quaternary_heap"))]
use dary_heap::QuaternaryHeap as Heap;

#[cfg(all(not(feature = "bucket_queue"), not(feature = "quaternary_heap")))]
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

/// Compact timed event - u32 milliseconds.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct TimedEvent {
    pub time: u32,
    seq: u32,
    pub event: SimEvent,
}

impl TimedEvent {
    #[inline(always)]
    pub const fn new(time: u32, seq: u32, event: SimEvent) -> Self {
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
        match other.time.cmp(&self.time) {
            Ordering::Equal => other.seq.cmp(&self.seq),
            ord => ord,
        }
    }
}

// ============================================================================
// TIMING WHEEL IMPLEMENTATION (SimC-style) - O(1) amortized insert/pop
// Uses index-based linked list with arena allocation (no Box/malloc per event)
// ============================================================================

/// Index into the node arena (u32::MAX = null)
#[cfg(feature = "bucket_queue")]
type NodeIdx = u32;
#[cfg(feature = "bucket_queue")]
const NULL_IDX: NodeIdx = u32::MAX;

/// Linked list node stored in arena
#[cfg(feature = "bucket_queue")]
#[derive(Clone, Copy)]
struct EventNode {
    event: TimedEvent,
    next: NodeIdx,
}

#[cfg(feature = "bucket_queue")]
pub struct EventQueue {
    /// Node arena - pre-allocated storage for all nodes
    arena: Vec<EventNode>,

    /// Free list head (recycled nodes)
    free_head: NodeIdx,

    /// Timing wheel: each slot is (head, tail) linked list indices
    wheel_head: Vec<NodeIdx>,
    wheel_tail: Vec<NodeIdx>,

    /// Current wheel position
    current_slot: usize,

    /// Sequence number for FIFO ordering
    next_seq: u32,

    pub events_processed: u32,
    pub events_scheduled: u32,

    next_time_cache: u32,

    #[cfg(feature = "meta_events")]
    pub batches_processed: u32,
    #[cfg(feature = "meta_events")]
    pub max_batch_size: u32,
}

#[cfg(feature = "bucket_queue")]
impl EventQueue {
    pub fn with_capacity(capacity: usize) -> Self {
        let arena_size = capacity.max(16384);
        Self {
            arena: Vec::with_capacity(arena_size),
            free_head: NULL_IDX,
            wheel_head: vec![NULL_IDX; WHEEL_SIZE],
            wheel_tail: vec![NULL_IDX; WHEEL_SIZE],
            current_slot: 0,
            next_seq: 0,
            events_processed: 0,
            events_scheduled: 0,
            next_time_cache: u32::MAX,
            #[cfg(feature = "meta_events")]
            batches_processed: 0,
            #[cfg(feature = "meta_events")]
            max_batch_size: 0,
        }
    }

    #[inline]
    pub fn clear(&mut self) {
        // Reset wheel
        self.wheel_head.fill(NULL_IDX);
        self.wheel_tail.fill(NULL_IDX);
        // Put all nodes on free list
        self.free_head = if self.arena.is_empty() { NULL_IDX } else { 0 };
        for i in 0..self.arena.len() {
            self.arena[i].next = if i + 1 < self.arena.len() { (i + 1) as NodeIdx } else { NULL_IDX };
        }
        self.current_slot = 0;
        self.next_seq = 0;
        self.events_processed = 0;
        self.events_scheduled = 0;
        self.next_time_cache = u32::MAX;
        #[cfg(feature = "meta_events")]
        {
            self.batches_processed = 0;
            self.max_batch_size = 0;
        }
    }

    #[inline(always)]
    fn alloc_node(&mut self, event: TimedEvent) -> NodeIdx {
        if self.free_head != NULL_IDX {
            let idx = self.free_head;
            self.free_head = self.arena[idx as usize].next;
            self.arena[idx as usize] = EventNode { event, next: NULL_IDX };
            idx
        } else {
            let idx = self.arena.len() as NodeIdx;
            self.arena.push(EventNode { event, next: NULL_IDX });
            idx
        }
    }

    #[inline(always)]
    fn free_node(&mut self, idx: NodeIdx) {
        self.arena[idx as usize].next = self.free_head;
        self.free_head = idx;
    }

    #[inline(always)]
    fn time_to_slot(time_ms: u32) -> usize {
        ((time_ms >> WHEEL_SHIFT) as usize) & WHEEL_MASK
    }

    /// Insert sorted by time - O(1) for common case (append to tail)
    #[inline(always)]
    pub fn push(&mut self, time_ms: u32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        let slot_idx = Self::time_to_slot(time_ms);
        let new_event = TimedEvent::new(time_ms, seq, event);
        let new_idx = self.alloc_node(new_event);

        let tail_idx = self.wheel_tail[slot_idx];

        // Fast path: empty list or new event goes at end
        if tail_idx == NULL_IDX {
            // Empty list
            self.wheel_head[slot_idx] = new_idx;
            self.wheel_tail[slot_idx] = new_idx;
            return;
        }

        let tail = &self.arena[tail_idx as usize];
        if time_ms > tail.event.time || (time_ms == tail.event.time && seq > tail.event.seq) {
            // Append at tail (most common case - scheduling future events)
            self.arena[tail_idx as usize].next = new_idx;
            self.wheel_tail[slot_idx] = new_idx;
            return;
        }

        // Slow path: need to find insertion point
        let mut prev_idx = NULL_IDX;
        let mut curr_idx = self.wheel_head[slot_idx];

        while curr_idx != NULL_IDX {
            let curr = &self.arena[curr_idx as usize];
            if curr.event.time > time_ms || (curr.event.time == time_ms && curr.event.seq > seq) {
                break;
            }
            prev_idx = curr_idx;
            curr_idx = curr.next;
        }

        // Insert new node
        self.arena[new_idx as usize].next = curr_idx;
        if prev_idx == NULL_IDX {
            self.wheel_head[slot_idx] = new_idx;
        } else {
            self.arena[prev_idx as usize].next = new_idx;
        }
    }

    #[inline(always)]
    pub fn push_immediate(&mut self, time_ms: u32, event: SimEvent) {
        self.push(time_ms, event);
    }

    /// Pop from head (O(1))
    #[inline(always)]
    pub fn pop(&mut self) -> Option<TimedEvent> {
        for _ in 0..WHEEL_SIZE {
            let head_idx = self.wheel_head[self.current_slot];
            if head_idx != NULL_IDX {
                let node = self.arena[head_idx as usize];
                self.wheel_head[self.current_slot] = node.next;
                // Update tail if list is now empty
                if node.next == NULL_IDX {
                    self.wheel_tail[self.current_slot] = NULL_IDX;
                }
                self.free_node(head_idx);
                self.events_processed += 1;
                return Some(node.event);
            }
            self.current_slot = (self.current_slot + 1) & WHEEL_MASK;
        }
        None
    }

    #[inline]
    pub fn peek(&self) -> Option<&TimedEvent> {
        let mut slot_idx = self.current_slot;
        for _ in 0..WHEEL_SIZE {
            let head_idx = self.wheel_head[slot_idx];
            if head_idx != NULL_IDX {
                return Some(&self.arena[head_idx as usize].event);
            }
            slot_idx = (slot_idx + 1) & WHEEL_MASK;
        }
        None
    }

    #[inline(always)]
    pub fn cache_next_time(&mut self) {
        self.next_time_cache = if let Some(e) = self.peek() { e.time } else { u32::MAX };
    }

    #[inline(always)]
    pub fn next_has_same_time(&self, current_time_ms: u32) -> bool {
        self.next_time_cache == current_time_ms
    }

    #[cfg(feature = "meta_events")]
    #[inline]
    pub fn drain_batch<F>(&mut self, mut f: F) -> Option<u32>
    where
        F: FnMut(SimEvent),
    {
        let first = self.pop()?;
        let time_ms = first.time;
        f(first.event);
        while let Some(next) = self.peek() {
            if next.time == time_ms {
                f(self.pop().unwrap().event);
            } else {
                break;
            }
        }
        Some(time_ms)
    }

    #[inline]
    pub fn is_empty(&self) -> bool {
        self.peek().is_none()
    }

    #[inline]
    pub fn len(&self) -> usize {
        self.wheel_head.iter().filter(|&&idx| idx != NULL_IDX).count()
    }
}

// ============================================================================
// HEAP-BASED QUEUE IMPLEMENTATION - Default fallback
// ============================================================================
#[cfg(not(feature = "bucket_queue"))]
/// Event queue with configurable optimizations.
pub struct EventQueue {
    heap: Heap<TimedEvent>,

    #[cfg(feature = "front_buffer")]
    front_buffer: [Option<TimedEvent>; FRONT_BUFFER_SIZE],
    #[cfg(feature = "front_buffer")]
    front_count: u8,
    #[cfg(feature = "front_buffer")]
    front_time_ms: u32,

    next_seq: u32,
    pub events_processed: u32,
    pub events_scheduled: u32,

    /// Cached: does next event have same timestamp as last popped?
    /// Avoids repeated peek() calls in meta_events batching
    next_time_cache: u32,

    /// Track batch statistics (for meta_events analysis)
    #[cfg(feature = "meta_events")]
    pub batches_processed: u32,
    #[cfg(feature = "meta_events")]
    pub max_batch_size: u32,
}

#[cfg(not(feature = "bucket_queue"))]
impl EventQueue {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            heap: Heap::with_capacity(capacity),

            #[cfg(feature = "front_buffer")]
            front_buffer: [None; FRONT_BUFFER_SIZE],
            #[cfg(feature = "front_buffer")]
            front_count: 0,
            #[cfg(feature = "front_buffer")]
            front_time_ms: 0,

            next_seq: 0,
            events_processed: 0,
            events_scheduled: 0,

            next_time_cache: u32::MAX,

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
            self.front_time_ms = 0;
        }

        self.next_seq = 0;
        self.events_processed = 0;
        self.events_scheduled = 0;
        self.next_time_cache = u32::MAX;

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
            u32::MAX
        };
    }

    /// Check if next event has same timestamp (uses cached peek result)
    /// Must call cache_next_time() first to populate the cache!
    #[inline(always)]
    pub fn next_has_same_time(&self, current_time_ms: u32) -> bool {
        self.next_time_cache == current_time_ms
    }

    /// Process all events at the same timestamp with a callback.
    /// Returns the timestamp processed, or None if empty.
    #[cfg(feature = "meta_events")]
    #[inline]
    pub fn drain_batch<F>(&mut self, mut f: F) -> Option<u32>
    where
        F: FnMut(SimEvent),
    {
        let first = self.heap.pop()?;
        let time_ms = first.time;

        f(first.event);
        self.events_processed += 1;

        // Process all events at same time
        loop {
            if let Some(next) = self.heap.peek() {
                if next.time == time_ms {
                    f(self.heap.pop().unwrap().event);
                    self.events_processed += 1;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        Some(time_ms)
    }

    #[inline(always)]
    pub fn push(&mut self, time_ms: u32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        #[cfg(feature = "front_buffer")]
        {
            // Try front buffer for same-time events
            if time_ms == self.front_time_ms && (self.front_count as usize) < FRONT_BUFFER_SIZE {
                self.front_buffer[self.front_count as usize] = Some(TimedEvent::new(time_ms, seq, event));
                self.front_count += 1;
                return;
            }
        }

        self.heap.push(TimedEvent::new(time_ms, seq, event));
    }

    /// Push an event for immediate processing (same timestamp).
    #[cfg(feature = "front_buffer")]
    #[inline(always)]
    pub fn push_immediate(&mut self, time_ms: u32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        if (self.front_count as usize) < FRONT_BUFFER_SIZE {
            if self.front_count == 0 {
                self.front_time_ms = time_ms;
            }
            self.front_buffer[self.front_count as usize] = Some(TimedEvent::new(time_ms, seq, event));
            self.front_count += 1;
        } else {
            self.heap.push(TimedEvent::new(time_ms, seq, event));
        }
    }

    #[cfg(not(feature = "front_buffer"))]
    #[inline(always)]
    pub fn push_immediate(&mut self, time_ms: u32, event: SimEvent) {
        self.push(time_ms, event);
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
                    self.next_time_cache = u32::MAX;
                }
                return event;
            }
        }

        if let Some(event) = self.heap.pop() {
            self.events_processed += 1;

            #[cfg(feature = "front_buffer")]
            {
                // Refill front buffer with same-time events
                self.front_time_ms = event.time;
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

        self.next_time_cache = u32::MAX;
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

        queue.push(3000, SimEvent::GcdReady);
        queue.push(1000, SimEvent::GcdReady);
        queue.push(2000, SimEvent::GcdReady);

        assert_eq!(queue.pop().unwrap().time, 1000);
        assert_eq!(queue.pop().unwrap().time, 2000);
        assert_eq!(queue.pop().unwrap().time, 3000);
        assert!(queue.pop().is_none());
    }

    #[test]
    fn test_same_time_fifo() {
        let mut queue = EventQueue::with_capacity(16);

        queue.push(1000, SimEvent::GcdReady);
        queue.push(1000, SimEvent::ResourceTick);
        queue.push(1000, SimEvent::PetAttack);

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

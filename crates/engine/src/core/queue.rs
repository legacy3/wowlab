//! Timing wheel event queue with O(1) amortized insert/pop.
//!
//! Uses a SimC-style timing wheel with bitmap acceleration:
//! - `WHEEL_SHIFT=5`: Each slot covers 32ms
//! - `WHEEL_SIZE=32768`: ~17 minutes coverage
//! - Bitmap tracking for O(1) next-slot lookup via `trailing_zeros()`
//! - Arena allocation with free list for zero allocations in hot path

use super::SimEvent;
use wowlab_types::SimTime;

const WHEEL_SHIFT: u32 = 5; // 32ms per slot
const WHEEL_SIZE: usize = 32768; // ~17 minutes coverage
const WHEEL_MASK: usize = WHEEL_SIZE - 1;
const BITMAP_SIZE: usize = WHEEL_SIZE / 64;

/// Index into the node arena (u32::MAX = null)
type NodeIdx = u32;
const NULL_IDX: NodeIdx = u32::MAX;

/// Event with timing metadata for queue ordering
#[derive(Clone)]
pub struct ScheduledEvent {
    pub time: SimTime,
    pub event: SimEvent,
}

/// Internal node in the arena-allocated linked list
#[derive(Clone, Debug)]
struct EventNode {
    time_ms: u32,
    seq: u32,
    event: SimEvent,
    next: NodeIdx,
}

/// High-performance timing wheel event queue.
///
/// Zero allocations in the hot path via arena + free list.
/// Deterministic FIFO ordering via sequence numbers.
#[derive(Debug)]
pub struct EventQueue {
    // Arena storage
    arena: Vec<EventNode>,
    arena_used: u32,
    free_head: NodeIdx,

    // Timing wheel
    wheel_head: Vec<NodeIdx>,
    wheel_tail: Vec<NodeIdx>,
    slot_bitmap: [u64; BITMAP_SIZE],
    current_slot: usize,

    // Ordering
    next_seq: u32,

    // Stats
    pub events_processed: u32,
    pub events_scheduled: u32,
}

impl EventQueue {
    /// Create a new queue with pre-allocated capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        let arena_size = capacity.max(16384);
        Self {
            arena: Vec::with_capacity(arena_size),
            arena_used: 0,
            free_head: NULL_IDX,
            wheel_head: vec![NULL_IDX; WHEEL_SIZE],
            wheel_tail: vec![NULL_IDX; WHEEL_SIZE],
            slot_bitmap: [0; BITMAP_SIZE],
            current_slot: 0,
            next_seq: 0,
            events_processed: 0,
            events_scheduled: 0,
        }
    }

    /// Create with default capacity.
    pub fn new() -> Self {
        Self::with_capacity(16384)
    }

    /// Reset for new simulation (lazy clear via bitmap).
    #[inline]
    pub fn clear(&mut self) {
        // Only clear slots that were actually used
        for word_idx in 0..BITMAP_SIZE {
            let word = self.slot_bitmap[word_idx];
            if word == 0 {
                continue;
            }
            let mut bits = word;
            while bits != 0 {
                let bit_pos = bits.trailing_zeros() as usize;
                let slot_idx = (word_idx << 6) | bit_pos;
                self.wheel_head[slot_idx] = NULL_IDX;
                self.wheel_tail[slot_idx] = NULL_IDX;
                bits &= bits - 1;
            }
            self.slot_bitmap[word_idx] = 0;
        }

        // Fast arena reset - memory reused without rebuilding free list
        self.arena_used = 0;
        self.free_head = NULL_IDX;
        self.current_slot = 0;
        self.next_seq = 0;
        self.events_processed = 0;
        self.events_scheduled = 0;
    }

    /// Schedule an event at absolute time.
    #[inline]
    pub fn schedule(&mut self, time: SimTime, event: SimEvent) {
        let time_ms = time.as_millis();
        self.push_internal(time_ms, event);
    }

    /// Schedule an event relative to current time.
    #[inline]
    pub fn schedule_in(&mut self, current: SimTime, delay: SimTime, event: SimEvent) {
        let time_ms = current.as_millis() + delay.as_millis();
        self.push_internal(time_ms, event);
    }

    #[inline(always)]
    fn push_internal(&mut self, time_ms: u32, event: SimEvent) {
        self.events_scheduled += 1;
        let seq = self.next_seq;
        self.next_seq += 1;

        let slot_idx = Self::time_to_slot(time_ms);
        let new_idx = self.alloc_node(time_ms, seq, event);

        let tail_idx = self.wheel_tail[slot_idx];

        // Fast path: empty slot
        if tail_idx == NULL_IDX {
            self.wheel_head[slot_idx] = new_idx;
            self.wheel_tail[slot_idx] = new_idx;
            self.set_slot_bit(slot_idx);
            return;
        }

        // Fast path: append at tail (most common - scheduling future events)
        let tail = &self.arena[tail_idx as usize];
        if time_ms > tail.time_ms || (time_ms == tail.time_ms && seq > tail.seq) {
            self.arena[tail_idx as usize].next = new_idx;
            self.wheel_tail[slot_idx] = new_idx;
            return;
        }

        // Slow path: find insertion point for correct ordering
        let mut prev_idx = NULL_IDX;
        let mut curr_idx = self.wheel_head[slot_idx];

        while curr_idx != NULL_IDX {
            let curr = &self.arena[curr_idx as usize];
            if curr.time_ms > time_ms || (curr.time_ms == time_ms && curr.seq > seq) {
                break;
            }
            prev_idx = curr_idx;
            curr_idx = curr.next;
        }

        self.arena[new_idx as usize].next = curr_idx;
        if prev_idx == NULL_IDX {
            self.wheel_head[slot_idx] = new_idx;
        } else {
            self.arena[prev_idx as usize].next = new_idx;
        }
    }

    /// Pop the next event.
    #[inline]
    pub fn pop(&mut self) -> Option<ScheduledEvent> {
        // Fast path: check current slot
        let head_idx = self.wheel_head[self.current_slot];
        if head_idx != NULL_IDX {
            return Some(self.pop_from_slot(self.current_slot, head_idx));
        }

        // Find next non-empty slot via bitmap
        let next_slot = self.find_next_slot()?;
        self.current_slot = next_slot;

        let head_idx = self.wheel_head[next_slot];
        Some(self.pop_from_slot(next_slot, head_idx))
    }

    #[inline(always)]
    fn pop_from_slot(&mut self, slot: usize, head_idx: NodeIdx) -> ScheduledEvent {
        let node = &self.arena[head_idx as usize];
        let event = ScheduledEvent {
            time: SimTime::from_millis(node.time_ms),
            event: node.event.clone(),
        };
        let next = node.next;

        self.wheel_head[slot] = next;
        if next == NULL_IDX {
            self.wheel_tail[slot] = NULL_IDX;
            self.clear_slot_bit(slot);
        }

        self.free_node(head_idx);
        self.events_processed += 1;
        event
    }

    /// Peek at the next event without removing it.
    #[inline]
    pub fn peek(&self) -> Option<ScheduledEvent> {
        // Check current slot
        let head_idx = self.wheel_head[self.current_slot];
        if head_idx != NULL_IDX {
            let node = &self.arena[head_idx as usize];
            return Some(ScheduledEvent {
                time: SimTime::from_millis(node.time_ms),
                event: node.event.clone(),
            });
        }

        // Find next slot
        let slot = self.find_next_slot()?;
        let head_idx = self.wheel_head[slot];
        let node = &self.arena[head_idx as usize];
        Some(ScheduledEvent {
            time: SimTime::from_millis(node.time_ms),
            event: node.event.clone(),
        })
    }

    /// Check if queue is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.slot_bitmap.iter().all(|&w| w == 0)
    }

    // --- Internal helpers ---

    #[inline(always)]
    fn time_to_slot(time_ms: u32) -> usize {
        ((time_ms >> WHEEL_SHIFT) as usize) & WHEEL_MASK
    }

    #[inline(always)]
    fn set_slot_bit(&mut self, slot: usize) {
        let word = slot >> 6;
        let bit = slot & 63;
        self.slot_bitmap[word] |= 1u64 << bit;
    }

    #[inline(always)]
    fn clear_slot_bit(&mut self, slot: usize) {
        let word = slot >> 6;
        let bit = slot & 63;
        self.slot_bitmap[word] &= !(1u64 << bit);
    }

    #[inline(always)]
    fn find_next_slot(&self) -> Option<usize> {
        let start_word = self.current_slot >> 6;
        let start_bit = self.current_slot & 63;

        // Check current word (mask off bits before current position)
        let mask = !0u64 << start_bit;
        let masked = self.slot_bitmap[start_word] & mask;
        if masked != 0 {
            return Some((start_word << 6) | masked.trailing_zeros() as usize);
        }

        // Check subsequent words with wrap-around
        for i in 1..BITMAP_SIZE {
            let word_idx = (start_word + i) & (BITMAP_SIZE - 1);
            let word = self.slot_bitmap[word_idx];
            if word != 0 {
                return Some((word_idx << 6) | word.trailing_zeros() as usize);
            }
        }

        // Check wrap-around portion of start word
        let wrap_mask = (1u64 << start_bit) - 1;
        let wrap_masked = self.slot_bitmap[start_word] & wrap_mask;
        if wrap_masked != 0 {
            return Some((start_word << 6) | wrap_masked.trailing_zeros() as usize);
        }

        None
    }

    #[inline(always)]
    fn alloc_node(&mut self, time_ms: u32, seq: u32, event: SimEvent) -> NodeIdx {
        if self.free_head != NULL_IDX {
            // Reuse from free list
            let idx = self.free_head;
            self.free_head = self.arena[idx as usize].next;
            self.arena[idx as usize] = EventNode {
                time_ms,
                seq,
                event,
                next: NULL_IDX,
            };
            idx
        } else if (self.arena_used as usize) < self.arena.len() {
            // Reuse existing arena slot
            let idx = self.arena_used;
            self.arena[idx as usize] = EventNode {
                time_ms,
                seq,
                event,
                next: NULL_IDX,
            };
            self.arena_used += 1;
            idx
        } else {
            // Grow arena
            let idx = self.arena.len() as NodeIdx;
            self.arena.push(EventNode {
                time_ms,
                seq,
                event,
                next: NULL_IDX,
            });
            self.arena_used = self.arena.len() as u32;
            idx
        }
    }

    #[inline(always)]
    fn free_node(&mut self, idx: NodeIdx) {
        self.arena[idx as usize].next = self.free_head;
        self.free_head = idx;
    }
}

impl Default for EventQueue {
    fn default() -> Self {
        Self::new()
    }
}

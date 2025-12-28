//! Timing wheel event queue (SimC-style): O(1) amortized insert/pop
//!
//! - wheel_shift=5 means each slot covers 32ms
//! - 4K slots = ~131 seconds coverage, wraps for longer sims
//! - Benchmarked: 4K optimal across 60s/300s/600s durations

use std::cmp::Ordering;

const WHEEL_SHIFT: u32 = 5; // divide time_ms by 32
const WHEEL_SIZE: usize = 4096; // 2^12 slots - 32KB cache footprint
const WHEEL_MASK: usize = WHEEL_SIZE - 1;
const BITMAP_SIZE: usize = WHEEL_SIZE / 64; // 64 u64s = 4096 bits

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

/// Index into the node arena (u32::MAX = null)
type NodeIdx = u32;
const NULL_IDX: NodeIdx = u32::MAX;

/// Linked list node stored in arena
#[derive(Clone, Copy)]
struct EventNode {
    event: TimedEvent,
    next: NodeIdx,
}

pub struct EventQueue {
    /// Node arena - pre-allocated storage for all nodes
    arena: Vec<EventNode>,

    /// Number of arena slots in use (for fast clear)
    arena_used: u32,

    /// Free list head (recycled nodes)
    free_head: NodeIdx,

    /// Timing wheel: each slot is (head, tail) linked list indices
    wheel_head: Vec<NodeIdx>,
    wheel_tail: Vec<NodeIdx>,

    /// Bitmap tracking non-empty slots (1 bit per slot)
    slot_bitmap: [u64; BITMAP_SIZE],

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

impl EventQueue {
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
            next_time_cache: u32::MAX,
            #[cfg(feature = "meta_events")]
            batches_processed: 0,
            #[cfg(feature = "meta_events")]
            max_batch_size: 0,
        }
    }

    #[inline(always)]
    fn set_slot_bit(&mut self, slot: usize) {
        let word = slot >> 6; // slot / 64
        let bit = slot & 63; // slot % 64
        self.slot_bitmap[word] |= 1u64 << bit;
    }

    #[inline(always)]
    fn clear_slot_bit(&mut self, slot: usize) {
        let word = slot >> 6;
        let bit = slot & 63;
        self.slot_bitmap[word] &= !(1u64 << bit);
    }

    /// Find the next non-empty slot starting from current_slot.
    /// Returns None if all slots are empty.
    #[inline(always)]
    fn find_next_slot(&self) -> Option<usize> {
        let start_word = self.current_slot >> 6;
        let start_bit = self.current_slot & 63;

        // Check current word (mask off bits before current_slot)
        let mask = !0u64 << start_bit;
        let masked = self.slot_bitmap[start_word] & mask;
        if masked != 0 {
            return Some((start_word << 6) | masked.trailing_zeros() as usize);
        }

        // Check remaining words (with wrap-around)
        for i in 1..BITMAP_SIZE {
            let word_idx = (start_word + i) & (BITMAP_SIZE - 1);
            let word = self.slot_bitmap[word_idx];
            if word != 0 {
                return Some((word_idx << 6) | word.trailing_zeros() as usize);
            }
        }

        // Check the part of start_word before current_slot (wrap-around case)
        let wrap_mask = (1u64 << start_bit) - 1;
        let wrap_masked = self.slot_bitmap[start_word] & wrap_mask;
        if wrap_masked != 0 {
            return Some((start_word << 6) | wrap_masked.trailing_zeros() as usize);
        }

        None
    }

    #[inline]
    pub fn clear(&mut self) {
        // Lazy clear: only clear slots that were actually used (via bitmap)
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

        // Fast arena reset: just reset the used count and free head
        // Arena memory is reused without rebuilding free list
        self.arena_used = 0;
        self.free_head = NULL_IDX;

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
            // Reuse from free list
            let idx = self.free_head;
            self.free_head = self.arena[idx as usize].next;
            self.arena[idx as usize] = EventNode {
                event,
                next: NULL_IDX,
            };
            idx
        } else if (self.arena_used as usize) < self.arena.len() {
            // Reuse existing arena slot
            let idx = self.arena_used;
            self.arena[idx as usize] = EventNode {
                event,
                next: NULL_IDX,
            };
            self.arena_used += 1;
            idx
        } else {
            // Grow arena
            let idx = self.arena.len() as NodeIdx;
            self.arena.push(EventNode {
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
            // Empty list - set bitmap bit
            self.wheel_head[slot_idx] = new_idx;
            self.wheel_tail[slot_idx] = new_idx;
            self.set_slot_bit(slot_idx);
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

    /// Pop from head - O(1) with bitmap for slot lookup
    #[inline(always)]
    pub fn pop(&mut self) -> Option<TimedEvent> {
        // Fast path: check current slot first
        let head_idx = self.wheel_head[self.current_slot];
        if head_idx != NULL_IDX {
            let node = self.arena[head_idx as usize];
            self.wheel_head[self.current_slot] = node.next;
            if node.next == NULL_IDX {
                self.wheel_tail[self.current_slot] = NULL_IDX;
                self.clear_slot_bit(self.current_slot);
            }
            self.free_node(head_idx);
            self.events_processed += 1;
            return Some(node.event);
        }

        // Use bitmap to find next non-empty slot
        if let Some(next_slot) = self.find_next_slot() {
            self.current_slot = next_slot;
            let head_idx = self.wheel_head[next_slot];
            let node = self.arena[head_idx as usize];
            self.wheel_head[next_slot] = node.next;
            if node.next == NULL_IDX {
                self.wheel_tail[next_slot] = NULL_IDX;
                self.clear_slot_bit(next_slot);
            }
            self.free_node(head_idx);
            self.events_processed += 1;
            return Some(node.event);
        }

        None
    }

    #[inline]
    pub fn peek(&self) -> Option<&TimedEvent> {
        // Fast path: check current slot
        let head_idx = self.wheel_head[self.current_slot];
        if head_idx != NULL_IDX {
            return Some(&self.arena[head_idx as usize].event);
        }
        // Use bitmap to find next non-empty slot
        if let Some(slot_idx) = self.find_next_slot() {
            let head_idx = self.wheel_head[slot_idx];
            return Some(&self.arena[head_idx as usize].event);
        }
        None
    }

    #[inline(always)]
    pub fn cache_next_time(&mut self) {
        self.next_time_cache = if let Some(e) = self.peek() {
            e.time
        } else {
            u32::MAX
        };
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
        // Check if any bitmap word is non-zero
        self.slot_bitmap.iter().all(|&w| w == 0)
    }

    #[inline]
    pub fn len(&self) -> usize {
        self.wheel_head
            .iter()
            .filter(|&&idx| idx != NULL_IDX)
            .count()
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

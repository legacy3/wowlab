use std::cmp::Ordering;
use std::collections::BinaryHeap;

/// Event types in the simulation
#[derive(Debug, Clone, Copy)]
pub enum SimEvent {
    /// GCD has finished, evaluate rotation
    GcdReady,

    /// A spell cast has completed
    CastComplete { spell_id: u32 },

    /// Spell damage should be applied
    SpellDamage { spell_id: u32, amount: f32 },

    /// Apply an aura
    AuraApply { aura_id: u32, stacks: u8 },

    /// Aura has expired
    AuraExpire { aura_id: u32 },

    /// DoT/HoT tick
    AuraTick { aura_id: u32 },

    /// Cooldown has finished (for tracking/procs)
    CooldownReady { spell_idx: u8 },

    /// Resource regeneration tick
    ResourceTick,

    /// Pet auto-attack
    PetAttack,

    /// Player auto-attack
    AutoAttack,
}

/// Event with timestamp for priority queue
#[derive(Debug, Clone, Copy)]
pub struct TimedEvent {
    pub time: f32,
    pub event: SimEvent,
    /// Sequence number for stable ordering
    pub seq: u32,
}

impl PartialEq for TimedEvent {
    fn eq(&self, other: &Self) -> bool {
        self.time == other.time && self.seq == other.seq
    }
}

impl Eq for TimedEvent {}

impl PartialOrd for TimedEvent {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for TimedEvent {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for min-heap behavior with BinaryHeap (which is max-heap)
        match other.time.partial_cmp(&self.time) {
            Some(Ordering::Equal) => other.seq.cmp(&self.seq),
            Some(ord) => ord,
            None => Ordering::Equal,
        }
    }
}

/// Event queue using std::collections::BinaryHeap
pub struct EventQueue {
    events: BinaryHeap<TimedEvent>,
    next_seq: u32,
    /// Track total events processed (for debugging)
    pub events_processed: u32,
}

impl EventQueue {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            events: BinaryHeap::with_capacity(capacity),
            next_seq: 0,
            events_processed: 0,
        }
    }

    pub fn clear(&mut self) {
        self.events.clear();
        self.next_seq = 0;
        self.events_processed = 0;
    }

    #[inline(always)]
    pub fn push(&mut self, time: f32, event: SimEvent) {
        let timed = TimedEvent {
            time,
            event,
            seq: self.next_seq,
        };
        self.next_seq += 1;
        self.events.push(timed);
    }

    #[inline(always)]
    pub fn pop(&mut self) -> Option<TimedEvent> {
        self.events_processed += 1;
        self.events.pop()
    }

    pub fn peek(&self) -> Option<&TimedEvent> {
        self.events.peek()
    }

    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }

    pub fn len(&self) -> usize {
        self.events.len()
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
    fn test_same_time_ordering() {
        let mut queue = EventQueue::with_capacity(16);

        queue.push(1.0, SimEvent::GcdReady);
        queue.push(1.0, SimEvent::ResourceTick);
        queue.push(1.0, SimEvent::PetAttack);

        // Should come out in insertion order (FIFO for same time)
        let e1 = queue.pop().unwrap();
        let e2 = queue.pop().unwrap();
        let e3 = queue.pop().unwrap();

        assert_eq!(e1.seq, 0);
        assert_eq!(e2.seq, 1);
        assert_eq!(e3.seq, 2);
    }
}

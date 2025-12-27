use std::cmp::Ordering;

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
    CooldownReady { spell_id: u32 },

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

/// Fixed-capacity event queue (no allocations after init)
pub struct EventQueue {
    events: Vec<TimedEvent>,
    next_seq: u32,
}

impl EventQueue {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            events: Vec::with_capacity(capacity),
            next_seq: 0,
        }
    }

    pub fn clear(&mut self) {
        self.events.clear();
        self.next_seq = 0;
    }

    pub fn push(&mut self, time: f32, event: SimEvent) {
        let timed = TimedEvent {
            time,
            event,
            seq: self.next_seq,
        };
        self.next_seq += 1;

        // Binary heap push
        self.events.push(timed);
        self.sift_up(self.events.len() - 1);
    }

    pub fn pop(&mut self) -> Option<TimedEvent> {
        if self.events.is_empty() {
            return None;
        }

        let last = self.events.len() - 1;
        self.events.swap(0, last);
        let result = self.events.pop();

        if !self.events.is_empty() {
            self.sift_down(0);
        }

        result
    }

    pub fn peek(&self) -> Option<&TimedEvent> {
        self.events.first()
    }

    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }

    pub fn len(&self) -> usize {
        self.events.len()
    }

    fn sift_up(&mut self, mut idx: usize) {
        while idx > 0 {
            let parent = (idx - 1) / 2;
            if self.events[idx] > self.events[parent] {
                self.events.swap(idx, parent);
                idx = parent;
            } else {
                break;
            }
        }
    }

    fn sift_down(&mut self, mut idx: usize) {
        let len = self.events.len();
        loop {
            let left = 2 * idx + 1;
            let right = 2 * idx + 2;
            let mut largest = idx;

            if left < len && self.events[left] > self.events[largest] {
                largest = left;
            }
            if right < len && self.events[right] > self.events[largest] {
                largest = right;
            }

            if largest != idx {
                self.events.swap(idx, largest);
                idx = largest;
            } else {
                break;
            }
        }
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

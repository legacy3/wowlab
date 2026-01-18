use super::*;
use crate::types::SimTime;

#[test]
fn event_queue_basic() {
    let mut q = EventQueue::new();
    assert!(q.is_empty());

    q.schedule(SimTime::from_millis(100), SimEvent::GcdEnd);
    assert!(!q.is_empty());

    let ev = q.pop().unwrap();
    assert_eq!(ev.time.as_millis(), 100);
    assert!(matches!(ev.event, SimEvent::GcdEnd));
    assert!(q.is_empty());
}

#[test]
fn event_queue_ordering() {
    let mut q = EventQueue::new();

    q.schedule(SimTime::from_millis(3000), SimEvent::SimEnd);
    q.schedule(SimTime::from_millis(1000), SimEvent::GcdEnd);
    q.schedule(SimTime::from_millis(2000), SimEvent::ResourceTick);

    let e1 = q.pop().unwrap();
    let e2 = q.pop().unwrap();
    let e3 = q.pop().unwrap();

    assert_eq!(e1.time.as_millis(), 1000);
    assert_eq!(e2.time.as_millis(), 2000);
    assert_eq!(e3.time.as_millis(), 3000);
}

#[test]
fn event_queue_same_time_fifo() {
    let mut q = EventQueue::new();

    // Schedule multiple events at the same time
    q.schedule(SimTime::from_millis(1000), SimEvent::GcdEnd);
    q.schedule(SimTime::from_millis(1000), SimEvent::ResourceTick);
    q.schedule(SimTime::from_millis(1000), SimEvent::SimEnd);

    // Should come out in FIFO order
    let e1 = q.pop().unwrap();
    let e2 = q.pop().unwrap();
    let e3 = q.pop().unwrap();

    assert!(matches!(e1.event, SimEvent::GcdEnd));
    assert!(matches!(e2.event, SimEvent::ResourceTick));
    assert!(matches!(e3.event, SimEvent::SimEnd));
}

#[test]
fn event_queue_schedule_in() {
    let mut q = EventQueue::new();
    let now = SimTime::from_millis(1000);

    q.schedule_in(now, SimTime::from_millis(500), SimEvent::GcdEnd);

    let ev = q.pop().unwrap();
    assert_eq!(ev.time.as_millis(), 1500);
}

#[test]
fn event_queue_clear() {
    let mut q = EventQueue::new();

    for i in 0..100 {
        q.schedule(SimTime::from_millis(i * 100), SimEvent::GcdEnd);
    }
    assert!(!q.is_empty());
    assert_eq!(q.events_scheduled, 100);

    q.clear();
    assert!(q.is_empty());
    assert_eq!(q.events_scheduled, 0);
    assert_eq!(q.events_processed, 0);
}

#[test]
fn event_queue_peek() {
    let mut q = EventQueue::new();

    q.schedule(SimTime::from_millis(1000), SimEvent::GcdEnd);
    q.schedule(SimTime::from_millis(500), SimEvent::ResourceTick);

    // Peek should return earliest without removing
    let peeked = q.peek().unwrap();
    assert_eq!(peeked.time.as_millis(), 500);

    // Pop should return same event
    let popped = q.pop().unwrap();
    assert_eq!(popped.time.as_millis(), 500);

    // Next peek/pop should be the other event
    let next = q.pop().unwrap();
    assert_eq!(next.time.as_millis(), 1000);
}

#[test]
fn rng_distribution() {
    let mut rng = FastRng::new(12345);

    // Check f32 is in [0, 1)
    for _ in 0..1000 {
        let v = rng.next_f32();
        assert!((0.0..1.0).contains(&v));
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
        assert!((10.0..=20.0).contains(&v));
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

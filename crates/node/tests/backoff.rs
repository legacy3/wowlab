use std::time::Duration;
use wowlab_node::utils::backoff::ExponentialBackoff;

#[test]
fn test_new() {
    let backoff = ExponentialBackoff::new(Duration::from_secs(5), Duration::from_secs(300));
    assert_eq!(backoff.current_backoff(), Duration::from_secs(5));
}

#[test]
fn test_exponential_increase() {
    let mut backoff = ExponentialBackoff::new(Duration::from_secs(1), Duration::from_secs(60));

    assert_eq!(backoff.current_backoff(), Duration::from_secs(1));

    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(2));

    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(4));

    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(8));
}

#[test]
fn test_max_cap() {
    let mut backoff = ExponentialBackoff::new(Duration::from_secs(32), Duration::from_secs(60));

    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(60));

    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(60));
}

#[test]
fn test_reset() {
    let mut backoff = ExponentialBackoff::new(Duration::from_secs(5), Duration::from_secs(300));

    backoff.on_retry();
    backoff.on_retry();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(20));

    backoff.reset();
    assert_eq!(backoff.current_backoff(), Duration::from_secs(5));
}

#[test]
fn test_scheduling() {
    let mut backoff = ExponentialBackoff::new(Duration::from_millis(10), Duration::from_secs(1));

    assert!(!backoff.should_retry());
    assert!(backoff.time_until_retry().is_none());

    let _ = backoff.next_retry_at();
    assert!(backoff.time_until_retry().is_some());
    assert!(!backoff.should_retry());

    std::thread::sleep(Duration::from_millis(15));
    assert!(backoff.should_retry());
}

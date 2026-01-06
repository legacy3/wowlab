use super::*;

#[test]
fn summary_basic() {
    let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let stats = Summary::new(values);

    assert_eq!(stats.count(), 5);
    assert!((stats.mean() - 3.0).abs() < 1e-10);
    assert_eq!(stats.min(), 1.0);
    assert_eq!(stats.max(), 5.0);
}

#[test]
fn running_basic() {
    let mut running = RunningStats::new();
    for v in [1.0, 2.0, 3.0, 4.0, 5.0] {
        running.push(v);
    }

    assert_eq!(running.count(), 5);
    assert!((running.mean() - 3.0).abs() < 1e-10);
    assert_eq!(running.min(), 1.0);
    assert_eq!(running.max(), 5.0);
}

#[test]
fn running_merge() {
    let mut a = RunningStats::new();
    for v in [1.0, 2.0, 3.0] {
        a.push(v);
    }

    let mut b = RunningStats::new();
    for v in [4.0, 5.0] {
        b.push(v);
    }

    a.merge(&b);

    assert_eq!(a.count(), 5);
    assert!((a.mean() - 3.0).abs() < 1e-10);
    assert_eq!(a.min(), 1.0);
    assert_eq!(a.max(), 5.0);
}

#[test]
fn running_variance_matches_summary() {
    let values = vec![2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];

    let summary = Summary::new(values.clone());

    let mut running = RunningStats::new();
    for v in values {
        running.push(v);
    }

    assert!((summary.mean() - running.mean()).abs() < 1e-10);
    assert!((summary.variance() - running.variance()).abs() < 1e-10);
    assert!((summary.std_dev() - running.std_dev()).abs() < 1e-10);
}

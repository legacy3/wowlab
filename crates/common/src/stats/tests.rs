use super::*;

#[test]
fn streaming_basic() {
    let mut s = Streaming::new();
    s.push(1.0);
    s.push(2.0);
    s.push(3.0);
    s.push(4.0);
    s.push(5.0);

    assert_eq!(s.count(), 5);
    assert!((s.mean() - 3.0).abs() < 1e-10);
    assert_eq!(s.min(), 1.0);
    assert_eq!(s.max(), 5.0);
}

#[test]
fn streaming_from_iter() {
    let s: Streaming = vec![1.0, 2.0, 3.0, 4.0, 5.0].into_iter().collect();

    assert_eq!(s.count(), 5);
    assert!((s.mean() - 3.0).abs() < 1e-10);
}

#[test]
fn streaming_merge() {
    let mut a: Streaming = vec![1.0, 2.0, 3.0].into_iter().collect();
    let b: Streaming = vec![4.0, 5.0].into_iter().collect();

    a.merge(&b);

    assert_eq!(a.count(), 5);
    assert!((a.mean() - 3.0).abs() < 1e-10);
    assert_eq!(a.min(), 1.0);
    assert_eq!(a.max(), 5.0);
}

#[test]
fn streaming_empty() {
    let s = Streaming::new();

    assert_eq!(s.count(), 0);
    assert!(s.mean().is_nan());
    assert!(s.variance().is_nan());
    assert!(s.min().is_nan());
    assert!(s.max().is_nan());
}

#[test]
fn batch_basic() {
    let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let stats = Batch::new(values);

    assert_eq!(stats.count(), 5);
    assert!((stats.mean() - 3.0).abs() < 1e-10);
    assert_eq!(stats.min(), 1.0);
    assert_eq!(stats.max(), 5.0);
}

#[test]
fn batch_variance() {
    let values = vec![2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];
    let stats = Batch::new(values);

    assert!((stats.mean() - 5.0).abs() < 1e-10);
    assert!((stats.variance() - 4.571428571428571).abs() < 1e-10);
}

#[test]
fn batch_percentiles() {
    let values = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
    let mut stats = Batch::new(values);

    assert!((stats.median() - 5.5).abs() < 0.1);
    assert!((stats.percentile(25) - 3.0).abs() < 0.5);
    assert!((stats.percentile(75) - 8.0).abs() < 0.5);
}

#[test]
fn batch_empty() {
    let stats = Batch::new(vec![]);

    assert_eq!(stats.count(), 0);
    assert!(stats.mean().is_nan());
    assert!(stats.min().is_nan());
    assert!(stats.max().is_nan());
}

#[test]
fn test_covariance() {
    let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let y = vec![2.0, 4.0, 6.0, 8.0, 10.0];
    let cov = covariance(&x, &y);
    assert!((cov - 5.0).abs() < 1e-10);
}

#[test]
fn test_correlation() {
    let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let y = vec![2.0, 4.0, 6.0, 8.0, 10.0];
    let corr = correlation(&x, &y);
    assert!((corr - 1.0).abs() < 1e-10);
}

#[test]
fn test_linear_regression() {
    let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let y = vec![3.0, 5.0, 7.0, 9.0, 11.0];
    let result = linear_regression(&x, &y).unwrap();
    assert!((result.slope - 2.0).abs() < 1e-10);
    assert!((result.intercept - 1.0).abs() < 1e-10);
    assert!((result.r_squared - 1.0).abs() < 1e-10);
}

#[test]
fn test_ema() {
    let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let result = ema(&data, 1.0);
    assert_eq!(result, data);

    let result = ema(&data, 0.0);
    assert_eq!(result, vec![1.0, 1.0, 1.0, 1.0, 1.0]);
}

#[test]
fn test_sma() {
    let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    let result = sma(&data, 3);
    assert_eq!(result.len(), 5);
    assert!((result[2] - 2.0).abs() < 1e-10);
    assert!((result[4] - 4.0).abs() < 1e-10);
}

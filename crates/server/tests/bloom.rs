use base64::Engine;
use wowlab_server::utils::bloom::{create_server_filter, filter_hash, BloomFilter};

#[test]
fn test_insert_and_contains() {
    let ids: Vec<String> = (0..100)
        .map(|i| format!("{}", 100000000000000000u64 + i))
        .collect();
    let filter = create_server_filter(&ids);

    for id in &ids {
        assert!(filter.might_contain(id), "false negative for {}", id);
    }
}

#[test]
fn test_false_positive_rate() {
    let n = 1000;
    let ids: Vec<String> = (0..n)
        .map(|i| format!("{}", 100000000000000000u64 + i))
        .collect();
    let filter = create_server_filter(&ids);

    let mut false_positives = 0;
    for i in n..(n + 10000) {
        let id = format!("{}", 100000000000000000u64 + i);
        if filter.might_contain(&id) {
            false_positives += 1;
        }
    }

    let fp_rate = false_positives as f64 / 10000.0;
    assert!(
        fp_rate < 0.005,
        "false positive rate {:.4} exceeds 0.5%",
        fp_rate
    );
}

#[test]
fn test_roundtrip_from_bytes() {
    let ids: Vec<String> = (0..500)
        .map(|i| format!("{}", 200000000000000000u64 + i))
        .collect();
    let filter = create_server_filter(&ids);
    let bytes = filter.into_bytes();

    let restored = BloomFilter::from_bytes(bytes, 500);
    for id in &ids {
        assert!(restored.might_contain(id), "lost {} after roundtrip", id);
    }
}

/// Deterministic test with fixed inputs. The TypeScript side must produce
/// identical results for the same inputs to prove interoperability.
#[test]
fn test_interop_vectors() {
    let ids = vec![
        "123456789012345678".to_string(),
        "987654321098765432".to_string(),
        "111222333444555666".to_string(),
    ];
    let filter = create_server_filter(&ids);
    let bytes = filter.as_bytes();
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    let hash = filter_hash(bytes);

    eprintln!("interop vector:");
    eprintln!("  base64: {}", b64);
    eprintln!("  hash: {}", hash);
    eprintln!("  byte_len: {}", bytes.len());

    assert!(filter.might_contain("123456789012345678"));
    assert!(filter.might_contain("987654321098765432"));
    assert!(filter.might_contain("111222333444555666"));

    assert!(!filter.might_contain("000000000000000000"));
    assert!(!filter.might_contain("999999999999999999"));

    assert_eq!(bytes.len(), 6, "filter byte length changed");
    assert_eq!(hash, "554721ba80ba8f66", "filter hash changed");
    assert_eq!(
        b64, "E5Nn44kd",
        "filter base64 changed - update TypeScript test vectors"
    );
}

#[test]
fn test_filter_sizing() {
    let ids: Vec<String> = (0..1000).map(|i| format!("{}", i)).collect();
    let filter = create_server_filter(&ids);
    let size = filter.as_bytes().len();

    assert!(
        size > 1500 && size < 2500,
        "unexpected filter size: {} bytes",
        size
    );
}

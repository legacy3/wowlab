//! Expression evaluation helpers.
//!
//! Provides utility functions for safe arithmetic operations including:
//! - Division by zero protection
//! - Float epsilon comparison
//! - True modulo operation (result has same sign as divisor)

/// Epsilon value for floating point comparisons.
pub const EPSILON: f64 = 1e-6;

/// Maximum allowed expression depth to prevent stack overflow.
pub const MAX_DEPTH: usize = 100;

/// Safe division that returns 0.0 when dividing by zero.
///
/// # Examples
/// ```
/// use engine::rotation::eval::safe_div;
/// assert_eq!(safe_div(10.0, 2.0), 5.0);
/// assert_eq!(safe_div(10.0, 0.0), 0.0);
/// assert_eq!(safe_div(0.0, 0.0), 0.0);
/// ```
#[inline]
pub fn safe_div(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        0.0
    } else {
        a / b
    }
}

/// Float equality comparison using epsilon tolerance.
///
/// Returns true if the absolute difference between `a` and `b` is less than EPSILON.
///
/// # Examples
/// ```
/// use engine::rotation::eval::float_eq;
/// assert!(float_eq(1.0, 1.0 + 1e-7));
/// assert!(!float_eq(1.0, 1.1));
/// ```
#[inline]
pub fn float_eq(a: f64, b: f64) -> bool {
    (a - b).abs() < EPSILON
}

/// Float inequality comparison using epsilon tolerance.
///
/// Returns true if the absolute difference between `a` and `b` is >= EPSILON.
#[inline]
pub fn float_ne(a: f64, b: f64) -> bool {
    (a - b).abs() >= EPSILON
}

/// True modulo operation where the result has the same sign as the divisor.
///
/// This differs from Rust's `%` operator which returns a result with the
/// same sign as the dividend. True modulo is more mathematically consistent
/// for negative numbers.
///
/// # Examples
/// ```
/// use engine::rotation::eval::true_mod;
/// assert_eq!(true_mod(7.0, 3.0), 1.0);   // Standard case
/// assert_eq!(true_mod(-7.0, 3.0), 2.0);  // True modulo: -7 mod 3 = 2 (not -1)
/// assert_eq!(true_mod(7.0, -3.0), -2.0); // Result has sign of divisor
/// assert_eq!(true_mod(-7.0, -3.0), -1.0);
/// assert_eq!(true_mod(5.0, 0.0), 0.0);   // Division by zero returns 0
/// ```
#[inline]
pub fn true_mod(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        return 0.0;
    }
    ((a % b) + b) % b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_div_normal() {
        assert_eq!(safe_div(10.0, 2.0), 5.0);
        assert_eq!(safe_div(7.0, 2.0), 3.5);
        assert_eq!(safe_div(-10.0, 2.0), -5.0);
        assert_eq!(safe_div(10.0, -2.0), -5.0);
    }

    #[test]
    fn test_safe_div_zero() {
        assert_eq!(safe_div(10.0, 0.0), 0.0);
        assert_eq!(safe_div(-10.0, 0.0), 0.0);
        assert_eq!(safe_div(0.0, 0.0), 0.0);
    }

    #[test]
    fn test_float_eq() {
        // Equal within epsilon
        assert!(float_eq(1.0, 1.0));
        assert!(float_eq(1.0, 1.0 + 1e-7));
        assert!(float_eq(1.0, 1.0 - 1e-7));

        // Not equal (difference >= epsilon)
        assert!(!float_eq(1.0, 1.0 + 1e-5));
        assert!(!float_eq(1.0, 1.1));
        assert!(!float_eq(0.0, 1.0));
    }

    #[test]
    fn test_float_ne() {
        // Not equal (difference >= epsilon)
        assert!(float_ne(1.0, 1.0 + 1e-5));
        assert!(float_ne(1.0, 1.1));
        assert!(float_ne(0.0, 1.0));

        // Equal within epsilon
        assert!(!float_ne(1.0, 1.0));
        assert!(!float_ne(1.0, 1.0 + 1e-7));
    }

    #[test]
    fn test_true_mod_positive() {
        assert_eq!(true_mod(7.0, 3.0), 1.0);
        assert_eq!(true_mod(10.0, 5.0), 0.0);
        assert_eq!(true_mod(5.5, 2.0), 1.5);
    }

    #[test]
    fn test_true_mod_negative_dividend() {
        // This is the key difference from standard modulo
        // Standard: -7 % 3 = -1
        // True mod: -7 mod 3 = 2
        assert_eq!(true_mod(-7.0, 3.0), 2.0);
        assert_eq!(true_mod(-10.0, 3.0), 2.0);
        assert_eq!(true_mod(-1.0, 3.0), 2.0);
    }

    #[test]
    fn test_true_mod_negative_divisor() {
        // Result has same sign as divisor
        assert_eq!(true_mod(7.0, -3.0), -2.0);
        assert_eq!(true_mod(10.0, -3.0), -2.0);
    }

    #[test]
    fn test_true_mod_both_negative() {
        assert_eq!(true_mod(-7.0, -3.0), -1.0);
        assert_eq!(true_mod(-10.0, -3.0), -1.0);
    }

    #[test]
    fn test_true_mod_zero_divisor() {
        assert_eq!(true_mod(5.0, 0.0), 0.0);
        assert_eq!(true_mod(-5.0, 0.0), 0.0);
        assert_eq!(true_mod(0.0, 0.0), 0.0);
    }
}

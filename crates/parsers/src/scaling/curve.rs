//! Curve interpolation for item scaling
//!
//! WoW uses curves to define how values scale with item level or other parameters.
//! Curves consist of points that are linearly interpolated between.

use wowlab_types::data::{CurvePointFlat, ItemScalingData};

/// Interpolate a curve at a given x value.
///
/// Curves are piecewise linear interpolation between points.
/// If x is below the first point, returns the first point's y value.
/// If x is above the last point, returns the last point's y value.
///
/// # Arguments
/// * `scaling_data` - The scaling data bundle containing curve points
/// * `curve_id` - The curve ID to look up
/// * `x` - The x value to interpolate at (typically item level)
///
/// # Returns
/// The interpolated y value, or None if the curve doesn't exist
pub fn interpolate_curve(scaling_data: &ItemScalingData, curve_id: i32, x: f64) -> Option<f64> {
    let points = scaling_data.curve_points.get(&curve_id)?;
    interpolate_curve_points(points, x)
}

/// Interpolate curve points directly (for when you already have the points).
pub fn interpolate_curve_points(points: &[CurvePointFlat], x: f64) -> Option<f64> {
    if points.is_empty() {
        return None;
    }

    // Points should be sorted by order_index, but let's ensure by pos_0 (x value)
    let mut sorted_points: Vec<_> = points.iter().collect();
    sorted_points.sort_by(|a, b| a.pos_0.partial_cmp(&b.pos_0).unwrap_or(std::cmp::Ordering::Equal));

    // Clamp to bounds
    let first = sorted_points.first()?;
    let last = sorted_points.last()?;

    if x <= first.pos_0 {
        return Some(first.pos_1);
    }
    if x >= last.pos_0 {
        return Some(last.pos_1);
    }

    // Find the two points to interpolate between
    for window in sorted_points.windows(2) {
        let p1 = window[0];
        let p2 = window[1];

        if x >= p1.pos_0 && x <= p2.pos_0 {
            // Linear interpolation
            let t = (x - p1.pos_0) / (p2.pos_0 - p1.pos_0);
            let y = p1.pos_1 + t * (p2.pos_1 - p1.pos_1);
            return Some(y);
        }
    }

    // Fallback (shouldn't reach here)
    Some(last.pos_1)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_points(data: &[(f64, f64)]) -> Vec<CurvePointFlat> {
        data.iter()
            .enumerate()
            .map(|(i, (x, y))| CurvePointFlat {
                id: i as i32,
                curve_id: 1,
                order_index: i as i32,
                pos_0: *x,
                pos_1: *y,
                pos_pre_squish_0: *x,
                pos_pre_squish_1: *y,
            })
            .collect()
    }

    #[test]
    fn test_interpolate_exact_point() {
        let points = make_points(&[(100.0, 50.0), (200.0, 100.0), (300.0, 150.0)]);
        assert_eq!(interpolate_curve_points(&points, 100.0), Some(50.0));
        assert_eq!(interpolate_curve_points(&points, 200.0), Some(100.0));
        assert_eq!(interpolate_curve_points(&points, 300.0), Some(150.0));
    }

    #[test]
    fn test_interpolate_between_points() {
        let points = make_points(&[(100.0, 50.0), (200.0, 100.0)]);
        assert_eq!(interpolate_curve_points(&points, 150.0), Some(75.0));
    }

    #[test]
    fn test_interpolate_clamp_below() {
        let points = make_points(&[(100.0, 50.0), (200.0, 100.0)]);
        assert_eq!(interpolate_curve_points(&points, 50.0), Some(50.0));
    }

    #[test]
    fn test_interpolate_clamp_above() {
        let points = make_points(&[(100.0, 50.0), (200.0, 100.0)]);
        assert_eq!(interpolate_curve_points(&points, 250.0), Some(100.0));
    }

    #[test]
    fn test_interpolate_empty() {
        let points: Vec<CurvePointFlat> = vec![];
        assert_eq!(interpolate_curve_points(&points, 100.0), None);
    }
}

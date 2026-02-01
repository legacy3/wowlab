//! SIMD batch calculations for damage processing.
//!
//! Uses wide::f32x8 for 8-wide parallel calculations.

use wide::f32x8;

/// Calculate damage for 8 instances in parallel.
///
/// Formula: (base + ap * ap_coeff) * multiplier
#[inline]
pub fn calculate_damage_batch(base: f32x8, ap: f32x8, ap_coeff: f32x8, multiplier: f32x8) -> f32x8 {
    (base + ap * ap_coeff) * multiplier
}

/// Calculate damage with spell power for 8 instances in parallel.
///
/// Formula: (base + sp * sp_coeff) * multiplier
#[inline]
pub fn calculate_spell_damage_batch(
    base: f32x8,
    sp: f32x8,
    sp_coeff: f32x8,
    multiplier: f32x8,
) -> f32x8 {
    (base + sp * sp_coeff) * multiplier
}

/// Calculate weapon damage for 8 instances in parallel.
///
/// Formula: weapon_damage * weapon_coeff * multiplier
#[inline]
pub fn calculate_weapon_damage_batch(
    weapon_damage: f32x8,
    weapon_coeff: f32x8,
    multiplier: f32x8,
) -> f32x8 {
    weapon_damage * weapon_coeff * multiplier
}

/// Apply crit multiplier to 8 damage values.
///
/// For each lane: if crit_mask bit is set, apply crit_mult, else keep original.
#[inline]
pub fn apply_crit_batch(damage: f32x8, crit_mult: f32x8, crit_mask: [bool; 8]) -> f32x8 {
    let mask = f32x8::from([
        if crit_mask[0] { 1.0 } else { 0.0 },
        if crit_mask[1] { 1.0 } else { 0.0 },
        if crit_mask[2] { 1.0 } else { 0.0 },
        if crit_mask[3] { 1.0 } else { 0.0 },
        if crit_mask[4] { 1.0 } else { 0.0 },
        if crit_mask[5] { 1.0 } else { 0.0 },
        if crit_mask[6] { 1.0 } else { 0.0 },
        if crit_mask[7] { 1.0 } else { 0.0 },
    ]);
    let inv_mask = f32x8::splat(1.0) - mask;
    damage * (inv_mask + mask * crit_mult)
}

/// Sum all 8 lanes of an f32x8.
#[inline]
pub fn horizontal_sum(v: f32x8) -> f32 {
    let arr: [f32; 8] = v.into();
    arr.iter().sum()
}

/// Get minimum value across all 8 lanes.
#[inline]
pub fn horizontal_min(v: f32x8) -> f32 {
    let arr: [f32; 8] = v.into();
    arr.iter().cloned().fold(f32::INFINITY, f32::min)
}

/// Get maximum value across all 8 lanes.
#[inline]
pub fn horizontal_max(v: f32x8) -> f32 {
    let arr: [f32; 8] = v.into();
    arr.iter().cloned().fold(f32::NEG_INFINITY, f32::max)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_damage_batch() {
        let base = f32x8::splat(100.0);
        let ap = f32x8::from([
            1000.0, 1100.0, 1200.0, 1300.0, 1400.0, 1500.0, 1600.0, 1700.0,
        ]);
        let ap_coeff = f32x8::splat(0.5);
        let mult = f32x8::splat(1.0);

        let damage = calculate_damage_batch(base, ap, ap_coeff, mult);
        let arr: [f32; 8] = damage.into();

        assert_eq!(arr[0], 600.0); // 100 + 1000 * 0.5
        assert_eq!(arr[7], 950.0); // 100 + 1700 * 0.5
    }

    #[test]
    fn test_horizontal_sum() {
        let v = f32x8::from([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]);
        assert_eq!(horizontal_sum(v), 36.0);
    }

    #[test]
    fn test_crit_batch() {
        let damage = f32x8::splat(100.0);
        let crit_mult = f32x8::splat(2.0);
        let mask = [true, false, true, false, false, false, false, false];

        let result = apply_crit_batch(damage, crit_mult, mask);
        let arr: [f32; 8] = result.into();

        assert_eq!(arr[0], 200.0); // crit
        assert_eq!(arr[1], 100.0); // no crit
        assert_eq!(arr[2], 200.0); // crit
    }
}

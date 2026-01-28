use wowlab_common::types::RatingType;

/// Rating values (raw numbers from gear)
#[derive(Clone, Debug, Default)]
pub struct Ratings {
    pub crit: f32,
    pub haste: f32,
    pub mastery: f32,
    pub versatility: f32,
    pub leech: f32,
    pub avoidance: f32,
    pub speed: f32,
}

impl Ratings {
    pub fn get(&self, rating: RatingType) -> f32 {
        match rating {
            RatingType::Crit => self.crit,
            RatingType::Haste => self.haste,
            RatingType::Mastery => self.mastery,
            RatingType::Versatility => self.versatility,
            RatingType::Leech => self.leech,
            RatingType::Avoidance => self.avoidance,
            RatingType::Speed => self.speed,
        }
    }

    pub fn set(&mut self, rating: RatingType, value: f32) {
        match rating {
            RatingType::Crit => self.crit = value,
            RatingType::Haste => self.haste = value,
            RatingType::Mastery => self.mastery = value,
            RatingType::Versatility => self.versatility = value,
            RatingType::Leech => self.leech = value,
            RatingType::Avoidance => self.avoidance = value,
            RatingType::Speed => self.speed = value,
        }
    }

    pub fn add(&mut self, rating: RatingType, value: f32) {
        match rating {
            RatingType::Crit => self.crit += value,
            RatingType::Haste => self.haste += value,
            RatingType::Mastery => self.mastery += value,
            RatingType::Versatility => self.versatility += value,
            RatingType::Leech => self.leech += value,
            RatingType::Avoidance => self.avoidance += value,
            RatingType::Speed => self.speed += value,
        }
    }
}

/// Rating to percentage conversion at level 80
/// Uses diminishing returns formula: pct = base_pct * (1 - (1 - C) ^ (rating / base_rating))
const BASE_RATING_80: f32 = 180.0;

/// Convert rating to percentage (with DR)
pub fn rating_to_percent(rating: f32, rating_type: RatingType) -> f32 {
    let base_pct = base_percent_per_point(rating_type);
    let raw = rating * base_pct / BASE_RATING_80;

    // Apply diminishing returns
    apply_diminishing_returns(raw, rating_type)
}

fn base_percent_per_point(rating_type: RatingType) -> f32 {
    match rating_type {
        RatingType::Crit => 1.0,
        RatingType::Haste => 1.0,
        RatingType::Mastery => 1.0,     // Multiplied by spec coefficient
        RatingType::Versatility => 1.0, // Damage/healing, half for DR
        RatingType::Leech => 1.0,
        RatingType::Avoidance => 1.0,
        RatingType::Speed => 1.0,
    }
}

/// Diminishing returns formula
fn apply_diminishing_returns(raw_pct: f32, rating_type: RatingType) -> f32 {
    // DR thresholds and coefficients
    let (threshold, coeff) = match rating_type {
        RatingType::Crit | RatingType::Haste | RatingType::Versatility => (30.0, 0.4),
        RatingType::Mastery => (30.0, 0.4),
        _ => return raw_pct, // No DR for tertiary
    };

    if raw_pct <= threshold {
        raw_pct
    } else {
        let over = raw_pct - threshold;
        threshold + over * coeff / (1.0 + over * coeff / 100.0)
    }
}

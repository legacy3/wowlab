use serde::{Serialize, Deserialize};

/// Simulation time in milliseconds
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct SimTime(pub u32);

impl SimTime {
    pub const ZERO: SimTime = SimTime(0);
    pub const MAX: SimTime = SimTime(u32::MAX);

    #[inline]
    pub const fn from_millis(ms: u32) -> Self {
        SimTime(ms)
    }

    #[inline]
    pub const fn from_secs(secs: u32) -> Self {
        SimTime(secs * 1000)
    }

    #[inline]
    pub fn from_secs_f32(secs: f32) -> Self {
        SimTime((secs * 1000.0) as u32)
    }

    #[inline]
    pub const fn as_millis(self) -> u32 {
        self.0
    }

    #[inline]
    pub fn as_secs_f32(self) -> f32 {
        self.0 as f32 / 1000.0
    }

    #[inline]
    pub const fn saturating_sub(self, other: SimTime) -> SimTime {
        SimTime(self.0.saturating_sub(other.0))
    }

    #[inline]
    pub const fn saturating_add(self, other: SimTime) -> SimTime {
        SimTime(self.0.saturating_add(other.0))
    }
}

impl std::ops::Add for SimTime {
    type Output = SimTime;
    #[inline]
    fn add(self, rhs: SimTime) -> SimTime {
        SimTime(self.0 + rhs.0)
    }
}

impl std::ops::Sub for SimTime {
    type Output = SimTime;
    #[inline]
    fn sub(self, rhs: SimTime) -> SimTime {
        SimTime(self.0 - rhs.0)
    }
}

impl std::ops::AddAssign for SimTime {
    #[inline]
    fn add_assign(&mut self, rhs: SimTime) {
        self.0 += rhs.0;
    }
}

impl std::ops::SubAssign for SimTime {
    #[inline]
    fn sub_assign(&mut self, rhs: SimTime) {
        self.0 -= rhs.0;
    }
}

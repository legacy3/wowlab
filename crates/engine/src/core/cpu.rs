//! CPU detection utilities for optimal parallelism.

/// Returns the optimal number of CPU cores to use for compute-intensive work.
///
/// This mimics Mozilla's MLUtils::GetOptimalCPUConcurrency logic:
/// - On aarch64 (Apple Silicon/big.LITTLE): Use only performance cores
/// - On x86_64: Use physical cores (avoid hyperthreading siblings)
/// - Fallback: Use all logical CPUs
#[cfg(feature = "parallel")]
pub fn get_optimal_concurrency() -> usize {
    #[cfg(target_arch = "aarch64")]
    {
        get_aarch64_performance_cores().unwrap_or_else(rayon::current_num_threads)
    }

    #[cfg(target_arch = "x86_64")]
    {
        // Use physical cores (half of logical on hyperthreaded systems)
        std::thread::available_parallelism()
            .map(|p| p.get() / 2)
            .unwrap_or(1)
            .max(1)
    }

    #[cfg(not(any(target_arch = "aarch64", target_arch = "x86_64")))]
    {
        rayon::current_num_threads()
    }
}

/// On aarch64, detect performance cores.
#[cfg(all(feature = "parallel", target_arch = "aarch64"))]
fn get_aarch64_performance_cores() -> Option<usize> {
    #[cfg(target_os = "macos")]
    {
        get_macos_perflevel_cores(0)
    }

    #[cfg(not(target_os = "macos"))]
    {
        None
    }
}

/// Query macOS sysctl for cores at a given performance level.
/// Level 0 = performance cores (P-cores), Level 1 = efficiency cores (E-cores)
#[cfg(all(feature = "parallel", target_arch = "aarch64", target_os = "macos"))]
fn get_macos_perflevel_cores(level: u32) -> Option<usize> {
    use std::ffi::CString;
    use std::mem::MaybeUninit;
    use std::os::raw::{c_int, c_void};

    extern "C" {
        fn sysctlbyname(
            name: *const i8,
            oldp: *mut c_void,
            oldlenp: *mut usize,
            newp: *mut c_void,
            newlen: usize,
        ) -> c_int;
    }

    let name = CString::new(format!("hw.perflevel{level}.logicalcpu")).ok()?;
    let mut value = MaybeUninit::<i32>::uninit();
    let mut size = std::mem::size_of::<i32>();

    let result = unsafe {
        sysctlbyname(
            name.as_ptr(),
            value.as_mut_ptr().cast(),
            &mut size,
            std::ptr::null_mut(),
            0,
        )
    };

    if result == 0 {
        let cores = unsafe { value.assume_init() };
        if cores > 0 {
            return Some(cores as usize);
        }
    }

    None
}

/// Configure rayon's global thread pool with the specified number of threads.
/// Must be called before any rayon operations.
#[cfg(feature = "parallel")]
pub fn configure_thread_pool(num_threads: usize) -> Result<(), rayon::ThreadPoolBuildError> {
    rayon::ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .build_global()
}

/// Configure rayon with optimal concurrency for this system.
/// Must be called before any rayon operations.
#[cfg(feature = "parallel")]
pub fn configure_optimal_thread_pool() -> Result<(), rayon::ThreadPoolBuildError> {
    configure_thread_pool(get_optimal_concurrency())
}

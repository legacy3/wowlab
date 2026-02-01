pub fn get_total_cores() -> usize {
    num_cpus::get()
}

/// Optimal cores for compute work: P-cores on ARM, physical on x86.
pub fn get_optimal_concurrency() -> usize {
    #[cfg(target_arch = "aarch64")]
    {
        get_aarch64_performance_cores().unwrap_or_else(num_cpus::get_physical)
    }

    #[cfg(target_arch = "x86_64")]
    {
        num_cpus::get_physical()
    }

    #[cfg(not(any(target_arch = "aarch64", target_arch = "x86_64")))]
    {
        num_cpus::get()
    }
}

#[cfg(target_arch = "aarch64")]
fn get_aarch64_performance_cores() -> Option<usize> {
    #[cfg(target_os = "macos")]
    {
        get_macos_perflevel_cores(0)
    }

    #[cfg(target_os = "linux")]
    {
        get_linux_big_cores()
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        None
    }
}

#[cfg(all(target_arch = "aarch64", target_os = "macos"))]
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

/// Detect big.LITTLE cores via sysfs cpu_capacity (>= 900 = big).
#[cfg(all(target_arch = "aarch64", target_os = "linux"))]
fn get_linux_big_cores() -> Option<usize> {
    use std::fs;
    use std::path::Path;

    let cpu_base = Path::new("/sys/devices/system/cpu");

    let cpu0_capacity = cpu_base.join("cpu0/cpu_capacity");
    if !cpu0_capacity.exists() {
        return None;
    }

    let mut big_cores = 0;
    let mut found_any = false;

    for entry in fs::read_dir(cpu_base).ok()? {
        let entry = entry.ok()?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();

        if !name_str.starts_with("cpu") {
            continue;
        }
        let cpu_num = name_str
            .strip_prefix("cpu")
            .and_then(|s| s.parse::<u32>().ok());
        if cpu_num.is_none() {
            continue;
        }

        let capacity_path = entry.path().join("cpu_capacity");
        if let Ok(content) = fs::read_to_string(&capacity_path) {
            if let Ok(capacity) = content.trim().parse::<u32>() {
                found_any = true;
                if capacity >= 900 {
                    big_cores += 1;
                }
            }
        }
    }

    if found_any && big_cores > 0 {
        Some(big_cores)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_total_cores_returns_positive() {
        let cores = get_total_cores();
        assert!(cores > 0, "Should return at least 1 core");
        println!("Total cores: {cores}");
    }

    #[test]
    fn test_optimal_concurrency_returns_positive() {
        let cores = get_optimal_concurrency();
        assert!(cores > 0, "Should return at least 1 core");
        println!("Optimal concurrency: {cores} cores");
    }

    #[test]
    fn test_optimal_le_total() {
        let optimal = get_optimal_concurrency();
        let total = get_total_cores();

        assert!(
            optimal <= total,
            "Optimal ({optimal}) should be <= total ({total})"
        );
    }
}

#[cfg(target_os = "linux")]
mod inner {
    pub fn read_memory_mb() -> f64 {
        let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) } as f64;
        std::fs::read_to_string("/proc/self/statm")
            .ok()
            .and_then(|s| {
                s.split_whitespace()
                    .nth(1)
                    .and_then(|p| p.parse::<u64>().ok())
            })
            .map(|pages| pages as f64 * page_size / (1024.0 * 1024.0))
            .unwrap_or(0.0)
    }

    pub fn read_load_average() -> [f64; 3] {
        let mut avg = [0.0f64; 3];
        let ret = unsafe { libc::getloadavg(avg.as_mut_ptr(), 3) };
        if ret == 3 {
            avg
        } else {
            [0.0; 3]
        }
    }

    fn read_cpu_times() -> Option<(u64, u64)> {
        let stat = std::fs::read_to_string("/proc/stat").ok()?;
        let cpu = stat.lines().find(|l| l.starts_with("cpu "))?;
        let mut parts = cpu
            .split_whitespace()
            .skip(1)
            .filter_map(|v| v.parse::<u64>().ok());
        let user = parts.next()?;
        let nice = parts.next()?;
        let system = parts.next()?;
        let idle = parts.next()?;
        let total = user + nice + system + idle;
        Some((total, idle))
    }

    pub async fn cpu_usage_percent() -> f64 {
        let Some((total1, idle1)) = read_cpu_times() else {
            return 0.0;
        };
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let Some((total2, idle2)) = read_cpu_times() else {
            return 0.0;
        };
        let total_delta = total2.saturating_sub(total1);
        if total_delta == 0 {
            return 0.0;
        }
        let idle_delta = idle2.saturating_sub(idle1);
        100.0 * (total_delta - idle_delta) as f64 / total_delta as f64
    }

    pub fn read_os_memory_mb() -> (f64, f64) {
        let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") else {
            return (0.0, 0.0);
        };
        let mut total = 0.0;
        let mut available = 0.0;
        for line in meminfo.lines() {
            if line.starts_with("MemTotal:") {
                total = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|v| v.parse::<f64>().ok())
                    .unwrap_or(0.0)
                    / 1024.0;
            } else if line.starts_with("MemAvailable:") {
                available = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|v| v.parse::<f64>().ok())
                    .unwrap_or(0.0)
                    / 1024.0;
            }
        }
        (total, available)
    }
}

#[cfg(target_os = "macos")]
mod inner {
    use std::mem;

    const KERN_SUCCESS: i32 = 0;
    const MACH_TASK_BASIC_INFO: u32 = 20;
    const HOST_CPU_LOAD_INFO: i32 = 3;
    const HOST_VM_INFO64: i32 = 4;

    #[repr(C)]
    struct MachTaskBasicInfo {
        virtual_size: u64,
        resident_size: u64,
        resident_size_max: u64,
        user_time: [i32; 2],
        system_time: [i32; 2],
        policy: i32,
        suspend_count: i32,
    }

    #[repr(C)]
    struct HostCpuLoadInfo {
        ticks: [u32; 4],
    }

    #[repr(C)]
    struct VmStatistics64 {
        free_count: u32,
        active_count: u32,
        inactive_count: u32,
        wire_count: u32,
        zero_fill_count: u64,
        reactivations: u64,
        pageins: u64,
        pageouts: u64,
        faults: u64,
        cow_faults: u64,
        lookups: u64,
        hits: u64,
        purges: u64,
        purgeable_count: u32,
        speculative_count: u32,
        decompressions: u64,
        compressions: u64,
        swapins: u64,
        swapouts: u64,
        compressor_page_count: u32,
        throttled_count: u32,
        external_page_count: u32,
        internal_page_count: u32,
        total_uncompressed_pages_in_compressor: u64,
    }

    extern "C" {
        fn mach_task_self() -> u32;
        fn mach_host_self() -> u32;
        fn task_info(
            target_task: u32,
            flavor: u32,
            task_info_out: *mut i32,
            task_info_count: *mut u32,
        ) -> i32;
        fn host_statistics(host: u32, flavor: i32, info: *mut i32, count: *mut u32) -> i32;
        fn host_statistics64(host: u32, flavor: i32, info: *mut i32, count: *mut u32) -> i32;
    }

    pub fn read_memory_mb() -> f64 {
        unsafe {
            let mut info: MachTaskBasicInfo = mem::zeroed();
            let mut count = (mem::size_of::<MachTaskBasicInfo>() / mem::size_of::<u32>()) as u32;
            let ret = task_info(
                mach_task_self(),
                MACH_TASK_BASIC_INFO,
                &mut info as *mut _ as *mut i32,
                &mut count,
            );
            if ret == KERN_SUCCESS {
                info.resident_size as f64 / (1024.0 * 1024.0)
            } else {
                0.0
            }
        }
    }

    pub fn read_load_average() -> [f64; 3] {
        let mut avg = [0.0f64; 3];
        let ret = unsafe { libc::getloadavg(avg.as_mut_ptr(), 3) };
        if ret == 3 {
            avg
        } else {
            [0.0; 3]
        }
    }

    fn read_cpu_ticks() -> Option<(u64, u64)> {
        unsafe {
            let mut info: HostCpuLoadInfo = mem::zeroed();
            let mut count = (mem::size_of::<HostCpuLoadInfo>() / mem::size_of::<u32>()) as u32;
            let ret = host_statistics(
                mach_host_self(),
                HOST_CPU_LOAD_INFO,
                &mut info as *mut _ as *mut i32,
                &mut count,
            );
            if ret != KERN_SUCCESS {
                return None;
            }
            let user = info.ticks[0] as u64;
            let system = info.ticks[1] as u64;
            let idle = info.ticks[2] as u64;
            let nice = info.ticks[3] as u64;
            let total = user + system + idle + nice;
            Some((total, idle))
        }
    }

    pub async fn cpu_usage_percent() -> f64 {
        let Some((total1, idle1)) = read_cpu_ticks() else {
            return 0.0;
        };
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let Some((total2, idle2)) = read_cpu_ticks() else {
            return 0.0;
        };
        let total_delta = total2.saturating_sub(total1);
        if total_delta == 0 {
            return 0.0;
        }
        let idle_delta = idle2.saturating_sub(idle1);
        100.0 * (total_delta - idle_delta) as f64 / total_delta as f64
    }

    pub fn read_os_memory_mb() -> (f64, f64) {
        let total = unsafe {
            let mut size: u64 = 0;
            let mut len = mem::size_of::<u64>();
            let ret = libc::sysctlbyname(
                c"hw.memsize".as_ptr(),
                &mut size as *mut _ as *mut libc::c_void,
                &mut len,
                std::ptr::null_mut(),
                0,
            );
            if ret == 0 {
                size as f64 / (1024.0 * 1024.0)
            } else {
                0.0
            }
        };

        let available = unsafe {
            let mut info: VmStatistics64 = mem::zeroed();
            let mut count = (mem::size_of::<VmStatistics64>() / mem::size_of::<u32>()) as u32;
            let ret = host_statistics64(
                mach_host_self(),
                HOST_VM_INFO64,
                &mut info as *mut _ as *mut i32,
                &mut count,
            );
            if ret == KERN_SUCCESS {
                let page_size = libc::sysconf(libc::_SC_PAGESIZE) as u64;
                let free_pages = info.free_count as u64
                    + info.inactive_count as u64
                    + info.purgeable_count as u64;
                (free_pages * page_size) as f64 / (1024.0 * 1024.0)
            } else {
                0.0
            }
        };

        (total, available)
    }
}

#[cfg(target_os = "windows")]
mod inner {
    use std::mem;

    #[repr(C)]
    struct ProcessMemoryCounters {
        cb: u32,
        page_fault_count: u32,
        peak_working_set_size: usize,
        working_set_size: usize,
        quota_peak_paged_pool_usage: usize,
        quota_paged_pool_usage: usize,
        quota_peak_non_paged_pool_usage: usize,
        quota_non_paged_pool_usage: usize,
        pagefile_usage: usize,
        peak_pagefile_usage: usize,
    }

    #[repr(C)]
    struct MemoryStatusEx {
        length: u32,
        memory_load: u32,
        total_phys: u64,
        avail_phys: u64,
        total_page_file: u64,
        avail_page_file: u64,
        total_virtual: u64,
        avail_virtual: u64,
        avail_extended_virtual: u64,
    }

    #[repr(C)]
    struct FileTime {
        low: u32,
        high: u32,
    }

    impl FileTime {
        fn as_u64(&self) -> u64 {
            (self.high as u64) << 32 | self.low as u64
        }
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GetCurrentProcess() -> isize;
        fn K32GetProcessMemoryInfo(
            process: isize,
            counters: *mut ProcessMemoryCounters,
            cb: u32,
        ) -> i32;
        fn GlobalMemoryStatusEx(status: *mut MemoryStatusEx) -> i32;
        fn GetSystemTimes(idle: *mut FileTime, kernel: *mut FileTime, user: *mut FileTime) -> i32;
    }

    pub fn read_memory_mb() -> f64 {
        unsafe {
            let mut counters: ProcessMemoryCounters = mem::zeroed();
            counters.cb = mem::size_of::<ProcessMemoryCounters>() as u32;
            let ret = K32GetProcessMemoryInfo(GetCurrentProcess(), &mut counters, counters.cb);
            if ret != 0 {
                counters.working_set_size as f64 / (1024.0 * 1024.0)
            } else {
                0.0
            }
        }
    }

    pub fn read_load_average() -> [f64; 3] {
        [0.0; 3]
    }

    fn read_cpu_times() -> Option<(u64, u64)> {
        unsafe {
            let mut idle = mem::zeroed::<FileTime>();
            let mut kernel = mem::zeroed::<FileTime>();
            let mut user = mem::zeroed::<FileTime>();
            let ret = GetSystemTimes(&mut idle, &mut kernel, &mut user);
            if ret == 0 {
                return None;
            }
            let idle_time = idle.as_u64();
            let total_time = kernel.as_u64() + user.as_u64();
            Some((total_time, idle_time))
        }
    }

    pub async fn cpu_usage_percent() -> f64 {
        let Some((total1, idle1)) = read_cpu_times() else {
            return 0.0;
        };
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let Some((total2, idle2)) = read_cpu_times() else {
            return 0.0;
        };
        let total_delta = total2.saturating_sub(total1);
        if total_delta == 0 {
            return 0.0;
        }
        let idle_delta = idle2.saturating_sub(idle1);
        100.0 * (total_delta - idle_delta) as f64 / total_delta as f64
    }

    pub fn read_os_memory_mb() -> (f64, f64) {
        unsafe {
            let mut status: MemoryStatusEx = mem::zeroed();
            status.length = mem::size_of::<MemoryStatusEx>() as u32;
            let ret = GlobalMemoryStatusEx(&mut status);
            if ret != 0 {
                let total = status.total_phys as f64 / (1024.0 * 1024.0);
                let available = status.avail_phys as f64 / (1024.0 * 1024.0);
                (total, available)
            } else {
                (0.0, 0.0)
            }
        }
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
mod inner {
    pub fn read_memory_mb() -> f64 {
        0.0
    }

    pub fn read_load_average() -> [f64; 3] {
        [0.0; 3]
    }

    pub async fn cpu_usage_percent() -> f64 {
        0.0
    }

    pub fn read_os_memory_mb() -> (f64, f64) {
        (0.0, 0.0)
    }
}

pub use inner::cpu_usage_percent;
pub use inner::read_load_average;
pub use inner::read_memory_mb;
pub use inner::read_os_memory_mb;

pub fn format_bytes(bytes: usize) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    }
}

pub fn format_uptime(secs: u64) -> String {
    let days = secs / 86400;
    let hours = (secs % 86400) / 3600;
    let minutes = (secs % 3600) / 60;

    if days > 0 {
        format!("{}d {}h {}m", days, hours, minutes)
    } else if hours > 0 {
        format!("{}h {}m", hours, minutes)
    } else {
        format!("{}m", minutes)
    }
}

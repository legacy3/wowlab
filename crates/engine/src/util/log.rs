/// Debug logging macro - compiles to nothing in release builds
#[cfg(feature = "debug_logging")]
#[macro_export]
macro_rules! debug_log {
    ($($arg:tt)*) => {{
        web_sys::console::log_1(&format!($($arg)*).into());
    }};
}

#[cfg(not(feature = "debug_logging"))]
#[macro_export]
macro_rules! debug_log {
    ($($arg:tt)*) => {{}};
}

/// Warning log - always enabled
#[macro_export]
macro_rules! warn_log {
    ($($arg:tt)*) => {{
        #[cfg(target_arch = "wasm32")]
        web_sys::console::warn_1(&format!($($arg)*).into());
        #[cfg(not(target_arch = "wasm32"))]
        eprintln!("[WARN] {}", format!($($arg)*));
    }};
}

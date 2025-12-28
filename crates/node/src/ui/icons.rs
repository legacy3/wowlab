//! Icon helpers using Lucide icons

pub use lucide_icons::Icon;

/// Render an icon as a string for egui labels
pub fn icon(i: Icon) -> String {
    char::from(i).to_string()
}

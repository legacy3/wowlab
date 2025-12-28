pub use lucide_icons::Icon;

pub fn icon(i: Icon) -> String {
    char::from(i).to_string()
}

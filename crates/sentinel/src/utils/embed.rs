/// Builder for Discord embed description content with markdown formatting.
///
/// ```ignore
/// let content = EmbedContent::new()
///     .field("Uptime", "2h 31m")
///     .field("Memory", "12.4 MB")
///     .section("Scheduler")
///     .field("Completed", "142 chunks")
///     .line("Running: 3 · Pending: 7")
///     .section("Bloom Filters")
///     .kv("Guilds", 5)
///     .kv("Members", 1832)
///     .build();
/// ```
#[derive(Default)]
pub struct EmbedContent {
    parts: Vec<Part>,
}

enum Part {
    Field(String, String),
    Section(String),
    Line(String),
}

impl EmbedContent {
    pub fn new() -> Self {
        Self { parts: Vec::new() }
    }

    /// Bold label with value: `**Label:** value`
    pub fn field(mut self, label: &str, value: impl std::fmt::Display) -> Self {
        self.parts
            .push(Part::Field(label.to_string(), value.to_string()));
        self
    }

    /// Key-value shorthand (same as field, just reads nicer for numeric values).
    pub fn kv(self, label: &str, value: impl std::fmt::Display) -> Self {
        self.field(label, value)
    }

    /// Section header with automatic spacing: `\n**Header**`
    pub fn section(mut self, title: &str) -> Self {
        self.parts.push(Part::Section(title.to_string()));
        self
    }

    /// Plain text line.
    pub fn line(mut self, text: impl std::fmt::Display) -> Self {
        self.parts.push(Part::Line(text.to_string()));
        self
    }

    /// Build the final markdown string for use in embed `.description()`.
    pub fn build(self) -> String {
        let mut out = String::new();

        for (i, part) in self.parts.iter().enumerate() {
            match part {
                Part::Field(label, value) => {
                    out.push_str(&format!("**{}:** {}\n", label, value));
                }
                Part::Section(title) => {
                    if i > 0 {
                        out.push('\n');
                    }
                    out.push_str(&format!("**{}**\n", title));
                }
                Part::Line(text) => {
                    out.push_str(text);
                    out.push('\n');
                }
            }
        }

        // Trim trailing newline
        if out.ends_with('\n') {
            out.pop();
        }

        out
    }
}

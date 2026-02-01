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

    pub fn field(mut self, label: &str, value: impl std::fmt::Display) -> Self {
        self.parts
            .push(Part::Field(label.to_string(), value.to_string()));
        self
    }

    pub fn kv(self, label: &str, value: impl std::fmt::Display) -> Self {
        self.field(label, value)
    }

    pub fn section(mut self, title: &str) -> Self {
        self.parts.push(Part::Section(title.to_string()));
        self
    }

    pub fn line(mut self, text: impl std::fmt::Display) -> Self {
        self.parts.push(Part::Line(text.to_string()));
        self
    }

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

        if out.ends_with('\n') {
            out.pop();
        }

        out
    }
}

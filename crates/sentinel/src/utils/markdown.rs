//! Discord markdown formatting utilities.
//!
//! Provides functions and builders for consistent markdown formatting across the bot.
//!
//! # Basic Formatting
//!
//! ```ignore
//! use crate::utils::markdown as md;
//!
//! md::bold("important")           // **important**
//! md::italic("emphasis")          // *emphasis*
//! md::code("inline")              // `inline`
//! md::code_block("rust", "code")  // ```rust\ncode\n```
//! md::link("text", "url")         // [text](url)
//! md::channel(123456789)          // <#123456789>
//! md::user(123456789)             // <@123456789>
//! ```
//!
//! # Tables
//!
//! ```ignore
//! let table = md::Table::new()
//!     .headers(["Name", "Status", "Chunks"])
//!     .row(["node-1", "online", "42"])
//!     .row(["node-2", "offline", "0"])
//!     .build();
//! ```

use std::fmt::Display;

// =============================================================================
// Basic Formatting Functions
// =============================================================================

/// Bold text: `**text**`
#[inline]
pub fn bold(text: impl Display) -> String {
    format!("**{}**", text)
}

/// Italic text: `*text*`
#[inline]
pub fn italic(text: impl Display) -> String {
    format!("*{}*", text)
}

/// Bold and italic: `***text***`
#[inline]
pub fn bold_italic(text: impl Display) -> String {
    format!("***{}***", text)
}

/// Underline text: `__text__`
#[inline]
pub fn underline(text: impl Display) -> String {
    format!("__{}__", text)
}

/// Strikethrough text: `~~text~~`
#[inline]
pub fn strike(text: impl Display) -> String {
    format!("~~{}~~", text)
}

/// Underline + italic: `__*text*__`
#[inline]
pub fn underline_italic(text: impl Display) -> String {
    format!("__*{}*__", text)
}

/// Underline + bold: `__**text**__`
#[inline]
pub fn underline_bold(text: impl Display) -> String {
    format!("__**{}**__", text)
}

/// Underline + bold + italic: `__***text***__`
#[inline]
pub fn underline_bold_italic(text: impl Display) -> String {
    format!("__***{}***__", text)
}

/// Inline code: `` `text` ``
#[inline]
pub fn code(text: impl Display) -> String {
    format!("`{}`", text)
}

/// Code block with optional language.
///
/// ```ignore
/// code_block("rust", "let x = 1;")
/// // ```rust
/// // let x = 1;
/// // ```
/// ```
pub fn code_block(language: &str, content: impl Display) -> String {
    if language.is_empty() {
        format!("```\n{}\n```", content)
    } else {
        format!("```{}\n{}\n```", language, content)
    }
}

/// Block quote (single line per line): `> text`
pub fn quote(text: impl Display) -> String {
    let text = text.to_string();
    text.lines()
        .map(|line| format!("> {}", line))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Multi-line block quote: `>>> text`
///
/// Everything after `>>>` until the end of the message is quoted.
#[inline]
pub fn quote_block(text: impl Display) -> String {
    format!(">>> {}", text)
}

// =============================================================================
// Headers & Structure
// =============================================================================

/// Large header: `# text`
#[inline]
pub fn h1(text: impl Display) -> String {
    format!("# {}", text)
}

/// Medium header: `## text`
#[inline]
pub fn h2(text: impl Display) -> String {
    format!("## {}", text)
}

/// Small header: `### text`
#[inline]
pub fn h3(text: impl Display) -> String {
    format!("### {}", text)
}

/// Subtext (small, muted): `-# text`
#[inline]
pub fn subtext(text: impl Display) -> String {
    format!("-# {}", text)
}

// =============================================================================
// Links
// =============================================================================

/// Hyperlink: `[text](url)`
#[inline]
pub fn link(text: impl Display, url: impl Display) -> String {
    format!("[{}]({})", text, url)
}

/// Masked link (shows URL on hover): `[text](url "title")`
#[inline]
pub fn link_titled(text: impl Display, url: impl Display, title: impl Display) -> String {
    format!("[{}]({} \"{}\")", text, url, title)
}

/// Spoiler text: `||text||`
#[inline]
pub fn spoiler(text: impl Display) -> String {
    format!("||{}||", text)
}

// =============================================================================
// Discord-Specific Mentions
// =============================================================================

/// Channel mention: `<#channel_id>`
#[inline]
pub fn channel(id: impl Display) -> String {
    format!("<#{}>", id)
}

/// User mention: `<@user_id>`
#[inline]
pub fn user(id: impl Display) -> String {
    format!("<@{}>", id)
}

/// Role mention: `<@&role_id>`
#[inline]
pub fn role(id: impl Display) -> String {
    format!("<@&{}>", id)
}

/// Slash command mention: `</command:id>`
#[inline]
pub fn slash_command(name: &str, id: impl Display) -> String {
    format!("</{name}:{}>", id)
}

/// Unix timestamp: `<t:timestamp>`
#[inline]
pub fn timestamp(unix: i64) -> String {
    format!("<t:{}>", unix)
}

/// Unix timestamp with style: `<t:timestamp:style>`
///
/// Styles:
/// - `t` - Short time (16:20)
/// - `T` - Long time (16:20:30)
/// - `d` - Short date (20/04/2021)
/// - `D` - Long date (20 April 2021)
/// - `f` - Short date/time (20 April 2021 16:20)
/// - `F` - Long date/time (Tuesday, 20 April 2021 16:20)
/// - `R` - Relative (2 months ago)
#[inline]
pub fn timestamp_styled(unix: i64, style: char) -> String {
    format!("<t:{}:{}>", unix, style)
}

/// Relative timestamp: `<t:timestamp:R>` (e.g., "2 hours ago")
#[inline]
pub fn relative_time(unix: i64) -> String {
    timestamp_styled(unix, 'R')
}

// =============================================================================
// Compound Formatting
// =============================================================================

/// Key-value pair: `**key:** value`
#[inline]
pub fn kv(key: impl Display, value: impl Display) -> String {
    format!("**{}:** {}", key, value)
}

/// Labeled code: `**label:** \`value\``
#[inline]
pub fn kv_code(key: impl Display, value: impl Display) -> String {
    format!("**{}:** `{}`", key, value)
}

/// Stats format: `` `+additions` `-deletions` ``
#[inline]
pub fn diff_stats(additions: impl Display, deletions: impl Display) -> String {
    format!("`+{}` `-{}`", additions, deletions)
}

/// Commit format: `` `short_sha` message ``
pub fn commit(sha: &str, message: &str) -> String {
    let short_sha = &sha[..7.min(sha.len())];
    let first_line = message.lines().next().unwrap_or("");
    format!("`{}` {}", short_sha, first_line)
}

/// Arrow mapping: `` `from` → `to` `` or `from → to`
#[inline]
pub fn arrow(from: impl Display, to: impl Display) -> String {
    format!("{} → {}", from, to)
}

/// Arrow with code formatting: `` `from` → `to` ``
#[inline]
pub fn arrow_code(from: impl Display, to: impl Display) -> String {
    format!("`{}` → `{}`", from, to)
}

// =============================================================================
// List Builder
// =============================================================================

/// List style for markdown lists.
#[derive(Clone, Copy)]
pub enum ListStyle {
    /// Unordered with `-` (Discord default)
    Dash,
    /// Unordered with `*`
    Asterisk,
    /// Unordered with `•` (Unicode bullet)
    Bullet,
    /// Ordered with `1.`, `2.`, etc.
    Ordered,
}

/// Builder for markdown lists (ordered and unordered).
pub struct List {
    items: Vec<String>,
    style: ListStyle,
}

impl Default for List {
    fn default() -> Self {
        Self::new()
    }
}

impl List {
    /// Create a new unordered list with `-` bullets.
    pub fn new() -> Self {
        Self {
            items: Vec::new(),
            style: ListStyle::Dash,
        }
    }

    /// Create an unordered list with `*` bullets.
    pub fn asterisk() -> Self {
        Self {
            items: Vec::new(),
            style: ListStyle::Asterisk,
        }
    }

    /// Create a list with `•` bullets.
    pub fn bullet() -> Self {
        Self {
            items: Vec::new(),
            style: ListStyle::Bullet,
        }
    }

    /// Create an ordered list (1., 2., 3., ...).
    pub fn ordered() -> Self {
        Self {
            items: Vec::new(),
            style: ListStyle::Ordered,
        }
    }

    /// Add an item to the list.
    pub fn item(mut self, text: impl Display) -> Self {
        self.items.push(text.to_string());
        self
    }

    /// Add multiple items.
    pub fn items<I, T>(mut self, items: I) -> Self
    where
        I: IntoIterator<Item = T>,
        T: Display,
    {
        for item in items {
            self.items.push(item.to_string());
        }
        self
    }

    /// Build the list string.
    pub fn build(self) -> String {
        self.items
            .into_iter()
            .enumerate()
            .map(|(i, item)| match self.style {
                ListStyle::Dash => format!("- {}", item),
                ListStyle::Asterisk => format!("* {}", item),
                ListStyle::Bullet => format!("• {}", item),
                ListStyle::Ordered => format!("{}. {}", i + 1, item),
            })
            .collect::<Vec<_>>()
            .join("\n")
    }
}

// =============================================================================
// Table Builder
// =============================================================================

/// Builder for fixed-width tables rendered in code blocks.
///
/// Since Discord doesn't support markdown tables, this renders as a code block
/// with aligned columns.
///
/// ```ignore
/// let table = Table::new()
///     .headers(["Name", "Status", "Count"])
///     .row(["alpha", "online", "42"])
///     .row(["beta", "offline", "0"])
///     .build();
/// ```
///
/// Output:
/// ```text
/// Name   Status   Count
/// ─────  ───────  ─────
/// alpha  online   42
/// beta   offline  0
/// ```
pub struct Table {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
    padding: usize,
}

impl Default for Table {
    fn default() -> Self {
        Self::new()
    }
}

impl Table {
    /// Create a new empty table.
    pub fn new() -> Self {
        Self {
            headers: Vec::new(),
            rows: Vec::new(),
            padding: 2,
        }
    }

    /// Set column headers.
    pub fn headers<I, T>(mut self, headers: I) -> Self
    where
        I: IntoIterator<Item = T>,
        T: Display,
    {
        self.headers = headers.into_iter().map(|h| h.to_string()).collect();
        self
    }

    /// Add a row of values.
    pub fn row<I, T>(mut self, values: I) -> Self
    where
        I: IntoIterator<Item = T>,
        T: Display,
    {
        self.rows
            .push(values.into_iter().map(|v| v.to_string()).collect());
        self
    }

    /// Add multiple rows at once.
    pub fn rows<I, R, T>(mut self, rows: I) -> Self
    where
        I: IntoIterator<Item = R>,
        R: IntoIterator<Item = T>,
        T: Display,
    {
        for row in rows {
            self.rows
                .push(row.into_iter().map(|v| v.to_string()).collect());
        }
        self
    }

    /// Set padding between columns (default: 2).
    pub fn padding(mut self, padding: usize) -> Self {
        self.padding = padding;
        self
    }

    /// Calculate column widths based on content.
    fn column_widths(&self) -> Vec<usize> {
        let col_count = self
            .headers
            .len()
            .max(self.rows.first().map_or(0, |r| r.len()));

        let mut widths = vec![0; col_count];

        for (i, header) in self.headers.iter().enumerate() {
            widths[i] = widths[i].max(header.chars().count());
        }

        for row in &self.rows {
            for (i, cell) in row.iter().enumerate() {
                if i < widths.len() {
                    widths[i] = widths[i].max(cell.chars().count());
                }
            }
        }

        widths
    }

    /// Build the table as a plain string (no code block wrapper).
    pub fn build_plain(self) -> String {
        let widths = self.column_widths();
        let mut lines = Vec::new();
        let pad = " ".repeat(self.padding);

        // Header row
        if !self.headers.is_empty() {
            let header_line: Vec<String> = self
                .headers
                .iter()
                .enumerate()
                .map(|(i, h)| format!("{:width$}", h, width = widths.get(i).copied().unwrap_or(0)))
                .collect();
            lines.push(header_line.join(&pad).trim_end().to_string());

            // Separator
            let sep: Vec<String> = widths.iter().map(|&w| "─".repeat(w)).collect();
            lines.push(sep.join(&pad));
        }

        // Data rows
        for row in &self.rows {
            let row_line: Vec<String> = row
                .iter()
                .enumerate()
                .map(|(i, cell)| {
                    format!(
                        "{:width$}",
                        cell,
                        width = widths.get(i).copied().unwrap_or(0)
                    )
                })
                .collect();
            lines.push(row_line.join(&pad).trim_end().to_string());
        }

        lines.join("\n")
    }

    /// Build the table wrapped in a code block.
    pub fn build(self) -> String {
        code_block("", self.build_plain())
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_formatting() {
        assert_eq!(bold("test"), "**test**");
        assert_eq!(italic("test"), "*test*");
        assert_eq!(bold_italic("test"), "***test***");
        assert_eq!(code("test"), "`test`");
        assert_eq!(strike("test"), "~~test~~");
        assert_eq!(underline("test"), "__test__");
        assert_eq!(spoiler("test"), "||test||");
    }

    #[test]
    fn test_underline_combinations() {
        assert_eq!(underline_italic("test"), "__*test*__");
        assert_eq!(underline_bold("test"), "__**test**__");
        assert_eq!(underline_bold_italic("test"), "__***test***__");
    }

    #[test]
    fn test_headers() {
        assert_eq!(h1("Title"), "# Title");
        assert_eq!(h2("Section"), "## Section");
        assert_eq!(h3("Subsection"), "### Subsection");
    }

    #[test]
    fn test_subtext() {
        assert_eq!(subtext("small text"), "-# small text");
    }

    #[test]
    fn test_code_block() {
        assert_eq!(code_block("", "code"), "```\ncode\n```");
        assert_eq!(code_block("rust", "let x = 1;"), "```rust\nlet x = 1;\n```");
    }

    #[test]
    fn test_quote() {
        assert_eq!(quote("line 1\nline 2"), "> line 1\n> line 2");
    }

    #[test]
    fn test_quote_block() {
        assert_eq!(quote_block("multiline\ntext"), ">>> multiline\ntext");
    }

    #[test]
    fn test_mentions() {
        assert_eq!(channel(123), "<#123>");
        assert_eq!(user(456), "<@456>");
        assert_eq!(role(789), "<@&789>");
    }

    #[test]
    fn test_kv() {
        assert_eq!(kv("Status", "online"), "**Status:** online");
        assert_eq!(kv_code("Version", "1.0.0"), "**Version:** `1.0.0`");
    }

    #[test]
    fn test_commit() {
        assert_eq!(
            commit("abc1234567890", "Fix the thing\n\nMore details"),
            "`abc1234` Fix the thing"
        );
    }

    #[test]
    fn test_list() {
        let list = List::new().item("one").item("two").item("three").build();
        assert_eq!(list, "- one\n- two\n- three");
    }

    #[test]
    fn test_list_bullet() {
        let list = List::bullet().items(["a", "b"]).build();
        assert_eq!(list, "• a\n• b");
    }

    #[test]
    fn test_list_asterisk() {
        let list = List::asterisk().items(["a", "b"]).build();
        assert_eq!(list, "* a\n* b");
    }

    #[test]
    fn test_list_ordered() {
        let list = List::ordered()
            .item("First")
            .item("Second")
            .item("Third")
            .build();
        assert_eq!(list, "1. First\n2. Second\n3. Third");
    }

    #[test]
    fn test_table() {
        let table = Table::new()
            .headers(["A", "B"])
            .row(["1", "2"])
            .row(["10", "20"])
            .build_plain();

        // Column widths: A=2 (for "10"), B=2 (for "20"), padding=2
        assert_eq!(table, "A   B\n──  ──\n1   2\n10  20");
    }

    #[test]
    fn test_table_variable_widths() {
        let table = Table::new()
            .headers(["Name", "Count"])
            .row(["short", "1"])
            .row(["very-long-name", "100"])
            .build_plain();

        let lines: Vec<&str> = table.lines().collect();
        assert_eq!(lines.len(), 4);
        // All lines should have same visual width
        assert!(lines[0].starts_with("Name"));
        assert!(lines[2].starts_with("short"));
        assert!(lines[3].starts_with("very-long-name"));
    }

    #[test]
    fn test_diff_stats() {
        assert_eq!(diff_stats(10, 5), "`+10` `-5`");
    }

    #[test]
    fn test_timestamps() {
        assert_eq!(timestamp(1234567890), "<t:1234567890>");
        assert_eq!(relative_time(1234567890), "<t:1234567890:R>");
        assert_eq!(timestamp_styled(1234567890, 'F'), "<t:1234567890:F>");
    }
}

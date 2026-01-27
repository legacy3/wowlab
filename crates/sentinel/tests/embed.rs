use wowlab_sentinel::utils::embed::EmbedContent;

#[test]
fn fields_render_bold_label() {
    let out = EmbedContent::new()
        .field("Uptime", "2h 31m")
        .field("Memory", "12.4 MB")
        .build();

    assert_eq!(out, "**Uptime:** 2h 31m\n**Memory:** 12.4 MB");
}

#[test]
fn section_adds_spacing_between_groups() {
    let out = EmbedContent::new()
        .field("A", "1")
        .section("Group")
        .field("B", "2")
        .build();

    assert_eq!(out, "**A:** 1\n\n**Group**\n**B:** 2");
}

#[test]
fn first_section_has_no_leading_newline() {
    let out = EmbedContent::new().section("First").field("X", "1").build();

    assert_eq!(out, "**First**\n**X:** 1");
}

#[test]
fn line_renders_plain_text() {
    let out = EmbedContent::new().line("Running: 3 · Pending: 7").build();

    assert_eq!(out, "Running: 3 · Pending: 7");
}

#[test]
fn kv_is_same_as_field() {
    let from_field = EmbedContent::new().field("Count", 42).build();
    let from_kv = EmbedContent::new().kv("Count", 42).build();

    assert_eq!(from_field, from_kv);
}

#[test]
fn numeric_values_displayed() {
    let out = EmbedContent::new()
        .kv("Guilds", 5)
        .kv("Members", 1832)
        .build();

    assert_eq!(out, "**Guilds:** 5\n**Members:** 1832");
}

#[test]
fn empty_build_returns_empty_string() {
    let out = EmbedContent::new().build();
    assert_eq!(out, "");
}

#[test]
fn multiple_sections() {
    let out = EmbedContent::new()
        .section("A")
        .field("x", 1)
        .section("B")
        .field("y", 2)
        .build();

    assert_eq!(out, "**A**\n**x:** 1\n\n**B**\n**y:** 2");
}

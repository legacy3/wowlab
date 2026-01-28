//! AI prompt templates.

/// Build a prompt for summarizing a git diff.
pub fn summarize_diff(diff: &str) -> String {
    format!(
        r#"You are a technical code reviewer. Analyze this git diff and provide a concise summary.

Focus on:
- What files were modified
- The nature of the changes (new features, bug fixes, refactoring, etc.)
- Key technical details that are relevant

Keep your summary to 2-3 sentences maximum. Be direct and technical.

```diff
{diff}
```"#
    )
}

/// Build a prompt for summarizing commit messages.
pub fn summarize_commits(commits: &str) -> String {
    format!(
        "Summarize these git commits in 1-2 concise sentences. \
         Focus on what changed, not who made the changes:\n\n{commits}"
    )
}

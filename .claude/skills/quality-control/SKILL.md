---
name: quality-control
description: Project-wide quality control for all codebases. Use when reviewing code quality, running audits, or before major releases.
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Quality Control

Comprehensive project-wide quality control that orchestrates language-specific checks.

**MANDATORY:** When running this skill, you MUST spawn parallel sub-agents for `/rust-quality` and `/portal-quality`. Do NOT run all checks inline yourself. See "Audit Workflow" section.

## Quick Audit Commands

```bash
# Full project audit
pnpm build && pnpm lint && pnpm test

# Rust engine audit
cd crates/engine && cargo clippy --all-targets -- -D warnings && cargo test

# Portal audit
cd apps/portal && pnpm lint && pnpm build
```

---

## Language-Specific Skills (REQUIRED)

This skill MUST delegate to specialized quality skills via sub-agents:

| Codebase         | Skill             | Focus                                 |
| ---------------- | ----------------- | ------------------------------------- |
| `crates/`        | `/rust-quality`   | Rust patterns, clippy, error handling |
| `apps/portal/`   | `/portal-quality` | TypeScript, React, Next.js patterns   |

**Do NOT skip these.** Spawn them as parallel sub-agents at the start of the audit.

---

## Universal Anti-Patterns

These apply to ALL code in the project:

### 1. Control Flow Without Braces

```typescript
// WRONG
if (condition) return early;
for (const x of items) process(x);

// RIGHT
if (condition) {
  return early;
}
for (const x of items) {
  process(x);
}
```

```rust
// WRONG - Rust allows this but project forbids it
if condition { return early }

// RIGHT
if condition {
    return early;
}
```

### 2. TODO/FIXME Comments

- NEVER leave TODO comments without issue reference
- If you add a TODO, create an issue and reference it: `// TODO(#123): description`
- Better: just do the work instead of leaving a TODO

### 3. Console/Print Statements

- No `console.log` in TypeScript production code
- No `println!` or `dbg!` in Rust production code
- Use proper logging (`tracing` for Rust, error boundaries for React)

### 4. Dead Code

- No commented-out code blocks
- No unused imports or variables
- No deprecated wrappers or backwards-compat shims
- No functions with `_old`, `_legacy`, `_deprecated` suffixes

### 5. Magic Numbers

```typescript
// WRONG
if (value > 85) { ... }

// RIGHT
const MAX_PERCENT = 85;
if (value > MAX_PERCENT) { ... }
```

```rust
// WRONG
let cap = 0.85;

// RIGHT
const ARMOR_CAP: f32 = 0.85;
```

### 6. Type Assertions / Unsafe Casts

```typescript
// WRONG - bypasses type checking
const data = response as MyType;

// RIGHT - validate at runtime or use type guards
if (isMyType(response)) {
  const data = response;
}
```

```rust
// WRONG - unchecked cast
let index = value as usize;

// RIGHT - checked conversion
let index = usize::try_from(value)?;
```

---

## Quality Checklist

### Before Any Commit

- [ ] `pnpm build` passes (includes type checking)
- [ ] `pnpm lint` passes
- [ ] No TODO without issue reference
- [ ] No commented-out code
- [ ] No console.log/println!/dbg! statements
- [ ] Control flow has braces

### Before Any PR

- [ ] All tests pass (`pnpm test`, `cargo test`)
- [ ] No type assertions (`as Type`) in new code
- [ ] New public APIs have documentation
- [ ] Error handling is comprehensive (no `.unwrap()` in Rust)
- [ ] Performance-sensitive code has benchmarks

### Before Release

- [ ] Full audit with both language-specific skills
- [ ] Security audit (`cargo audit` for Rust)
- [ ] Bundle size check for portal
- [ ] All TODOs resolved or tracked

---

## Audit Workflow

**IMPORTANT:** This skill MUST spawn parallel sub-agents for language-specific audits. Do NOT run checks inline.

When running a full audit:

1. **Spawn parallel sub-agents immediately**

   Use the Task tool to spawn these agents IN PARALLEL (single message, multiple Task calls):

   ```
   Agent 1: Run /rust-quality skill for crates/ code
   Agent 2: Run /portal-quality skill for apps/portal/ code
   ```

   These skills contain the detailed checks. Do not duplicate their work.

2. **While agents run, check universal anti-patterns**

   ```bash
   # TODOs without issue references
   grep -rn "TODO" --include="*.ts" --include="*.tsx" --include="*.rs" | grep -v "#[0-9]"

   # Console/print statements in production code
   grep -rn "console\." apps/portal/src/ --include="*.ts" --include="*.tsx"
   grep -rn "println!\|dbg!" crates/ --include="*.rs" | grep -v "/tests\|/cli\|test.rs"
   ```

3. **Collect agent results and generate unified report**

   Combine findings from both agents with universal anti-pattern results into a single report with:
   - Issue count by severity
   - Files affected
   - Specific line numbers
   - Recommended fixes

---

## Severity Levels

| Level        | Description                               | Action              |
| ------------ | ----------------------------------------- | ------------------- |
| **Critical** | Security vulnerabilities, data loss risk  | Block merge         |
| **High**     | Bugs, unsafe code, missing error handling | Fix before merge    |
| **Medium**   | Anti-patterns, missing docs, code smells  | Fix soon            |
| **Low**      | Style issues, minor improvements          | Fix when convenient |

---

## Integration

This skill works with:

- **`/code-review`** - Quick review checklist
- **`/pre-commit`** - Pre-commit hygiene checks
- **`/rust-quality`** - Deep Rust analysis
- **`/portal-quality`** - Deep TypeScript/React analysis

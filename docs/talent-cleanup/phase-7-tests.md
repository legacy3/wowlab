# Phase 7 — Core Tests

## Goal
Lock down the rules to stop regressions.

## Add Tests
In `packages/wowlab-services` and `packages/wowlab-parsers`:
- encoding/decoding idempotence
- prerequisite traversal correctness
- point limit enforcement
- visibility filtering
- layout bounds / scaling

## Exit Criteria
- Core rules are covered by deterministic tests.
- Refactors no longer require detective work to verify correctness.

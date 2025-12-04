# WowLab Architecture Documentation

## Overview

WowLab is a WoW spell rotation simulator that mirrors WoW's Combat Log Event Unfiltered (CLEU) system. This enables the same codebase to work as both a standalone simulator and an in-game addon.

## Documents

### [CLEU Architecture](./cleu-architecture.md)

How WowLab mirrors WoW's combat log system:

- Event types and structure
- Handler system
- Event flow through the simulation
- Current implementation details

### [Prediction Engine](./prediction-engine.md)

Architecture for predicting "next N spells" (like Hekili):

- Why two event streams (real vs predicted)
- State management for prediction
- Prediction cycle and invalidation
- Consumer use cases

## Key Concepts

### CLEU Mirroring

WowLab uses the same event types as WoW's combat log:

- `SPELL_CAST_SUCCESS`, `SPELL_AURA_APPLIED`, etc.
- Same handlers work in simulator and in-game
- Events drive state updates

### Dual Event Streams

For prediction, you need both:

1. **Real stream**: Authoritative events (from WoW or simulation)
2. **Predicted stream**: Speculative events (from APL lookahead)

Real events update real state. Predicted events update prediction state (which is discarded after each cycle).

### State Isolation

- **Real state**: Single source of truth, updated only from real events
- **Prediction state**: Snapshot of real state, used for lookahead, discarded after

## Packages

| Package            | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `@wowlab/core`     | Entities (GameState, Unit, Spell), Schemas (CLEU events), Errors |
| `@wowlab/services` | Services (State, CombatLog, Unit), Handlers                      |
| `@wowlab/rotation` | Rotation context, spell/control actions                          |
| `@wowlab/runtime`  | AppLayer composition                                             |
| `@wowlab/specs`    | Class/spec definitions, spell handlers                           |

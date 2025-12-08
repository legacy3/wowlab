# WoWLab Aura System (v2)

Read this first, then `docs/wowlab/00-data-flow.md` for the full timing diagram. Phases are strictly sequential and line up with Combat Log events.

## Document Map

| #  | Doc                                        | Purpose                                  |
|----|--------------------------------------------|------------------------------------------|
| 0  | 00-overview.md                             | Big picture + phase order                |
| R1 | 01-reference-simc-behaviors.md             | SimC semantics (reference only)          |
| R2 | 02-reference-spell-data.md                 | DBC fields/attributes (reference only)   |
| 1  | 03-phase1-data-structures.md               | AuraDataFlat + runtime Aura schema       |
| 2  | 04-phase2-transformer.md                   | `transformAura()` DBC → AuraDataFlat     |
| 3  | 05-phase3-handler-integration.md           | CLEU handlers using config + scheduler   |
| 4  | 06-phase4-periodic-ticks.md                | Periodic tick scheduling via EventQueue  |
| 5  | 07-phase5-simulation-setup.md              | Load aura data into SimulationConfig     |
| P  | prompts.md                                 | Ready-to-paste tasks per phase           |

## Core Principles (match data flow diagram)

- **Timing lives in the Event Queue.** Entities carry only CLEU-visible fields. Expirations and ticks are scheduled events (`emitter.emitAt`).
- **Immutable state.** `GameState` holds snapshots; handlers return new state.
- **Stale events are cheap.** Refresh schedules a new removal; the old one fires first and no-ops if the aura is already gone.
- **Runtime vs static.** Static config (`AuraDataFlat`) is loaded at setup and passed to handlers; runtime aura entity stays minimal.

## Phase Order at a Glance

1) Define schemas and constants → 2) Transform DBC → 3) Wire CLEU handlers to config + scheduler → 4) Tick scheduling and refresh semantics → 5) Preload all AuraDataFlat into `SimulationConfig`.

Stick to this order when running the prompts; later phases assume earlier pieces exist.

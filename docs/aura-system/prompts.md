# Aura System Implementation Prompts (v2)

Copy these into a fresh Claude/LLM instance. Run in numeric order; each phase depends on the previous.

---

## Phase 1: Aura State Schema

```
TASK: Create AuraDataFlat + Aura runtime schema.

READ FIRST:
- docs/aura-system/03-phase1-data-structures.md
- docs/wowlab/00-data-flow.md

RULES:
1. Implement exactly what the docs say.
2. If unsure about anything, stop and ask.

File: packages/wowlab-core/src/internal/schemas/Aura.ts
```

---

## Phase 2: Aura Transformer

```
TASK: Implement transformAura(spellId) and extractor helpers.

READ FIRST:
- docs/aura-system/04-phase2-transformer.md
- docs/aura-system/02-reference-spell-data.md

RULES:
1. Implement exactly what the mapping table says.
2. Do not add timing to entities; timing stays in events.
3. If unsure, stop and ask.

Files: packages/wowlab-services/src/internal/data/transformer/aura.ts, extractors.ts, index.ts
```

---

## Phase 3: Handler Integration

```
TASK: Wire CLEU aura handlers to use config + scheduler.

READ FIRST:
- docs/aura-system/05-phase3-handler-integration.md
- docs/wowlab/00-data-flow.md

RULES:
1. Aura entity stays minimal (CLEU fields only).
2. Removals/ticks are scheduled events; stale events check getAura.
3. If unsure, stop and ask.

Files: aura handlers (state/spec) under packages/wowlab-services/src/internal
```

---

## Phase 4: Periodic Ticks

```
TASK: Add tickPeriodMs snapshot to periodic event payloads and schedule ticks per doc.

READ FIRST:
- docs/aura-system/06-phase4-periodic-ticks.md
- docs/wowlab/00-data-flow.md

RULES:
1. tickPeriodMs lives on event payloads, not entities.
2. Haste applied at schedule-time only.
3. If unsure, stop and ask.

Events: SPELL_PERIODIC_DAMAGE, SPELL_PERIODIC_HEAL
```

---

## Phase 5: Simulation Setup

```
TASK: Load AuraDataFlat into SimulationConfig during profile composition.

READ FIRST:
- docs/aura-system/07-phase5-simulation-setup.md

RULES:
1. Batch transformAura for all relevant spellIds.
2. Missing data should not crash setup.
3. If unsure, stop and ask.

Files: ProfileComposer, SimulationConfig definition, SimDriver wiring
```

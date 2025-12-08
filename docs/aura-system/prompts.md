# Aura System Implementation Prompts

Copy-paste these prompts to a fresh Claude instance for each phase.

---

## Phase 1: Aura State Schema

```
TASK: Create the AuraState schema for the aura system.

READ FIRST:
- docs/wowlab/00-data-flow.md
- docs/aura-system/03-phase1-data-structures.md

RULES:
1. Implement EXACTLY what the docs say.
2. If you're unsure about ANYTHING, stop and ask me.

File: packages/wowlab-core/src/internal/schemas/Aura.ts
```

---

## Phase 2: Event Payloads

```
TASK: Add instanceId to aura event payloads.

READ FIRST:
- docs/wowlab/00-data-flow.md
- docs/aura-system/ (find the event payload definitions)

RULES:
1. Implement EXACTLY what the docs say.
2. If you're unsure about ANYTHING, stop and ask me.

Events that need instanceId: SPELL_AURA_APPLIED, SPELL_AURA_REMOVED, SPELL_AURA_REFRESH, SPELL_PERIODIC_DAMAGE, SPELL_PERIODIC_HEAL
```

---

## Phase 3: Handler Implementation

```
TASK: Implement the aura handlers.

READ FIRST:
- docs/wowlab/00-data-flow.md
- docs/aura-system/00-overview.md
- docs/aura-system/05-phase3-handler-integration.md

RULES:
1. Implement EXACTLY what the docs say.
2. If you're unsure about ANYTHING, stop and ask me.
```

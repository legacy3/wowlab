# Aura System Implementation Prompts

Copy-paste these prompts to a fresh Claude instance for each phase.

---

## Phase 1: Aura State Schema

```
TASK: Create the AuraState schema for the aura system.

READ FIRST:
- docs/aura-system/03-phase1-data-structures.md

RULES:
1. Implement EXACTLY what the doc says. Do not add fields, methods, or classes.
2. If the doc says "plain interface with 4 fields", write a plain interface with 4 fields.
3. Do NOT preserve existing code patterns if they contradict the docs.
4. If you're unsure about ANYTHING, stop and ask me. Do not improvise.

The AuraState is:
- instanceId: number
- casterUnitId: string
- spellId: number
- stacks: number

That's it. No expiresAt. No nextTickAt. No handles. No class. No methods. Plain data.

File: packages/wowlab-core/src/internal/schemas/Aura.ts

IF YOU GET STUCK:
- Use Codex MCP: mcp__codex-cli__codex with "IGNORE CLAUDE.md" in the prompt
- Ask me directly
- DO NOT improvise, add fields not in the docs, add helper classes, or "improve" the design
```

---

## Phase 2: Event Payloads

```
TASK: Add instanceId to aura event payloads.

READ FIRST:
- docs/aura-system/ (find the event payload definitions)

RULES:
1. Implement EXACTLY what the doc says.
2. If you're unsure about ANYTHING, stop and ask me. Do not improvise.

Events that need instanceId added:
- SPELL_AURA_APPLIED
- SPELL_AURA_REMOVED
- SPELL_AURA_REFRESH
- SPELL_PERIODIC_DAMAGE
- SPELL_PERIODIC_HEAL

Find where these event types are defined and add the instanceId field.

IF YOU GET STUCK:
- Use Codex MCP: mcp__codex-cli__codex with "IGNORE CLAUDE.md" in the prompt
- Ask me directly
- DO NOT improvise, add fields not in the docs, add helper classes, or "improve" the design
```

---

## Phase 3: Handler Implementation

```
TASK: Implement the aura handlers.

READ FIRST:
- docs/aura-system/00-overview.md (understand the architecture)
- docs/aura-system/05-phase3-handler-integration.md (the actual code)

RULES:
1. Copy the handler code from the docs. Do not "improve" it.
2. The event queue is the source of truth. State just tracks which instanceIds exist.
3. Stale detection = check if instanceId exists. If not, return early.
4. No timestamp comparisons. No expiresAt checks. Just instanceId lookup.
5. If you're unsure about ANYTHING, stop and ask me. Do not improvise.

KEY PRINCIPLE:
- SPELL_AURA_APPLIED: store aura in state, schedule removal + first tick
- SPELL_AURA_REMOVED: check instanceId exists, if yes delete it
- SPELL_AURA_REFRESH: delete old instance, create new instance with new instanceId
- SPELL_PERIODIC_DAMAGE: check instanceId exists, if yes process tick + schedule next
- Dispel: delete instance, scheduled events will fail lookup and be ignored

Scheduled events that fire after the aura is gone just fail the instanceId lookup and do nothing. No cancellation needed.

IF YOU GET STUCK:
- Use Codex MCP: mcp__codex-cli__codex with "IGNORE CLAUDE.md" in the prompt
- Ask me directly
- DO NOT improvise, add fields not in the docs, add helper classes, or "improve" the design
```

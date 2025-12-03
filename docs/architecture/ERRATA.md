# Architecture Options - Errata & Issues

Review by Codex identifying flaws in each proposed architecture.

## Constraints Reminder

1. **Real CLEU events only** - No synthetic events
2. **Multi-platform** - Must work as sim, bot in WoW, browser
3. **No synthetic events** - No ROTATION_POLL, GCD_LOCK, GCD_END, etc.
4. **Effect-TS with immutable state**

---

## Option 1: Driver-Clocked Loop

### Issues Found

| Issue                              | Severity | Description                                                                                                                   |
| ---------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Bot mode incompatible**          | CRITICAL | SimDriver "pulls" events, but in bot mode WoW pushes events asynchronously. Can't advance/rewind Blizzard's clock.            |
| **Timestamp assignment undefined** | CRITICAL | SpellActions "doesn't advance time" but must stamp future GCD aura events. Who assigns those timestamps? Implementation hole. |
| **Deadlock on empty queue**        | HIGH     | Rotation only reacts to events. No initial trigger defined. System deadlocks when queue empties.                              |
| **Mixed event sources**            | MEDIUM   | No bridge defined between real WoW CLEU and simulated events. Could mix in undefined order.                                   |

### Verdict

**FAILS** constraints 2 (multi-platform)

---

## Option 2: Queue-as-Time Source

### Issues Found

| Issue                         | Severity | Description                                                                                  |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| **GCD is synthetic state**    | CRITICAL | `nextAvailableTime` scalar replaces real SPELL*AURA*\* events. Violates constraints 1 and 3. |
| **Can't push to WoW's queue** | CRITICAL | Rotation "schedules future casts" but can't inject into Blizzard's CLEU stream in bot mode.  |
| **No adapter for real CLEU**  | HIGH     | No mechanism to inject real WoW timestamps into queue. Nondeterministic ordering.            |
| **Ignores external events**   | HIGH     | Pre-scheduled casts can't be preempted by procs/interrupts that occur before scheduled time. |

### Verdict

**FAILS** constraints 1 (real CLEU only), 2 (multi-platform), 3 (no synthetic)

---

## Option 3: Rotation-Orchestrated Scheduler

### Issues Found

| Issue                            | Severity | Description                                                                              |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| **Time jumps are synthetic**     | CRITICAL | Advancing `nextDecisionTime` replaces real CLEU cadence with synthetic increments.       |
| **Can't fast-forward real time** | CRITICAL | Bot/browser can't advance actual clock or block until computed instant.                  |
| **Retroactive event processing** | HIGH     | Events in skipped window processed after rotation acts, causing logical inconsistencies. |
| **No desync recovery**           | MEDIUM   | Once predictions diverge from actual CLEU, no correction mechanism.                      |

### Verdict

**FAILS** constraints 1, 2, 3

---

## Option 4: Time Slice Pipeline

### Issues Found

| Issue                                 | Severity | Description                                                                              |
| ------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| **GCD_END is synthetic**              | CRITICAL | Internal marker event explicitly violates "real CLEU only" rule.                         |
| **Same-timestamp ordering undefined** | HIGH     | WoW cares about sequence even when timestamps match. Proc → cast order could misfire.    |
| **Artificial latency**                | HIGH     | Rotation runs only at slice end. Reactive casts delayed, causing bot/browser divergence. |
| **Clock normalization undefined**     | MEDIUM   | Multiple adapters feed queue but no rules for normalizing disparate clocks.              |

### Verdict

**FAILS** constraints 1, 3

---

## Option 5: Dual-Clock Adapter

### Issues Found

| Issue                          | Severity | Description                                                                             |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| **GCD via local comparison**   | CRITICAL | `sleepUntil(gcdEnd)` uses local clock, not SPELL*AURA*\* CLEU. Violates constraint 1.   |
| **Missed events during sleep** | HIGH     | Rotation idle during sleep. Procs/aura refreshes missed or processed late.              |
| **No clock reconciliation**    | HIGH     | Mixing GetTime, queue timestamps, RAF without reconciliation causes divergent state.    |
| **Different execution paths**  | HIGH     | sleepUntil fast-forwards in sim but blocks in bot. Same rotation = different sequences. |

### Verdict

**FAILS** constraints 1, 2

---

## Summary

| Option                   | Constraint 1 (Real CLEU) | Constraint 2 (Multi-platform) | Constraint 3 (No synthetic) |
| ------------------------ | ------------------------ | ----------------------------- | --------------------------- |
| 1. Driver-Clocked        | ⚠️ Unclear               | ❌ FAIL                       | ✅ OK                       |
| 2. Queue-as-Time         | ❌ FAIL                  | ❌ FAIL                       | ❌ FAIL                     |
| 3. Rotation-Orchestrated | ❌ FAIL                  | ❌ FAIL                       | ❌ FAIL                     |
| 4. Time Slices           | ❌ FAIL                  | ⚠️ Partial                    | ❌ FAIL                     |
| 5. Dual-Clock            | ❌ FAIL                  | ❌ FAIL                       | ⚠️ Unclear                  |

**None of the proposed architectures fully satisfy all constraints.**

---

## Core Tension

The fundamental problem is:

1. **Real CLEU events** don't include a "GCD ended, you can cast now" event
2. **Multi-platform** requires code to work when:
   - We control time (simulation)
   - WoW controls time (bot)
   - Browser controls time (RAF)
3. **No synthetic events** means we can't invent our own scheduling signals

### The GCD Problem

In WoW, GCD is NOT an aura. There is no `SPELL_AURA_APPLIED` for GCD. The client just prevents casting for 1.5s after certain spells. This is internal game state, not a CLEU event.

So any architecture that needs to "know when GCD ends" must either:

- Use synthetic events (violates constraint 3)
- Use local time tracking (violates constraint 1)
- Poll/check continuously (different behavior per platform)

### Possible Resolution Paths

1. **Relax constraint 1**: Allow GCD tracking via local state, accept it's not "real CLEU"
2. **Relax constraint 3**: Allow minimal synthetic events for scheduling
3. **Different code paths**: Accept that sim/bot/browser need different rotation drivers
4. **Hybrid approach**: Real CLEU for everything except GCD timing

---

## Next Steps

Need to decide which constraint to relax, or find a novel approach that satisfies all three.

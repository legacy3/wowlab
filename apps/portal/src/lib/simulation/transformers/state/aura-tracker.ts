/**
 * Aura Tracker
 *
 * Tracks active auras to pair APPLIED/REMOVED events into BuffEvent ranges.
 */
import type { BuffEvent } from "@/atoms/timeline";
import type { IdGenerator } from "../context";

interface ActiveAura {
  spellId: number;
  start: number;
  target: string;
  type: "buff" | "debuff";
  stacks: number;
}

export class AuraTracker {
  readonly #active = new Map<string, ActiveAura>();

  /**
   * Record an aura being applied.
   */
  apply(
    destGUID: string,
    spellId: number,
    timestamp: number,
    target: string,
    auraType: "buff" | "debuff",
  ): void {
    this.#active.set(this.#key(destGUID, spellId), {
      spellId,
      start: timestamp,
      target,
      type: auraType,
      stacks: 1,
    });
  }

  /**
   * Update stack count (for APPLIED_DOSE / REMOVED_DOSE).
   */
  updateStacks(destGUID: string, spellId: number, stacks: number): void {
    const aura = this.#active.get(this.#key(destGUID, spellId));
    if (aura) {
      aura.stacks = stacks;
    }
  }

  /**
   * Handle aura refresh - closes current segment and starts a new one.
   */
  refresh(
    destGUID: string,
    spellId: number,
    timestamp: number,
    ids: IdGenerator,
    emit: (event: BuffEvent) => void,
  ): void {
    const key = this.#key(destGUID, spellId);
    const aura = this.#active.get(key);

    if (aura) {
      // Close the old segment
      emit({
        type: aura.type,
        id: ids.next("buff"),
        spellId: aura.spellId,
        start: aura.start,
        end: timestamp,
        stacks: aura.stacks > 1 ? aura.stacks : undefined,
        target: aura.target,
      });

      // Start new segment
      aura.start = timestamp;
    }
  }

  /**
   * Remove an aura and emit the final segment.
   */
  remove(
    destGUID: string,
    spellId: number,
    timestamp: number,
    ids: IdGenerator,
    emit: (event: BuffEvent) => void,
  ): void {
    const key = this.#key(destGUID, spellId);
    const aura = this.#active.get(key);

    if (aura) {
      emit({
        type: aura.type,
        id: ids.next("buff"),
        spellId: aura.spellId,
        start: aura.start,
        end: timestamp,
        stacks: aura.stacks > 1 ? aura.stacks : undefined,
        target: aura.target,
      });

      this.#active.delete(key);
    }
  }

  /**
   * Close any auras still active at fight end.
   */
  flushOpen(
    endTime: number,
    ids: IdGenerator,
    emit: (event: BuffEvent) => void,
  ): void {
    for (const [, aura] of this.#active) {
      emit({
        type: aura.type,
        id: ids.next("buff"),
        spellId: aura.spellId,
        start: aura.start,
        end: endTime,
        stacks: aura.stacks > 1 ? aura.stacks : undefined,
        target: aura.target,
      });
    }
    this.#active.clear();
  }

  #key(destGUID: string, spellId: number): string {
    return `${destGUID}:${spellId}`;
  }
}

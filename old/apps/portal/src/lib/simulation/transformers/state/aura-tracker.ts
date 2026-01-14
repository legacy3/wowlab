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

  updateStacks(destGUID: string, spellId: number, stacks: number): void {
    const aura = this.#active.get(this.#key(destGUID, spellId));
    if (aura) {
      aura.stacks = stacks;
    }
  }

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
      emit({
        type: aura.type,
        id: ids.next("buff"),
        spellId: aura.spellId,
        start: aura.start,
        end: timestamp,
        stacks: aura.stacks > 1 ? aura.stacks : undefined,
        target: aura.target,
      });

      aura.start = timestamp;
    }
  }

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

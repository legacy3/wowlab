interface CastInProgress {
  spellId: number;
  startTime: number;
  target: string;
}

export interface ResolvedCast {
  timestamp: number;
  duration: number;
  target: string;
  successful: boolean;
}

export class CastTracker {
  readonly #active = new Map<string, CastInProgress>();

  start(
    sourceGUID: string,
    spellId: number,
    timestamp: number,
    target: string,
  ): void {
    this.#active.set(this.#key(sourceGUID, spellId), {
      spellId,
      startTime: timestamp,
      target,
    });
  }

  resolve(
    sourceGUID: string,
    spellId: number,
    timestamp: number,
    target: string,
    successful: boolean,
  ): ResolvedCast {
    const key = this.#key(sourceGUID, spellId);
    const started = this.#active.get(key);
    this.#active.delete(key);

    if (started) {
      return {
        timestamp: started.startTime,
        duration: timestamp - started.startTime,
        target: started.target || target || "Target",
        successful,
      };
    }

    // Instant cast (no SPELL_CAST_START)
    return {
      timestamp,
      duration: 0,
      target: target || "Target",
      successful,
    };
  }

  #key(sourceGUID: string, spellId: number): string {
    return `${sourceGUID}:${spellId}`;
  }
}

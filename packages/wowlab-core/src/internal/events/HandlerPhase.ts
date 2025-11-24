/**
 * Handler execution phases for event callbacks.
 *
 * Phases provide semantic meaning to handler ordering without requiring
 * coordination on numeric priorities across the codebase.
 *
 * Execution order: CLEANUP → CORE → SECONDARY → POST
 */
export enum HandlerPhase {
  /** State reset, validation, preparation (runs first) */
  CLEANUP = "CLEANUP",
  /** Damage, resources, cooldowns (primary game logic) */
  CORE = "CORE",
  /** Procs, buffs, reactive effects */
  SECONDARY = "SECONDARY",
  /** Logging, metrics, observation (runs last) */
  POST = "POST",
}

/**
 * Execution order of phases. Used for sorting handlers.
 */
export const PHASE_ORDER: readonly HandlerPhase[] = [
  HandlerPhase.CLEANUP,
  HandlerPhase.CORE,
  HandlerPhase.SECONDARY,
  HandlerPhase.POST,
];

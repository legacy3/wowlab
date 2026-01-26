/**
 * Singleton lazy loader for wowlab-common WASM module.
 * Uses a promise-based pattern for deduplication.
 */

type CommonModule = typeof import("wowlab-common");

let module: CommonModule | null = null;
let initPromise: Promise<CommonModule> | null = null;

/**
 * Get the initialized common module.
 * Initializes on first call, returns cached module on subsequent calls.
 * Throws if initialization fails.
 */
export async function getCommon(): Promise<CommonModule> {
  if (module) {
    return module;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const m = await import("wowlab-common");
      await m.default();
      module = m;
      return m;
    })();
  }

  return initPromise;
}

/**
 * Check if the common module is already initialized.
 * Useful for conditional rendering without triggering initialization.
 */
export function isCommonReady(): boolean {
  return module !== null;
}

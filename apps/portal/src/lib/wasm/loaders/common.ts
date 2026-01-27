type CommonModule = typeof import("wowlab-common");

let cachedModule: CommonModule | null = null;
let initPromise: Promise<CommonModule> | null = null;

export async function getCommon(): Promise<CommonModule> {
  if (cachedModule) {
    return cachedModule;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const m = await import("wowlab-common");
      await m.default();

      cachedModule = m;

      return m;
    })();
  }

  return initPromise;
}

export function isCommonReady(): boolean {
  return cachedModule !== null;
}

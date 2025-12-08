import { atomWithStorage } from "jotai/utils";

export function createPersistedOrderAtom<T extends string>(
  key: string,
  defaultOrder: readonly T[],
) {
  return atomWithStorage<readonly T[]>(key, defaultOrder);
}

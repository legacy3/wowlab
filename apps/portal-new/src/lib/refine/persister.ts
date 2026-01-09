import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

import { del, get, set } from "idb-keyval";

export function createPersister(key: IDBValidKey = "wowlab-cache"): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(key, client);
    },

    removeClient: async () => {
      await del(key);
    },

    restoreClient: async () => {
      return await get<PersistedClient>(key);
    },
  };
}

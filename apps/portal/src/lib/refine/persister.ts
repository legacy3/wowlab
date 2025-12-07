import { get, set, del } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

export function createPersister(key: IDBValidKey = "wowlab-cache"): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(key, client);
    },

    restoreClient: async () => {
      return await get<PersistedClient>(key);
    },

    removeClient: async () => {
      await del(key);
    },
  };
}

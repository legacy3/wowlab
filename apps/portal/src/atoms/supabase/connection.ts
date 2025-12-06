import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import { supabaseClientAtom } from "./client";
import { env } from "@/lib/env";

export interface ConnectionStatus {
  connected: boolean;
  url: string;
  hasKey: boolean;
  error?: string;
  timestamp: string;
}

export const connectionStatusAtom = atomWithRefresh(async (get) => {
  try {
    const supabase = get(supabaseClientAtom);
    const { error } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (error) {
      return {
        connected: true,
        url: env.SUPABASE_URL,
        hasKey: !!env.SUPABASE_ANON_KEY,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      connected: true,
      url: env.SUPABASE_URL,
      hasKey: !!env.SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      connected: false,
      url: env.SUPABASE_URL,
      hasKey: !!env.SUPABASE_ANON_KEY,
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
});

export const isConnectedAtom = atom(async (get) => {
  const status = await get(connectionStatusAtom);
  return status.connected;
});

export const hasErrorAtom = atom(async (get) => {
  const status = await get(connectionStatusAtom);
  return !!status.error;
});

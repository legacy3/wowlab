"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ParseState, Profile, RecentProfile } from "./types";

export const MAX_RECENT_PROFILES = 8;

// Lazy-loaded WASM module
let wasmModule: typeof import("parsers") | null = null;
let wasmInitPromise: Promise<typeof import("parsers")> | null = null;

// Character input store
interface CharacterInputStore {
  clearCharacter: () => void;
  input: string;
  parseState: ParseState;
  setInput: (input: string) => Promise<void>;
}

async function getParser(): Promise<typeof import("parsers")> {
  if (wasmModule) {
    return wasmModule;
  }

  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    const mod = await import("parsers");
    await mod.default();
    wasmModule = mod;

    return mod;
  })();

  return wasmInitPromise;
}

export const useCharacterInput = create<CharacterInputStore>()((set) => ({
  clearCharacter: () => {
    set({ input: "", parseState: { status: "idle" } });
  },

  input: "",

  parseState: { status: "idle" },

  setInput: async (input: string) => {
    set({ input });

    if (input.trim().length < 50) {
      set({ parseState: { status: "idle" } });
      return;
    }

    set({ parseState: { status: "parsing" } });

    try {
      const parser = await getParser();
      const profile = parser.parseSimc(input) as Profile;
      set({ parseState: { profile, status: "success" } });
    } catch (err) {
      set({
        parseState: {
          error:
            err instanceof Error ? err.message : "Failed to parse SimC profile",
          status: "error",
        },
      });
    }
  },
}));

// Recent profiles store (persisted)
interface RecentProfilesStore {
  addRecent: (simc: string, profile: Profile) => void;
  clearRecent: () => void;
  recent: RecentProfile[];
  removeRecent: (simc: string) => void;
}

export const useRecentProfiles = create<RecentProfilesStore>()(
  persist(
    (set, get) => ({
      addRecent: (simc, profile) => {
        const current = get().recent;
        const trimmed = simc.trim();
        const withoutDupes = current.filter((r) => r.simc.trim() !== trimmed);
        set({
          recent: [{ profile, simc: trimmed }, ...withoutDupes].slice(
            0,
            MAX_RECENT_PROFILES,
          ),
        });
      },

      clearRecent: () => set({ recent: [] }),

      recent: [],

      removeRecent: (simc) => {
        const current = get().recent;
        set({ recent: current.filter((r) => r.simc.trim() !== simc.trim()) });
      },
    }),
    { name: "wowlab-recent-profiles" },
  ),
);

// Selectors
export const selectProfile = (state: CharacterInputStore): Profile | null =>
  state.parseState.status === "success" ? state.parseState.profile : null;

export const selectParseError = (state: CharacterInputStore): string | null =>
  state.parseState.status === "error" ? state.parseState.error : null;

export const selectIsParsing = (state: CharacterInputStore): boolean =>
  state.parseState.status === "parsing";

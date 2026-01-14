import type { Database } from "./database.types";

// Public schema types
type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];
export type View<T extends keyof Views> = Views[T]["Row"];

// Game schema types
type GameTables = Database["game"]["Tables"];

export type GameRow<T extends keyof GameTables> = GameTables[T]["Row"];

export type Spell = GameRow<"spells">;
export type Item = GameRow<"items">;
export type Aura = GameRow<"auras">;
export type Spec = GameRow<"specs">;
export type SpecTraits = GameRow<"specs_traits">;

// Summary types for lists/search
export interface SpellSummary {
  id: number;
  name: string;
  file_name: string;
}

export interface ItemSummary {
  id: number;
  name: string;
  item_level: number;
  quality: number;
  file_name: string;
}

export interface SpecSummary {
  id: number;
  name: string;
  class_name: string;
  class_id: number;
  icon_file_id: number;
}

// User types
export interface UserIdentity {
  id: string;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
}

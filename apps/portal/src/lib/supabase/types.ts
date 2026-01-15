import type { Database } from "./database.types";

/* eslint-disable */

type GameTables = Database["game"]["Tables"];
type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type GameRow<T extends keyof GameTables> = GameTables[T]["Row"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];
export type View<T extends keyof Views> = Views[T]["Row"];

export type Aura = GameRow<"auras">;
export type Class = GameRow<"classes">;
export type GlobalColor = GameRow<"global_colors">;
export type GlobalString = GameRow<"global_strings">;
export type Item = GameRow<"items">;
export type Spec = GameRow<"specs">;
export type SpecTraits = GameRow<"specs_traits">;
export type Spell = GameRow<"spells">;

export interface ItemSummary {
  file_name: string;
  id: number;
  item_level: number;
  name: string;
  quality: number;
}

export interface SpecSummary {
  class_id: number;
  class_name: string;
  file_name: string;
  id: number;
  name: string;
}

export interface SpellSummary {
  file_name: string;
  id: number;
  name: string;
}

export interface UserIdentity {
  avatarUrl: string | null;
  email: string | null;
  handle: string | null;
  id: string;
}

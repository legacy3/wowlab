import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];
export type View<T extends keyof Views> = Views[T]["Row"];

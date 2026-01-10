import type { Database } from "./database.types";

/* eslint-disable */

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];
export type View<T extends keyof Views> = Views[T]["Row"];

export interface UserIdentity extends Pick<
  Row<"user_profiles">,
  "id" | "avatarUrl" | "handle"
> {
  email?: string;
}

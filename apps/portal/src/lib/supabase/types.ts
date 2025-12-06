import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];

export type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

/** User identity from Refine auth - minimal user info for UI */
export interface UserIdentity {
  id: string;
  email?: string;
  handle?: string;
  avatarUrl?: string | null;
}

export type RotationInsert =
  Database["public"]["Tables"]["rotations"]["Insert"];

export type RotationUpdate =
  Database["public"]["Tables"]["rotations"]["Update"];

export type SimResult =
  Database["public"]["Tables"]["rotation_sim_results"]["Row"];

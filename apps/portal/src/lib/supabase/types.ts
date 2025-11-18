import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

export type RotationInsert =
  Database["public"]["Tables"]["rotations"]["Insert"];

export type RotationUpdate =
  Database["public"]["Tables"]["rotations"]["Update"];

export type SimResult =
  Database["public"]["Tables"]["rotation_sim_results"]["Row"];

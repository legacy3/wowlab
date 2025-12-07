import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];

export type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

export type MostWantedItem =
  Database["public"]["Views"]["view_most_wanted_items"]["Row"];

export type SpecRankingRow =
  Database["public"]["Views"]["view_spec_rankings_hourly"]["Row"];

export type TopSimRow =
  Database["public"]["Views"]["view_top_sims_daily"]["Row"];

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

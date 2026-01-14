import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];

export type Rotation = Database["public"]["Tables"]["rotations"]["Row"];

export type RotationHistory =
  Database["public"]["Tables"]["rotations_history"]["Row"];

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

// Node types
export type UserNode = Database["public"]["Tables"]["user_nodes"]["Row"];
export type UserNodeInsert =
  Database["public"]["Tables"]["user_nodes"]["Insert"];
export type UserNodeUpdate =
  Database["public"]["Tables"]["user_nodes"]["Update"];

export type UserNodePermission =
  Database["public"]["Tables"]["user_nodes_permissions"]["Row"];
export type UserNodePermissionInsert =
  Database["public"]["Tables"]["user_nodes_permissions"]["Insert"];

// Simulation types
export type SimConfig = Database["public"]["Tables"]["sim_configs"]["Row"];
export type SimConfigInsert =
  Database["public"]["Tables"]["sim_configs"]["Insert"];

export type SimJob = Database["public"]["Tables"]["sim_jobs"]["Row"];
export type SimJobInsert = Database["public"]["Tables"]["sim_jobs"]["Insert"];
export type SimJobUpdate = Database["public"]["Tables"]["sim_jobs"]["Update"];

export type SimChunk = Database["public"]["Tables"]["sim_chunks"]["Row"];
export type SimChunkInsert =
  Database["public"]["Tables"]["sim_chunks"]["Insert"];
export type SimChunkUpdate =
  Database["public"]["Tables"]["sim_chunks"]["Update"];

// Status enums for better type safety
export type NodeStatus = "pending" | "online" | "offline";
export type AccessType = "owner" | "user" | "guild" | "public";
export type JobStatus = "pending" | "running" | "completed" | "failed";
export type ChunkStatus =
  | "pending"
  | "claimed"
  | "running"
  | "completed"
  | "failed";

// Extended node type with optional joined fields
export interface UserNodeWithAccess extends UserNode {
  accessType?: AccessType;
  ownerName?: string;
}

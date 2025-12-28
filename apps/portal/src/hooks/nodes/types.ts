/**
 * Node data from the database
 */
export interface Node {
  id: string;
  user_id: string;
  name: string;
  claim_code: string | null;
  max_parallel: number;
  status: "pending" | "online" | "offline";
  last_seen_at: string | null;
  version: string | null;
  created_at: string;
  // Extended fields for available nodes
  access_type?: string;
  owner_name?: string;
}

/**
 * Node access control entry
 */
export interface NodeAccess {
  id: string;
  node_id: string;
  access_type: "owner" | "user" | "guild" | "public";
  target_id: string | null;
  created_at: string;
}

/**
 * Simulation config (content-addressed)
 */
export interface SimConfig {
  hash: string;
  config: unknown;
  created_at: string;
  last_used_at: string;
}

/**
 * Simulation job
 */
export interface SimJob {
  id: string;
  user_id: string;
  config_hash: string;
  total_iterations: number;
  completed_iterations: number;
  status: "pending" | "running" | "completed" | "failed";
  result: unknown | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Simulation chunk (work unit)
 */
export interface SimChunk {
  id: string;
  job_id: string;
  node_id: string | null;
  config_hash: string;
  iterations: number;
  seed_offset: number;
  status: "pending" | "claimed" | "running" | "completed" | "failed";
  result: unknown | null;
  claimed_at: string | null;
  completed_at: string | null;
}

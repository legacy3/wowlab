"use client";

import type { Tables } from "@/lib/supabase/database.types";

// Access options for UI
export interface NodeAccessOption {
  description: string;
  label: string;
  value: NodeAccessType;
}
export type NodeAccessType = "private" | "friends" | "guild" | "public";

// UI-only types (computed, not in DB)
export type NodeOwner = "me" | "shared";
export type NodePermissionRow = Tables<"nodes_permissions">;

// DB row types (use these for Supabase operations)
export type NodeRow = Tables<"nodes">;

// Extended node with computed fields for UI
export interface NodeWithMeta extends NodeRow {
  accessType: NodeAccessType;
  owner: NodeOwner;
}

export const NODE_ACCESS_OPTIONS: NodeAccessOption[] = [
  {
    description: "Only you can use this node",
    label: "Only me",
    value: "private",
  },
  {
    description: "Friends in your network",
    label: "Friends",
    value: "friends",
  },
  {
    description: "Members of your guild",
    label: "Guild",
    value: "guild",
  },
  {
    description: "Anyone can use this node",
    label: "Public",
    value: "public",
  },
];

// Derive access type from permissions
export function deriveAccessType(
  permissions: NodePermissionRow[],
): NodeAccessType {
  if (permissions.length === 0) {
    return "private";
  }

  if (permissions.some((p) => p.access_type === "public")) {
    return "public";
  }

  if (permissions.some((p) => p.access_type === "guild")) {
    return "guild";
  }

  if (permissions.some((p) => p.access_type === "user")) {
    return "friends";
  }

  return "private";
}

// DB access_type <-> UI accessType mapping
export function mapAccessTypeFromDb(dbValue: string): NodeAccessType {
  switch (dbValue) {
    case "guild":
      return "guild";
      
    case "owner":
      return "private";

    case "public":
      return "public";

    case "user":
      return "friends";

    default:
      return "private";
  }
}

export function mapAccessTypeToDb(uiValue: NodeAccessType): string {
  switch (uiValue) {
    case "friends":
      return "user";

    case "guild":
      return "guild";

    case "private":
      return "owner";
      
    case "public":
      return "public";
  }
}

// Transform DB row to UI type
export function transformNode(
  row: NodeRow,
  currentUserId: string | undefined,
  permissions: NodePermissionRow[] = [],
): NodeWithMeta {
  return {
    ...row,
    accessType: deriveAccessType(
      permissions.filter((p) => p.node_id === row.id),
    ),
    owner: row.user_id === currentUserId ? "me" : "shared",
  };
}

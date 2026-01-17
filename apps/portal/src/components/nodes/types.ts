export interface Node {
  accessType?: NodeAccessType;
  id: string;
  lastSeen: Date;
  name: string;
  owner: NodeOwner;
  platform: NodePlatform;
  status: NodeStatus;
  totalCores: number;
  version: string;
  workers: number;
}
export interface NodeAccessOption {
  description: string;
  label: string;
  value: NodeAccessType;
}
export type NodeAccessType = "private" | "friends" | "guild" | "public";
export type NodeOwner = "me" | "shared";

export type NodePlatform = "linux" | "linux-arm" | "macos" | "windows";

export type NodeStatus = "online" | "offline" | "pending";

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
  { description: "Members of your guild", label: "Guild", value: "guild" },
  { description: "Anyone can use this node", label: "Public", value: "public" },
];

"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useList,
  useCreate,
  useUpdate,
  useDelete,
  useGetIdentity,
  useInvalidate,
} from "@refinedev/core";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  UserNode,
  UserNodePermission,
  UserNodeWithAccess,
  UserIdentity,
  AccessType,
} from "@/lib/supabase/types";

// Local node stored in localStorage
const LOCAL_NODE_KEY = "wowlab:local-node";

export interface LocalNode {
  enabled: boolean;
  concurrency: number;
}

const DEFAULT_LOCAL_NODE: LocalNode = {
  enabled: true,
  concurrency: navigator?.hardwareConcurrency ?? 4,
};

// Combined node type for UI
export interface NodeListItem {
  id: string;
  name: string;
  status: "online" | "offline" | "pending";
  maxParallel: number;
  lastSeenAt: string | null;
  version: string | null;
  isLocal: boolean;
  isOwner: boolean;
  accessType?: AccessType;
  ownerName?: string;
}

type UIAccessType = "owner" | "friends" | "guild" | "public";

interface NodeManagerContextValue {
  // Data
  localNode: LocalNode;
  myNodes: NodeListItem[];
  availableNodes: NodeListItem[];
  allNodes: NodeListItem[];
  isLoading: boolean;

  // Local node actions
  setLocalEnabled: (enabled: boolean) => void;
  setLocalConcurrency: (concurrency: number) => void;

  // Remote node actions
  claimNode: (
    code: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteNode: (nodeId: string) => Promise<void>;

  // Access actions
  getNodeAccess: (nodeId: string) => UIAccessType;
  updateNodeAccess: (nodeId: string, accessType: UIAccessType) => Promise<void>;

  // Refresh
  refetch: () => void;
}

const NodeManagerContext = createContext<NodeManagerContextValue | null>(null);

function loadLocalNode(): LocalNode {
  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_NODE;
  }

  try {
    const stored = localStorage.getItem(LOCAL_NODE_KEY);
    if (stored) {
      return { ...DEFAULT_LOCAL_NODE, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }

  return DEFAULT_LOCAL_NODE;
}

function saveLocalNode(node: LocalNode): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LOCAL_NODE_KEY, JSON.stringify(node));
}

export function NodeManagerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const invalidate = useInvalidate();
  const { data: identity } = useGetIdentity<UserIdentity>();

  // Local node state
  const [localNode, setLocalNode] = useState<LocalNode>(DEFAULT_LOCAL_NODE);

  // Load from localStorage on mount
  useEffect(() => {
    setLocalNode(loadLocalNode());
  }, []);

  // My nodes from Supabase
  const { result: myNodesResult, query: myNodesQuery } = useList<UserNode>({
    resource: "user_nodes",
    filters: [{ field: "userId", operator: "eq", value: identity?.id }],
    sorters: [{ field: "createdAt", order: "desc" }],
    queryOptions: { enabled: !!identity?.id },
  });

  // Available nodes (shared with me)
  const { result: availableResult, query: availableQuery } =
    useList<UserNodeWithAccess>({
      resource: "user_nodes",
      filters: [
        { field: "userId", operator: "ne", value: identity?.id },
        { field: "status", operator: "eq", value: "online" },
      ],
      queryOptions: { enabled: !!identity?.id },
    });

  // Permissions for access type lookup
  const { result: permissionsResult } = useList<UserNodePermission>({
    resource: "user_nodes_permissions",
    queryOptions: { enabled: !!identity?.id },
  });

  // Mutations
  const { mutateAsync: updateNode } = useUpdate<UserNode>();
  const { mutateAsync: deleteNodeMutation } = useDelete();
  const { mutateAsync: createPermission } = useCreate<UserNodePermission>();

  // Build the local node list item
  const localNodeItem: NodeListItem = {
    id: "local",
    name: "Browser",
    status: localNode.enabled ? "online" : "offline",
    maxParallel: localNode.concurrency,
    lastSeenAt: new Date().toISOString(),
    version: null,
    isLocal: true,
    isOwner: true,
  };

  // Transform remote nodes to list items
  const myNodes: NodeListItem[] = [
    localNodeItem,
    ...(myNodesResult?.data ?? []).map(
      (node): NodeListItem => ({
        id: node.id,
        name: node.name,
        status: node.status as "online" | "offline" | "pending",
        maxParallel: node.maxParallel,
        lastSeenAt: node.lastSeenAt,
        version: node.version,
        isLocal: false,
        isOwner: true,
      }),
    ),
  ];

  const availableNodes: NodeListItem[] = (availableResult?.data ?? []).map(
    (node): NodeListItem => ({
      id: node.id,
      name: node.name,
      status: node.status as "online" | "offline" | "pending",
      maxParallel: node.maxParallel,
      lastSeenAt: node.lastSeenAt,
      version: node.version,
      isLocal: false,
      isOwner: false,
      accessType: node.accessType,
      ownerName: node.ownerName,
    }),
  );

  const allNodes = [...myNodes, ...availableNodes];

  // Local node actions
  const setLocalEnabled = useCallback((enabled: boolean) => {
    setLocalNode((prev) => {
      const next = { ...prev, enabled };
      saveLocalNode(next);
      return next;
    });
  }, []);

  const setLocalConcurrency = useCallback((concurrency: number) => {
    setLocalNode((prev) => {
      const next = { ...prev, concurrency };
      saveLocalNode(next);
      return next;
    });
  }, []);

  // Claim node
  const claimNode = useCallback(
    async (
      code: string,
      name?: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!identity?.id) {
        return { success: false, error: "Not authenticated" };
      }

      try {
        const supabase = createClient();

        // Find pending node by claim code
        const { data: pendingNode, error: findError } = await supabase
          .from("user_nodes")
          .select("id")
          .eq("claimCode", code.toUpperCase())
          .eq("status", "pending")
          .is("userId", null)
          .single();

        if (findError || !pendingNode) {
          return { success: false, error: "Invalid or expired claim code" };
        }

        // Claim it
        await updateNode({
          resource: "user_nodes",
          id: pendingNode.id,
          values: {
            userId: identity.id,
            name: name || `Node-${code}`,
            claimCode: null,
            status: "online",
          },
        });

        invalidate({ resource: "user_nodes", invalidates: ["list"] });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [identity?.id, updateNode, invalidate],
  );

  // Delete node
  const deleteNode = useCallback(
    async (nodeId: string) => {
      await deleteNodeMutation({ resource: "user_nodes", id: nodeId });
      invalidate({ resource: "user_nodes", invalidates: ["list"] });
      router.push("/account/nodes");
    },
    [deleteNodeMutation, invalidate, router],
  );

  // Get access type for a node
  const getNodeAccess = useCallback(
    (nodeId: string): UIAccessType => {
      const permissions = permissionsResult?.data ?? [];
      const nodePermissions = permissions.filter((p) => p.nodeId === nodeId);

      if (nodePermissions.some((p) => p.accessType === "public")) {
        return "public";
      }

      if (nodePermissions.some((p) => p.accessType === "guild")) {
        return "guild";
      }

      if (nodePermissions.some((p) => p.accessType === "user")) {
        return "friends";
      }

      return "owner";
    },
    [permissionsResult?.data],
  );

  // Update access type
  const updateNodeAccess = useCallback(
    async (nodeId: string, accessType: UIAccessType) => {
      const dbAccessType: AccessType =
        accessType === "friends" ? "user" : accessType;

      await createPermission({
        resource: "user_nodes_permissions",
        values: {
          nodeId,
          accessType: dbAccessType,
          targetId: null,
        } as unknown as UserNodePermission,
      });

      invalidate({ resource: "user_nodes_permissions", invalidates: ["list"] });
    },
    [createPermission, invalidate],
  );

  // Refetch all
  const refetch = useCallback(() => {
    myNodesQuery.refetch();
    availableQuery.refetch();
  }, [myNodesQuery, availableQuery]);

  const isLoading = myNodesQuery.isLoading || availableQuery.isLoading;

  const contextValue = useMemo(
    (): NodeManagerContextValue => ({
      localNode,
      myNodes,
      availableNodes,
      allNodes,
      isLoading,
      setLocalEnabled,
      setLocalConcurrency,
      claimNode,
      deleteNode,
      getNodeAccess,
      updateNodeAccess,
      refetch,
    }),
    [
      localNode,
      myNodes,
      availableNodes,
      allNodes,
      isLoading,
      setLocalEnabled,
      setLocalConcurrency,
      claimNode,
      deleteNode,
      getNodeAccess,
      updateNodeAccess,
      refetch,
    ],
  );

  return (
    <NodeManagerContext.Provider value={contextValue}>
      {children}
    </NodeManagerContext.Provider>
  );
}

export function useNodeManager(): NodeManagerContextValue {
  const context = useContext(NodeManagerContext);
  if (!context) {
    throw new Error("useNodeManager must be used within a NodeManagerProvider");
  }
  return context;
}

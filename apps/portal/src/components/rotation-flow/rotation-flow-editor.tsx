"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { useNodesState, useEdgesState, addEdge, type Connection, MarkerType } from "@xyflow/react";
import Dagre from "@dagrejs/dagre";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useZenMode } from "@/hooks/use-zen-mode";
import { Sidebar } from "./sidebar";
import { PropertiesPanel } from "./properties-panel";
import { Toolbar } from "./toolbar";
import { Footer } from "./footer";
import { FlowCanvas } from "./flow-canvas";
import type { RotationNode, RotationEdge, LayoutDirection } from "./types";

// =============================================================================
// Initial Data - Beast Mastery Hunter Rotation (based on SimC APL)
// =============================================================================

const INITIAL_NODES: RotationNode[] = [
  // Start
  {
    id: "start",
    type: "start",
    position: { x: 400, y: 20 },
    data: { label: "Start" },
    deletable: false,
  },

  // Precombat comment
  {
    id: "comment-precombat",
    type: "comment",
    position: { x: 600, y: 20 },
    data: {
      label: "Precombat",
      text: "Summon pet, snapshot stats, determine stronger trinket slot",
    },
  },

  // Variable: stronger_trinket_slot
  {
    id: "var-trinket",
    type: "variable",
    position: { x: 375, y: 90 },
    data: {
      label: "Trinket Slot",
      variableName: "stronger_trinket_slot",
      variableType: "number",
      expression: "trinket.1.has_use_buff ? 1 : 2",
    },
  },

  // CDs condition - Check for Bestial Wrath
  {
    id: "cond-cds",
    type: "condition",
    position: { x: 375, y: 170 },
    data: {
      label: "CDs Ready",
      conditionType: "if",
      subject: "cooldown.bestial_wrath.ready",
      operator: "eq",
      value: true,
    },
  },

  // Bestial Wrath spell
  {
    id: "spell-bw",
    type: "spell",
    position: { x: 180, y: 250 },
    data: {
      label: "Major CD",
      spellId: 19574,
      spellName: "Bestial Wrath",
      color: "#dc2626",
      target: "self",
      enabled: true,
    },
  },

  // Enemy count condition - ST vs Cleave
  {
    id: "cond-enemies",
    type: "condition",
    position: { x: 375, y: 340 },
    data: {
      label: "Enemy Count",
      conditionType: "if",
      subject: "active_enemies",
      operator: "gte",
      value: 3,
    },
  },

  // =========== CLEAVE BRANCH (LEFT) ===========

  // Group: Cleave
  {
    id: "group-cleave",
    type: "group",
    position: { x: 20, y: 420 },
    data: {
      label: "Cleave",
      groupName: "cleave",
      description: "AoE rotation for 3+ targets",
      collapsed: false,
    },
  },

  // Multishot - maintain Beast Cleave
  {
    id: "spell-multishot",
    type: "spell",
    position: { x: 40, y: 500 },
    data: {
      label: "Beast Cleave",
      spellId: 2643,
      spellName: "Multi-Shot",
      color: "#8b5cf6",
      target: "current_target",
      enabled: true,
    },
  },

  // Condition: Beast Cleave active
  {
    id: "cond-beast-cleave",
    type: "condition",
    position: { x: 40, y: 590 },
    data: {
      label: "Cleave Up",
      conditionType: "if",
      subject: "pet.buff.beast_cleave.up",
      operator: "eq",
      value: true,
    },
  },

  // Barbed Shot (Cleave)
  {
    id: "spell-barbed-cleave",
    type: "spell",
    position: { x: 40, y: 680 },
    data: {
      label: "Frenzy",
      spellId: 217200,
      spellName: "Barbed Shot",
      color: "#f97316",
      target: "current_target",
      enabled: true,
    },
  },

  // Kill Command (Cleave)
  {
    id: "spell-kc-cleave",
    type: "spell",
    position: { x: 40, y: 770 },
    data: {
      label: "Priority",
      spellId: 34026,
      spellName: "Kill Command",
      color: "#eab308",
      target: "current_target",
      enabled: true,
    },
  },

  // Cobra Shot (Cleave filler)
  {
    id: "spell-cobra-cleave",
    type: "spell",
    position: { x: 40, y: 860 },
    data: {
      label: "Filler",
      spellId: 193455,
      spellName: "Cobra Shot",
      color: "#22c55e",
      target: "current_target",
      enabled: true,
    },
  },

  // =========== ST BRANCH (RIGHT) ===========

  // Group: ST
  {
    id: "group-st",
    type: "group",
    position: { x: 520, y: 420 },
    data: {
      label: "Single Target",
      groupName: "st",
      description: "Priority for 1-2 targets",
      collapsed: false,
    },
  },

  // Condition: Barbed Shot charges
  {
    id: "cond-barbed-charges",
    type: "condition",
    position: { x: 540, y: 500 },
    data: {
      label: "Barbed Charges",
      conditionType: "if",
      subject: "cooldown.barbed_shot.full_recharge_time",
      operator: "lt",
      value: "gcd",
    },
  },

  // Barbed Shot (ST - high priority)
  {
    id: "spell-barbed-st",
    type: "spell",
    position: { x: 540, y: 590 },
    data: {
      label: "Frenzy",
      spellId: 217200,
      spellName: "Barbed Shot",
      color: "#f97316",
      target: "current_target",
      enabled: true,
    },
  },

  // Kill Command condition
  {
    id: "cond-kc-charges",
    type: "condition",
    position: { x: 540, y: 680 },
    data: {
      label: "KC Charges",
      conditionType: "if",
      subject: "charges_fractional",
      operator: "gte",
      value: "cooldown.barbed_shot.charges_fractional",
    },
  },

  // Kill Command (ST)
  {
    id: "spell-kc-st",
    type: "spell",
    position: { x: 540, y: 770 },
    data: {
      label: "Priority",
      spellId: 34026,
      spellName: "Kill Command",
      color: "#eab308",
      target: "current_target",
      enabled: true,
    },
  },

  // Barbed Shot (ST - filler)
  {
    id: "spell-barbed-st-fill",
    type: "spell",
    position: { x: 540, y: 860 },
    data: {
      label: "Frenzy Maintain",
      spellId: 217200,
      spellName: "Barbed Shot",
      color: "#f97316",
      target: "current_target",
      enabled: true,
    },
  },

  // Cobra Shot (ST filler)
  {
    id: "spell-cobra-st",
    type: "spell",
    position: { x: 540, y: 950 },
    data: {
      label: "Filler",
      spellId: 193455,
      spellName: "Cobra Shot",
      color: "#22c55e",
      target: "current_target",
      enabled: true,
    },
  },

  // =========== EXECUTE PHASE ===========

  // Condition: Execute phase
  {
    id: "cond-execute",
    type: "condition",
    position: { x: 760, y: 250 },
    data: {
      label: "Execute",
      conditionType: "if",
      subject: "target.health.pct",
      operator: "lt",
      value: 20,
    },
  },

  // Kill Shot
  {
    id: "spell-killshot",
    type: "spell",
    position: { x: 760, y: 340 },
    data: {
      label: "Execute",
      spellId: 53351,
      spellName: "Kill Shot",
      color: "#dc2626",
      target: "current_target",
      enabled: true,
    },
  },

  // Comment: Execute priority
  {
    id: "comment-execute",
    type: "comment",
    position: { x: 900, y: 340 },
    data: {
      label: "Execute Note",
      text: "Kill Shot becomes available below 20% HP. Use on cooldown in execute phase.",
    },
  },
];

const INITIAL_EDGES: RotationEdge[] = [
  // Start -> Variable
  {
    id: "e-start-var",
    source: "start",
    target: "var-trinket",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // Variable -> CDs condition
  {
    id: "e-var-cds",
    source: "var-trinket",
    target: "cond-cds",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // CDs condition -> Bestial Wrath (yes)
  {
    id: "e-cds-bw",
    source: "cond-cds",
    sourceHandle: "true",
    target: "spell-bw",
    label: "yes",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#22c55e15" },
    style: { stroke: "#22c55e", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
  },

  // CDs condition -> Enemy count (no)
  {
    id: "e-cds-enemies",
    source: "cond-cds",
    sourceHandle: "false",
    target: "cond-enemies",
    label: "no",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#ef444415" },
    style: { stroke: "#ef4444", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444", width: 12, height: 12 },
  },

  // Bestial Wrath -> Enemy count
  {
    id: "e-bw-enemies",
    source: "spell-bw",
    target: "cond-enemies",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // CDs condition -> Execute check (side branch)
  {
    id: "e-cds-execute",
    source: "cond-cds",
    sourceHandle: "false",
    target: "cond-execute",
    label: "check",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#3b82f615" },
    style: { stroke: "#3b82f6", strokeWidth: 1.5, strokeDasharray: "4 2" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6", width: 12, height: 12 },
  },

  // Execute condition -> Kill Shot (yes)
  {
    id: "e-execute-killshot",
    source: "cond-execute",
    sourceHandle: "true",
    target: "spell-killshot",
    label: "yes",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#22c55e15" },
    style: { stroke: "#22c55e", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
  },

  // Enemy count -> Cleave group (yes, >= 3)
  {
    id: "e-enemies-cleave",
    source: "cond-enemies",
    sourceHandle: "true",
    target: "group-cleave",
    label: "≥3",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#8b5cf615" },
    style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6", width: 12, height: 12 },
  },

  // Enemy count -> ST group (no, < 3)
  {
    id: "e-enemies-st",
    source: "cond-enemies",
    sourceHandle: "false",
    target: "group-st",
    label: "<3",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#3b82f615" },
    style: { stroke: "#3b82f6", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6", width: 12, height: 12 },
  },

  // =========== CLEAVE CHAIN ===========

  // Cleave group -> Multishot
  {
    id: "e-cleave-ms",
    source: "group-cleave",
    target: "spell-multishot",
    animated: true,
    style: { stroke: "#8b5cf6", strokeWidth: 1.5 },
  },

  // Multishot -> Beast Cleave condition
  {
    id: "e-ms-bc",
    source: "spell-multishot",
    target: "cond-beast-cleave",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // Beast Cleave -> Barbed Shot (Cleave)
  {
    id: "e-bc-barbed",
    source: "cond-beast-cleave",
    sourceHandle: "true",
    target: "spell-barbed-cleave",
    label: "yes",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#22c55e15" },
    style: { stroke: "#22c55e", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
  },

  // Barbed Shot -> Kill Command (Cleave)
  {
    id: "e-barbed-kc-cleave",
    source: "spell-barbed-cleave",
    target: "spell-kc-cleave",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // Kill Command -> Cobra Shot (Cleave)
  {
    id: "e-kc-cobra-cleave",
    source: "spell-kc-cleave",
    target: "spell-cobra-cleave",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // =========== ST CHAIN ===========

  // ST group -> Barbed charges condition
  {
    id: "e-st-barbed-cond",
    source: "group-st",
    target: "cond-barbed-charges",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 1.5 },
  },

  // Barbed charges -> Barbed Shot (ST)
  {
    id: "e-barbed-cond-spell",
    source: "cond-barbed-charges",
    sourceHandle: "true",
    target: "spell-barbed-st",
    label: "yes",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#22c55e15" },
    style: { stroke: "#22c55e", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
  },

  // Barbed Shot (ST) -> KC condition
  {
    id: "e-barbed-kc-cond",
    source: "spell-barbed-st",
    target: "cond-kc-charges",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // Barbed charges (no) -> KC condition
  {
    id: "e-barbed-cond-kc",
    source: "cond-barbed-charges",
    sourceHandle: "false",
    target: "cond-kc-charges",
    label: "no",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#ef444415" },
    style: { stroke: "#ef4444", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444", width: 12, height: 12 },
  },

  // KC condition -> Kill Command (ST)
  {
    id: "e-kc-cond-spell",
    source: "cond-kc-charges",
    sourceHandle: "true",
    target: "spell-kc-st",
    label: "yes",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#22c55e15" },
    style: { stroke: "#22c55e", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e", width: 12, height: 12 },
  },

  // Kill Command (ST) -> Barbed Shot (fill)
  {
    id: "e-kc-barbed-fill",
    source: "spell-kc-st",
    target: "spell-barbed-st-fill",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },

  // KC condition (no) -> Barbed Shot (fill)
  {
    id: "e-kc-cond-barbed",
    source: "cond-kc-charges",
    sourceHandle: "false",
    target: "spell-barbed-st-fill",
    label: "no",
    labelStyle: { fontSize: 9 },
    labelBgStyle: { fill: "#ef444415" },
    style: { stroke: "#ef4444", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444", width: 12, height: 12 },
  },

  // Barbed Shot (fill) -> Cobra Shot (ST)
  {
    id: "e-barbed-fill-cobra",
    source: "spell-barbed-st-fill",
    target: "spell-cobra-st",
    animated: true,
    style: { stroke: "#666", strokeWidth: 1.5 },
  },
];

// =============================================================================
// Editor Component
// =============================================================================

interface RotationFlowEditorProps {
  className?: string;
}

export const RotationFlowEditor = memo(function RotationFlowEditor({
  className,
}: RotationFlowEditorProps) {
  // Cast to any to work around strict typing - our custom node types are compatible at runtime
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES as any);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "code">("visual");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("vertical");

  const { isZen, toggleZen } = useZenMode();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) as RotationNode | undefined,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const isCondition = sourceNode?.type === "condition";
      const isTrue = connection.sourceHandle === "true";

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: !isCondition,
            label: isCondition ? (isTrue ? "yes" : "no") : undefined,
            labelStyle: { fontSize: 9 },
            labelBgStyle: {
              fill: isCondition ? (isTrue ? "#22c55e15" : "#ef444415") : undefined,
            },
            style: {
              stroke: isCondition ? (isTrue ? "#22c55e" : "#ef4444") : "#666",
              strokeWidth: 1.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCondition ? (isTrue ? "#22c55e" : "#ef4444") : "#666",
              width: 12,
              height: 12,
            },
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: RotationNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onAddNode = useCallback(
    (node: RotationNode) => {
      setNodes((nds) => nds.concat(node as any));
      setSelectedNodeId(node.id);
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (id: string, data: Partial<RotationNode["data"]>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  const duplicateNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;

      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        selected: false,
      };

      setNodes((nds) => nds.concat(newNode as any));
      setSelectedNodeId(newNode.id);
    },
    [nodes, setNodes]
  );

  const toggleMinimize = useCallback(
    (nodeIds: string[]) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (!nodeIds.includes(node.id)) return node;
          // Only toggle minimize for nodes that support it
          if (
            node.type === "spell" ||
            node.type === "condition" ||
            node.type === "variable" ||
            node.type === "group" ||
            node.type === "sequence"
          ) {
            const data = node.data as { minimized?: boolean };
            return {
              ...node,
              data: { ...node.data, minimized: !data.minimized },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const autoLayout = useCallback(() => {
    // Create a new Dagre graph
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

    const isHorizontal = layoutDirection === "horizontal";

    // Configure the layout
    // - rankdir: TB (top-bottom) or LR (left-right)
    // - nodesep: horizontal separation between nodes
    // - ranksep: vertical separation between ranks (levels)
    // - align: alignment within rank (UL, UR, DL, DR, or undefined for center)
    g.setGraph({
      rankdir: isHorizontal ? "LR" : "TB",
      nodesep: compactMode ? 40 : 60, // Horizontal spacing between siblings
      ranksep: compactMode ? 60 : 100, // Vertical spacing between levels
      marginx: 50,
      marginy: 50,
      align: undefined, // Center alignment
      acyclicer: "greedy", // Handle cycles gracefully
      ranker: "network-simplex", // Better for DAGs with branches
    });

    // Estimate node dimensions based on type
    const getNodeDimensions = (node: { type?: string; data?: { minimized?: boolean } }) => {
      const minimized = (node.data as { minimized?: boolean })?.minimized;
      if (minimized) {
        return { width: 40, height: 40 };
      }
      switch (node.type) {
        case "start":
          return { width: 100, height: 50 };
        case "reroute":
          return { width: 20, height: 20 };
        case "comment":
          return { width: 140, height: 80 };
        case "frame":
          return { width: 200, height: 150 };
        case "condition":
          return { width: compactMode ? 120 : 160, height: compactMode ? 80 : 100 };
        case "sequence":
          return { width: compactMode ? 150 : 180, height: compactMode ? 120 : 160 };
        default:
          return { width: compactMode ? 120 : 160, height: compactMode ? 70 : 90 };
      }
    };

    // Separate connected and disconnected nodes
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // Add nodes to the graph (only connected nodes for layout)
    nodes.forEach((node) => {
      // Skip frame nodes - they are containers and should keep their position
      if (node.type === "frame") return;

      const { width, height } = getNodeDimensions(node);
      g.setNode(node.id, { width, height });
    });

    // Add edges to the graph
    edges.forEach((edge) => {
      // Give different weights to different edge types
      const sourceNode = nodes.find((n) => n.id === edge.source);
      let weight = 1;

      // Edges from condition nodes should be weighted to keep branches apart
      if (sourceNode?.type === "condition") {
        // True branch (left/top) vs False branch (right/bottom)
        weight = edge.sourceHandle === "true" ? 2 : 2;
      }

      g.setEdge(edge.source, edge.target, { weight });
    });

    // Run the layout algorithm
    Dagre.layout(g);

    // Calculate the positions from the layout result
    const positions: Record<string, { x: number; y: number }> = {};

    g.nodes().forEach((nodeId) => {
      const nodeWithPosition = g.node(nodeId);
      if (nodeWithPosition) {
        // Dagre gives us center positions, adjust to top-left for React Flow
        const { width, height } = getNodeDimensions(
          nodes.find((n) => n.id === nodeId) || {}
        );
        positions[nodeId] = {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        };
      }
    });

    // Handle disconnected nodes (comments, frames, orphans)
    // Place them in a row at the right side of the graph
    let disconnectedX = 0;
    let disconnectedY = 0;

    // Find the bounds of the laid out graph
    Object.values(positions).forEach((pos) => {
      disconnectedX = Math.max(disconnectedX, pos.x + 200);
    });

    nodes.forEach((node) => {
      if (!positions[node.id]) {
        if (node.type === "frame") {
          // Keep frame nodes in their original position
          positions[node.id] = { x: node.position.x, y: node.position.y };
        } else if (node.type === "comment") {
          // Stack comments on the right side
          positions[node.id] = { x: disconnectedX + 50, y: disconnectedY };
          disconnectedY += 100;
        } else {
          // Other disconnected nodes
          positions[node.id] = { x: disconnectedX + 50, y: disconnectedY };
          disconnectedY += 120;
        }
      }
    });

    // Apply the new positions
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        position: positions[node.id] || node.position,
      }))
    );
  }, [nodes, edges, setNodes, layoutDirection, compactMode]);

  const nodeCount = nodes.length - 1;
  const edgeCount = edges.length;

  const generatedCode = useMemo(() => {
    return `// Beast Mastery Hunter Rotation (SimC APL)
// Auto-generated from visual flow

variable stronger_trinket_slot = trinket.1.has_use_buff ? 1 : 2;

fn cds() {
  if cooldown.bestial_wrath.ready {
    cast(BESTIAL_WRATH, self);
  }
}

fn cleave() {
  // Maintain Beast Cleave buff
  if pet.buff.beast_cleave.down {
    cast(MULTISHOT, target);
  }
  cast(BARBED_SHOT, target);
  cast(KILL_COMMAND, target);
  cast(COBRA_SHOT, target);
}

fn st() {
  // Barbed Shot if charges capping
  if cooldown.barbed_shot.full_recharge_time < gcd {
    cast(BARBED_SHOT, target);
  }
  // Kill Command when charges available
  if charges_fractional >= cooldown.barbed_shot.charges_fractional {
    cast(KILL_COMMAND, target);
  }
  cast(BARBED_SHOT, target);
  cast(COBRA_SHOT, target);
}

fn rotation() {
  // Execute phase
  if target.health.pct < 20 {
    cast(KILL_SHOT, target);
  }

  cds();

  if active_enemies >= 3 {
    cleave();
  } else {
    st();
  }
}`;
  }, []);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex rounded-lg border overflow-hidden bg-background",
          isZen
            ? "fixed inset-0 z-50 bg-background animate-in fade-in duration-200"
            : "h-[calc(100dvh-8rem)]",
          className
        )}
      >
        {/* Left Sidebar */}
        <Sidebar
          collapsed={leftSidebarCollapsed}
          onToggleCollapse={() => setLeftSidebarCollapsed((v) => !v)}
          className="border-r"
        />

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            showMiniMap={showMiniMap}
            onToggleMiniMap={() => setShowMiniMap((v) => !v)}
            zenMode={isZen}
            onToggleZen={toggleZen}
            onAutoLayout={autoLayout}
            nodeCount={nodeCount}
            edgeCount={edgeCount}
            compactMode={compactMode}
            onToggleCompact={() => setCompactMode((v) => !v)}
            layoutDirection={layoutDirection}
            onLayoutDirectionChange={setLayoutDirection}
          />

          {viewMode === "visual" ? (
            <FlowCanvas
              nodes={nodes as RotationNode[]}
              edges={edges as RotationEdge[]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onAddNode={onAddNode}
              onAutoLayout={autoLayout}
              onToggleMinimize={toggleMinimize}
              showGrid={showGrid}
              showMiniMap={showMiniMap}
              compactMode={compactMode}
              layoutDirection={layoutDirection}
            />
          ) : (
            <div className="flex-1 p-2 overflow-auto">
              <pre className="h-full p-3 rounded bg-muted font-mono text-[10px]">
                {generatedCode}
              </pre>
            </div>
          )}

          <Footer />
        </div>

        {/* Right Sidebar */}
        <PropertiesPanel
          selectedNode={selectedNode || null}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onDuplicateNode={duplicateNode}
          onClose={() => setSelectedNodeId(null)}
          collapsed={rightSidebarCollapsed}
          onToggleCollapse={() => setRightSidebarCollapsed((v) => !v)}
          className="border-l"
        />
      </div>
    </TooltipProvider>
  );
});

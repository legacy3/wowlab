"use client";

import {
  memo,
  useRef,
  useCallback,
  useState,
  useEffect,
  type DragEvent,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  useViewport,
  type NodeTypes,
  type EdgeTypes,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
  BackgroundVariant,
  ConnectionLineType,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./rotation-flow.css";
import { HelpCircle, LayoutGrid, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SpellNode,
  ConditionNode,
  VariableNode,
  GroupNode,
  StartNode,
  CommentNode,
  RerouteNode,
  FrameNode,
  SequenceNode,
} from "./nodes";
import { SmartEdge } from "./edges";
import { LegendPanel } from "./legend-panel";
import { ChatPanel } from "./chat-panel";
import { NODE_COLORS } from "./constants";
import type { RotationNode, RotationEdge, LayoutDirection } from "./types";

// =============================================================================
// Node Types Registration
// =============================================================================

// Use type assertion to work around ReactFlow's strict typing
const nodeTypes = {
  spell: SpellNode,
  condition: ConditionNode,
  variable: VariableNode,
  group: GroupNode,
  start: StartNode,
  comment: CommentNode,
  reroute: RerouteNode,
  frame: FrameNode,
  sequence: SequenceNode,
} as NodeTypes;

// =============================================================================
// Edge Types Registration
// =============================================================================

const edgeTypes = {
  smart: SmartEdge,
} as EdgeTypes;

// =============================================================================
// MiniMap Node Color Mapping
// =============================================================================

const nodeColor = (node: RotationNode): string => {
  switch (node.type) {
    case "spell":
      return (node.data as { color?: string }).color || NODE_COLORS.spell;
    case "condition":
      return NODE_COLORS.condition;
    case "variable":
      return NODE_COLORS.variable;
    case "group":
      return NODE_COLORS.group;
    case "start":
      return NODE_COLORS.start;
    case "comment":
      return "#f59e0b"; // Amber for comments
    case "reroute":
      return NODE_COLORS.reroute;
    case "frame":
      return (node.data as { color?: string }).color || NODE_COLORS.frame;
    case "sequence":
      return NODE_COLORS.sequence;
    default:
      return "#666";
  }
};

// =============================================================================
// Selection Stats Component
// =============================================================================

interface SelectionStatsProps {
  nodes: RotationNode[];
}

const SelectionStats = memo(function SelectionStats({
  nodes,
}: SelectionStatsProps) {
  const selectedNodes = nodes.filter((n) => n.selected);
  if (selectedNodes.length <= 1) return null;

  const counts = selectedNodes.reduce(
    (acc, node) => {
      const type = node.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Panel position="top-center" className="!m-2">
      <div className="flex items-center gap-2 px-2.5 py-1 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg text-[10px]">
        <span className="font-semibold">{selectedNodes.length} selected</span>
        <div className="h-3 w-px bg-border" />
        {Object.entries(counts).map(([type, count]) => (
          <span key={type} className="text-muted-foreground">
            {count} {type}
            {count > 1 ? "s" : ""}
          </span>
        ))}
      </div>
    </Panel>
  );
});

// =============================================================================
// Flow Canvas Component
// =============================================================================

interface FlowCanvasProps {
  nodes: RotationNode[];
  edges: RotationEdge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: RotationNode) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: RotationNode) => void;
  onPaneClick: () => void;
  onAddNode: (node: RotationNode) => void;
  onAutoLayout: () => void;
  onToggleMinimize?: (nodeIds: string[]) => void;
  showGrid: boolean;
  showMiniMap: boolean;
  compactMode?: boolean;
  layoutDirection?: LayoutDirection;
}

export const FlowCanvas = memo(function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
  onAddNode,
  onAutoLayout,
  onToggleMinimize,
  showGrid,
  showMiniMap,
  compactMode = false,
  layoutDirection = "vertical",
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // M key - toggle minimize for selected nodes
      if (event.key === "m" || event.key === "M") {
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0 && onToggleMinimize) {
          onToggleMinimize(selectedNodes.map((n) => n.id));
        }
      }

      // F key - fit view
      if (event.key === "f" || event.key === "F") {
        if (!event.metaKey && !event.ctrlKey) {
          reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
        }
      }

      // L key - auto layout
      if (event.key === "l" || event.key === "L") {
        if (!event.metaKey && !event.ctrlKey) {
          onAutoLayout();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, onToggleMinimize, onAutoLayout]);

  // Handle double-click to focus/zoom on node
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: RotationNode) => {
      event.stopPropagation();

      // Zoom to node
      reactFlowInstance.current?.setCenter(
        node.position.x + 60,
        node.position.y + 40,
        { zoom: 1.5, duration: 300 },
      );

      onNodeDoubleClick?.(event, node);
    },
    [onNodeDoubleClick],
  );

  // Track zoom level for LOD
  const handleMove = useCallback((_: unknown, viewport: { zoom: number }) => {
    setCurrentZoom(viewport.zoom);
  }, []);

  // Drag and drop handler
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance.current) return;

      const type = event.dataTransfer.getData("application/reactflow/type");
      const dataStr = event.dataTransfer.getData("application/reactflow/data");

      if (!type) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: dataStr ? JSON.parse(dataStr) : {},
      } as RotationNode;

      onAddNode(newNode);
    },
    [onAddNode],
  );

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Zoom-based LOD class
  const zoomClass =
    currentZoom < 0.5
      ? "zoom-far"
      : currentZoom < 0.75
        ? "zoom-medium"
        : "zoom-normal";

  return (
    <div
      ref={reactFlowWrapper}
      className={`flex-1 ${zoomClass} ${compactMode ? "compact-mode" : ""}`}
    >
      <ReactFlow
        nodes={nodes as any}
        edges={edges as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        onMove={handleMove}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick as any}
        onNodeDoubleClick={handleNodeDoubleClick as any}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Viewport
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        // Grid snapping
        snapToGrid
        snapGrid={[16, 16]}
        // Selection & Panning
        selectionMode={SelectionMode.Partial}
        panOnScroll
        panOnDrag // Left mouse button pans
        selectionOnDrag={false} // Disable drag selection (use shift+drag instead)
        selectionKeyCode="Shift"
        // Connection line
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{ stroke: "#666", strokeWidth: 2 }}
        // Default edge options
        defaultEdgeOptions={{
          type: "smart",
          animated: false,
          style: { strokeWidth: 1.5 },
        }}
        // Other options
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Control"]}
        className="rotation-flow"
      >
        {/* Background Grid */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="hsl(var(--muted-foreground) / 0.15)"
          />
        )}

        {/* Controls */}
        <Controls
          showInteractive={false}
          className="!bg-card/95 !backdrop-blur-sm !border !rounded-lg !shadow-lg [&>button]:!w-6 [&>button]:!h-6 [&>button]:!border-b [&>button]:!border-border/50 [&>button:last-child]:!border-b-0"
          position="bottom-right"
        />

        {/* MiniMap */}
        {showMiniMap && (
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={nodeColor as any}
            nodeBorderRadius={4}
            className="!bg-card/90 !backdrop-blur-sm !border !rounded-lg !shadow-lg"
            style={{ height: 100, width: 140 }}
            maskColor="hsl(var(--background) / 0.7)"
            position="top-right"
          />
        )}

        {/* Legend Panel */}
        <LegendPanel
          collapsed={legendCollapsed}
          onToggle={() => setLegendCollapsed((v) => !v)}
        />

        {/* Selection Stats */}
        <SelectionStats nodes={nodes} />

        {/* Top Left Panel - Help & Auto Layout */}
        <Panel position="top-left" className="!m-2 flex gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-card/95 backdrop-blur-sm shadow-lg"
                onClick={onAutoLayout}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">
              Auto-arrange nodes (L)
            </TooltipContent>
          </Tooltip>
          {onToggleMinimize && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 bg-card/95 backdrop-blur-sm shadow-lg"
                  onClick={() => {
                    const selectedNodes = nodes.filter((n) => n.selected);
                    if (selectedNodes.length > 0) {
                      onToggleMinimize(selectedNodes.map((n) => n.id));
                    }
                  }}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px]">
                Minimize selected (M)
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-card/95 backdrop-blur-sm shadow-lg"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">
              Shortcuts: M=minimize, F=fit, L=layout
            </TooltipContent>
          </Tooltip>
        </Panel>

        {/* AI Chat Panel */}
        <ChatPanel
          isOpen={chatOpen}
          onToggle={() => setChatOpen((v) => !v)}
          onAutoLayout={onAutoLayout}
        />
      </ReactFlow>
    </div>
  );
});

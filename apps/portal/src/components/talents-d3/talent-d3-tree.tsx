"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Talent } from "@wowlab/core/Schemas";
import {
  Search,
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import { cn } from "@/lib/utils";
import {
  computeVisibleNodes,
  filterByHeroTree,
  searchTalentNodes,
  deriveSelectedHeroId,
} from "@/components/talents/talent-utils";
import { env } from "@/lib/env";

interface TalentD3TreeProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  className?: string;
}

function hasSelections(
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections,
): tree is Talent.TalentTreeWithSelections {
  return "selections" in tree;
}

const POSITION_SCALE = 0.05;
const NODE_RADIUS = 18;

// Debounce hook for search - prevents excessive re-renders while typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Prepared node data type for D3
interface NodeDatum {
  id: number;
  x: number;
  y: number;
  entries: readonly Talent.TalentNodeEntry[];
  maxRanks: number;
  subTreeId: number;
  isHero: boolean;
  isSelected: boolean;
  ranksPurchased: number;
  isSearchMatch: boolean;
}

// Prepared edge data type for D3
interface EdgeDatum {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  isUnlocked: boolean;
}

export function TalentD3Tree({ tree, className }: TalentD3TreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to persist D3 selections and zoom behavior across renders
  // This is CRITICAL for proper React/D3 integration
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const mainGroupRef = useRef<d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const isInitializedRef = useRef(false);
  const shouldFitViewRef = useRef(true);

  const selections = hasSelections(tree) ? tree.selections : undefined;

  // Compute visible nodes - memoized
  const visibleNodes = useMemo(
    () => computeVisibleNodes(tree.nodes, tree.edges),
    [tree.nodes, tree.edges],
  );

  const initialHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, selections),
    [tree.subTrees, visibleNodes, selections],
  );

  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    initialHeroId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    node: Talent.TalentNode;
    x: number;
    y: number;
  } | null>(null);

  // Debounce search for performance - wait 150ms after typing stops
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Track tree changes to reset state
  const prevTreeSpecId = useRef(tree.specId);
  useEffect(() => {
    if (prevTreeSpecId.current !== tree.specId) {
      setSelectedHeroId(initialHeroId);
      setSearchQuery("");
      prevTreeSpecId.current = tree.specId;
      shouldFitViewRef.current = true;
      isInitializedRef.current = false;
    }
  }, [tree.specId, initialHeroId]);

  // Track hero changes for fit view
  const prevHeroId = useRef(selectedHeroId);
  useEffect(() => {
    if (prevHeroId.current !== selectedHeroId) {
      shouldFitViewRef.current = true;
      prevHeroId.current = selectedHeroId;
    }
  }, [selectedHeroId]);

  const displayNodes = useMemo(
    () => filterByHeroTree(visibleNodes, selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  const searchMatches = useMemo(
    () => searchTalentNodes(visibleNodes, debouncedSearchQuery),
    [visibleNodes, debouncedSearchQuery],
  );
  const isSearching = debouncedSearchQuery.trim().length > 0;

  // Prepare node data - memoized
  const nodeData: NodeDatum[] = useMemo(() => {
    return displayNodes.map((node) => {
      const selection = selections?.get(node.id);
      return {
        id: node.id,
        x: node.posX * POSITION_SCALE,
        y: node.posY * POSITION_SCALE,
        entries: node.entries,
        maxRanks: node.maxRanks,
        subTreeId: node.subTreeId,
        isHero: node.subTreeId > 0,
        isSelected: selection?.selected ?? false,
        ranksPurchased: selection?.ranksPurchased ?? 0,
        isSearchMatch: searchMatches.has(node.id),
      };
    });
  }, [displayNodes, selections, searchMatches]);

  // Create node map for edge lookup
  const nodeMap = useMemo(
    () => new Map(nodeData.map((n) => [n.id, n])),
    [nodeData],
  );

  // Prepare edge data - memoized
  const edgeData: EdgeDatum[] = useMemo(() => {
    return tree.edges
      .filter((e) => nodeMap.has(e.fromNodeId) && nodeMap.has(e.toNodeId))
      .map((edge) => {
        const from = nodeMap.get(edge.fromNodeId)!;
        const to = nodeMap.get(edge.toNodeId)!;
        return {
          id: edge.id,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          isActive: from.isSelected && to.isSelected,
          isUnlocked: from.isSelected && !to.isSelected,
        };
      });
  }, [tree.edges, nodeMap]);

  // Initialize D3 zoom and main group ONCE
  // This effect only runs on mount and handles cleanup on unmount
  useEffect(() => {
    if (!svgRef.current || isInitializedRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear any existing content
    svg.selectAll("*").remove();

    // Create main group for zoom/pan transformation
    const g = svg.append("g").attr("class", "main-group");
    mainGroupRef.current = g;

    // Create sub-groups for edges and nodes (edges render below nodes)
    g.append("g").attr("class", "edges-group");
    g.append("g").attr("class", "nodes-group");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    isInitializedRef.current = true;

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      svg.on(".zoom", null); // Remove all zoom event listeners
      setTooltip(null);
      isInitializedRef.current = false;
      mainGroupRef.current = null;
      zoomRef.current = null;
    };
  }, []); // Empty deps - only run once on mount

  // Update edges using D3 join pattern (incremental updates, not full rebuild)
  useEffect(() => {
    if (!mainGroupRef.current) return;

    const edgesGroup =
      mainGroupRef.current.select<SVGGElement>("g.edges-group");

    // Use D3 join pattern for efficient enter/update/exit
    edgesGroup
      .selectAll<SVGLineElement, EdgeDatum>("line.edge")
      .data(edgeData, (d) => d.id.toString())
      .join(
        // ENTER: Create new edges
        (enter) =>
          enter
            .append("line")
            .attr("class", "edge")
            .attr("x1", (d) => d.fromX)
            .attr("y1", (d) => d.fromY)
            .attr("x2", (d) => d.toX)
            .attr("y2", (d) => d.toY)
            .attr("stroke", (d) =>
              d.isActive ? "#facc15" : d.isUnlocked ? "#22c55e" : "#4b5563",
            )
            .attr("stroke-width", (d) =>
              d.isActive ? 2.5 : d.isUnlocked ? 2 : 1.5,
            )
            .attr("stroke-opacity", (d) =>
              d.isActive ? 1 : d.isUnlocked ? 0.8 : 0.4,
            ),
        // UPDATE: Update existing edges
        (update) =>
          update
            .attr("x1", (d) => d.fromX)
            .attr("y1", (d) => d.fromY)
            .attr("x2", (d) => d.toX)
            .attr("y2", (d) => d.toY)
            .attr("stroke", (d) =>
              d.isActive ? "#facc15" : d.isUnlocked ? "#22c55e" : "#4b5563",
            )
            .attr("stroke-width", (d) =>
              d.isActive ? 2.5 : d.isUnlocked ? 2 : 1.5,
            )
            .attr("stroke-opacity", (d) =>
              d.isActive ? 1 : d.isUnlocked ? 0.8 : 0.4,
            ),
        // EXIT: Remove old edges
        (exit) => exit.remove(),
      );
  }, [edgeData]);

  // Update nodes using D3 join pattern (incremental updates)
  useEffect(() => {
    if (!mainGroupRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const nodesGroup =
      mainGroupRef.current.select<SVGGElement>("g.nodes-group");

    // Use D3 join pattern for node groups
    const nodeGroups = nodesGroup
      .selectAll<SVGGElement, NodeDatum>("g.node")
      .data(nodeData, (d) => d.id.toString())
      .join(
        // ENTER: Create new node groups with all child elements
        (enter) => {
          const group = enter
            .append("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
            .style("cursor", "pointer");

          // Main circle
          group
            .append("circle")
            .attr("class", "node-bg")
            .attr("r", NODE_RADIUS);

          // Selection ring (always present, visibility controlled)
          group
            .append("circle")
            .attr("class", "selection-ring")
            .attr("r", NODE_RADIUS + 4)
            .attr("fill", "none")
            .attr("stroke", "#facc15")
            .attr("stroke-width", 2);

          // Search highlight ring
          group
            .append("circle")
            .attr("class", "search-ring")
            .attr("r", NODE_RADIUS + 6)
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);

          // Icon image
          group
            .append("image")
            .attr("class", "node-icon")
            .attr("x", -12)
            .attr("y", -12)
            .attr("width", 24)
            .attr("height", 24);

          // Rank badge background
          group
            .append("circle")
            .attr("class", "rank-bg")
            .attr("cx", NODE_RADIUS - 4)
            .attr("cy", NODE_RADIUS - 4)
            .attr("r", 8)
            .attr("fill", "#1f2937")
            .attr("stroke", "#374151");

          // Rank badge text
          group
            .append("text")
            .attr("class", "rank-text")
            .attr("x", NODE_RADIUS - 4)
            .attr("y", NODE_RADIUS - 1)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "bold");

          return group;
        },
        // UPDATE: Keep existing groups
        (update) => update,
        // EXIT: Remove old groups
        (exit) => exit.remove(),
      );

    // Update ALL node groups (both newly entered and existing)
    nodeGroups.each(function (d) {
      const group = d3.select(this);

      // Update transform position
      group.attr("transform", `translate(${d.x}, ${d.y})`);

      // Update opacity based on search state
      group.style("opacity", isSearching && !d.isSearchMatch ? 0.3 : 1);

      // Update main circle styling
      group
        .select("circle.node-bg")
        .attr("fill", d.isSelected ? "#1a1a2e" : "#1f2937")
        .attr(
          "stroke",
          d.isSelected
            ? d.isHero
              ? "#ea580c"
              : "#facc15"
            : d.isHero
              ? "#9a3412"
              : "#374151",
        )
        .attr("stroke-width", d.isSelected ? 3 : 2);

      // Update selection ring visibility
      group
        .select("circle.selection-ring")
        .attr("stroke-opacity", d.isSelected ? 0.6 : 0);

      // Update search ring visibility
      group
        .select("circle.search-ring")
        .attr("stroke-opacity", isSearching && d.isSearchMatch ? 1 : 0);

      // Update icon
      const entry = d.entries[0];
      const iconUrl = entry
        ? `${env.SUPABASE_URL}/functions/v1/icons/small/${entry.iconFileName}.jpg`
        : "";
      group
        .select("image.node-icon")
        .attr("href", iconUrl)
        .attr("clip-path", d.isHero ? "none" : "circle(12px)")
        .style(
          "filter",
          d.isSelected ? "none" : "grayscale(100%) opacity(0.5)",
        );

      // Update rank badge
      const hasMultipleRanks = d.maxRanks > 1;
      group
        .select("circle.rank-bg")
        .style("display", hasMultipleRanks ? "block" : "none");
      group
        .select("text.rank-text")
        .style("display", hasMultipleRanks ? "block" : "none")
        .attr("fill", d.isSelected ? "#22c55e" : "#9ca3af")
        .text(
          d.isSelected ? d.ranksPurchased.toString() : d.maxRanks.toString(),
        );
    });

    // Add/update event handlers for hover
    nodeGroups
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .select("circle.node-bg")
          .attr("r", NODE_RADIUS + 2);
        const [x, y] = d3.pointer(event, container);
        // Find the original node for tooltip data
        const originalNode = displayNodes.find((n) => n.id === d.id);
        if (originalNode) {
          setTooltip({ node: originalNode, x: x + 20, y });
        }
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle.node-bg").attr("r", NODE_RADIUS);
        setTooltip(null);
      });
  }, [nodeData, isSearching, displayNodes]);

  // Fit to view when structure changes (not on every render)
  // This preserves user zoom/pan between selection and search changes
  useEffect(() => {
    if (
      !svgRef.current ||
      !containerRef.current ||
      !mainGroupRef.current ||
      !zoomRef.current
    )
      return;
    if (!shouldFitViewRef.current || nodeData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = mainGroupRef.current;
    const zoom = zoomRef.current;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Calculate bounds of the content
    const bounds = g.node()?.getBBox();
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      const scale = Math.min(
        width / (bounds.width + 80),
        height / (bounds.height + 80),
        1.5,
      );
      const translateX = width / 2 - (bounds.x + bounds.width / 2) * scale;
      const translateY = height / 2 - (bounds.y + bounds.height / 2) * scale;

      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale),
      );
    }

    shouldFitViewRef.current = false;
  }, [nodeData.length, selectedHeroId]);

  // Reset view handler - allows user to reset zoom/pan
  const handleResetView = useCallback(() => {
    shouldFitViewRef.current = true;
    // Force re-render by updating a dependency
    setSelectedHeroId((prev) => prev);
  }, []);

  // Stable handlers using useCallback
  const handleHeroSelect = useCallback((heroId: number | null) => {
    setSelectedHeroId(heroId);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isFullscreen && "fixed inset-0 z-50 bg-background p-4",
        className,
      )}
    >
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">
          {tree.className} — {tree.specName}
        </span>

        {/* Hero selector */}
        {tree.subTrees.length > 0 && (
          <div className="flex gap-1">
            {tree.subTrees.map((subTree) => (
              <Button
                key={subTree.id}
                variant={selectedHeroId === subTree.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2 gap-1.5",
                  selectedHeroId === subTree.id &&
                    "bg-orange-600 hover:bg-orange-700",
                )}
                onClick={() => handleHeroSelect(subTree.id)}
              >
                <GameIcon
                  iconName={subTree.iconFileName}
                  size="small"
                  alt={subTree.name}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs">{subTree.name}</span>
              </Button>
            ))}
            <Button
              variant={selectedHeroId === null ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleHeroSelect(null)}
            >
              Hide Hero
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search talents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-7 w-40 text-xs pl-7"
          />
        </div>

        {/* Reset view */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleResetView}
          title="Reset view"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Fullscreen toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>

        {/* D3 link */}
        <a
          href="https://d3js.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          d3js.org
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* SVG container */}
      <div
        ref={containerRef}
        className={cn(
          "relative rounded-lg border overflow-hidden bg-background/50",
          isFullscreen ? "flex-1" : "h-[600px]",
        )}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="cursor-grab active:cursor-grabbing"
        />

        {/* Tooltip (rendered in React for better UX) */}
        {tooltip && (
          <div
            className="absolute bg-gray-900/95 border border-gray-700 rounded-lg p-3 text-xs max-w-xs pointer-events-none z-50"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="flex items-center gap-2 mb-2">
              <GameIcon
                iconName={
                  tooltip.node.entries[0]?.iconFileName ||
                  "inv_misc_questionmark"
                }
                size="small"
                alt={tooltip.node.entries[0]?.name || "?"}
                className="rounded"
              />
              <div>
                <div
                  className={cn(
                    "font-medium",
                    tooltip.node.subTreeId > 0
                      ? "text-orange-400"
                      : "text-yellow-400",
                  )}
                >
                  {tooltip.node.entries[0]?.name || "Unknown"}
                </div>
                <div className="text-gray-500">
                  {tooltip.node.subTreeId > 0 ? "Hero Talent" : "Talent"}
                  {tooltip.node.maxRanks > 1 &&
                    ` · ${tooltip.node.maxRanks} Ranks`}
                </div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {tooltip.node.entries[0]?.description || "No description"}
            </p>
          </div>
        )}

        {/* Info panel */}
        <div className="absolute top-2 right-2 bg-background/90 border rounded-lg p-3 text-xs space-y-1 max-w-48">
          <div className="font-medium mb-2 flex items-center justify-between">
            <span>D3.js Features</span>
            <a
              href="https://d3js.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-muted-foreground">
            <div>• SVG rendering</div>
            <div>• d3-zoom behavior</div>
            <div>• Data joins (enter/update/exit)</div>
            <div>• Preserved user zoom</div>
          </div>
          <a
            href="https://d3js.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 pt-2 border-t mt-2"
          >
            d3js.org
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

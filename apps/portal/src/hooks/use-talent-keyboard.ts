import { useKeyboardEvent } from "@react-hookz/web";
import type { TalentNodePosition } from "@wowlab/services/Talents";

interface UseTalentKeyboardOptions {
  nodes: TalentNodePosition[];
  focusedNodeId: number | null;
  enabled?: boolean;
  onFocusChange: (nodeId: number | null) => void;
  onSelect: (nodeId: number) => void;
  onDeselect: (nodeId: number) => void;
}

function findClosestNode(
  nodes: TalentNodePosition[],
  current: TalentNodePosition,
  direction: "up" | "down" | "left" | "right",
): TalentNodePosition | null {
  const candidates = nodes.filter((n) => {
    if (n.id === current.id) {
      return false;
    }

    switch (direction) {
      case "up":
        return n.y < current.y;
      case "down":
        return n.y > current.y;
      case "left":
        return n.x < current.x;
      case "right":
        return n.x > current.x;
    }
  });

  if (candidates.length === 0) return null;

  return candidates.reduce((closest, node) => {
    const closestDist = Math.hypot(
      closest.x - current.x,
      closest.y - current.y,
    );
    const nodeDist = Math.hypot(node.x - current.x, node.y - current.y);

    // Weight primary direction more heavily
    const isPrimaryAxis =
      direction === "up" || direction === "down"
        ? Math.abs(node.x - current.x) < Math.abs(node.y - current.y)
        : Math.abs(node.y - current.y) < Math.abs(node.x - current.x);

    const closestIsPrimary =
      direction === "up" || direction === "down"
        ? Math.abs(closest.x - current.x) < Math.abs(closest.y - current.y)
        : Math.abs(closest.y - current.y) < Math.abs(closest.x - current.x);

    if (isPrimaryAxis && !closestIsPrimary) return node;
    if (!isPrimaryAxis && closestIsPrimary) return closest;

    return nodeDist < closestDist ? node : closest;
  });
}

export function useTalentKeyboard({
  nodes,
  focusedNodeId,
  enabled = true,
  onFocusChange,
  onSelect,
  onDeselect,
}: UseTalentKeyboardOptions): void {
  useKeyboardEvent(
    true,
    (e) => {
      if (!enabled || nodes.length === 0) {
        return;
      }

      // Don't interfere with input elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentNode = focusedNodeId
        ? nodes.find((n) => n.id === focusedNodeId)
        : null;

      // Helper to get the first node (top-left)
      const getFirstNode = () =>
        nodes.reduce((min, n) =>
          n.y < min.y || (n.y === min.y && n.x < min.x) ? n : min,
        );

      switch (e.key) {
        case "Tab": {
          if (!focusedNodeId) {
            e.preventDefault();
            onFocusChange(getFirstNode().id);
          }

          break;
        }

        case "Escape": {
          if (focusedNodeId) {
            e.preventDefault();
            onFocusChange(null);
          }

          break;
        }

        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();

          // Auto-focus first node if nothing focused
          if (!currentNode) {
            onFocusChange(getFirstNode().id);
            return;
          }

          const direction = e.key.replace("Arrow", "").toLowerCase() as
            | "up"
            | "down"
            | "left"
            | "right";
          const next = findClosestNode(nodes, currentNode, direction);

          if (next) {
            onFocusChange(next.id);
          }

          break;
        }

        case "Enter":
        case " ": {
          if (focusedNodeId) {
            e.preventDefault();
            onSelect(focusedNodeId);
          }

          break;
        }

        case "Backspace":
        case "Delete": {
          if (focusedNodeId) {
            e.preventDefault();
            onDeselect(focusedNodeId);
          }

          break;
        }
      }
    },
    [],
    { eventOptions: { passive: false } },
  );
}

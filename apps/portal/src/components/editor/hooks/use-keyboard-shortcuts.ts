"use client";

import { useKeyPress } from "ahooks";

import { useSaveRotation } from "@/lib/state";
import { useEditor } from "@/lib/state/editor";

interface KeyboardShortcutsOptions {
  enabled?: boolean;
}

export function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");
  const modKey = isMac ? "⌘" : "Ctrl";

  return shortcut
    .replace("mod", modKey)
    .replace("shift", "⇧")
    .replace("alt", isMac ? "⌥" : "Alt")
    .replace("+", " + ");
}

export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions = {},
  onAddAction?: () => void,
) {
  const { enabled = true } = options;

  const viewMode = useEditor((s) => s.viewMode);
  const setViewMode = useEditor((s) => s.setViewMode);
  const isDirty = useEditor((s) => s.isDirty);

  const { isLoading: isSaving, save } = useSaveRotation();

  const isInputTarget = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    return (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
  };

  useKeyPress(["ctrl.s", "meta.s"], (e) => {
    if (!enabled) {
      return;
    }
    e.preventDefault();
    if (isDirty && !isSaving) {
      void save();
    }
  });

  useKeyPress(["ctrl.e", "meta.e"], (e) => {
    if (!enabled || isInputTarget(e)) {
      return;
    }
    e.preventDefault();
    setViewMode(viewMode === "edit" ? "preview" : "edit");
  });

  useKeyPress(["ctrl.n", "meta.n"], (e) => {
    if (!enabled || isInputTarget(e) || viewMode !== "edit") {
      return;
    }
    e.preventDefault();
    onAddAction?.();
  });
}

export const KEYBOARD_SHORTCUTS = [
  { description: "Save rotation", key: "mod+s" },
  { description: "Toggle edit/preview", key: "mod+e" },
  { description: "Add new action", key: "mod+n" },
] as const;

"use client";

import { useUser } from "@/lib/state";
import { useEditor } from "@/lib/state/editor";

export function useCanEdit(): boolean {
  const { data: user } = useUser();
  const isLocked = useEditor((s) => s.isLocked);
  const ownerId = useEditor((s) => s.ownerId);

  const isOwner = !ownerId || ownerId === user?.id;
  return isOwner && !isLocked;
}

export function useIsOwner(): boolean {
  const { data: user } = useUser();
  const ownerId = useEditor((s) => s.ownerId);

  return !ownerId || ownerId === user?.id;
}

"use client";

import { transformItem } from "@wowlab/services/Data";
import type { Item } from "@wowlab/core/Schemas";

import { usePortalDbcEntity } from "./use-portal-dbc-entity";

export function useItem(itemId: number | null | undefined) {
  return usePortalDbcEntity<Item.ItemDataFlat>("item", itemId, transformItem);
}

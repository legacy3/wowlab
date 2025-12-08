"use client";

import { ExternalLink } from "lucide-react";
import { useItem } from "@/hooks/use-item";

export function WowItemLink({ itemId }: { itemId: number }) {
  const { data: item, isLoading } = useItem(itemId);
  const name = isLoading ? `Item ${itemId}` : (item?.name ?? `Item ${itemId}`);

  return (
    <a
      href={`https://www.wowhead.com/item=${itemId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      {name}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}

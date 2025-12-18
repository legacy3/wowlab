"use client";

import { useItem } from "@/hooks/use-item";
import { WowLink } from "./wow-link";

export function WowItemLink({ itemId }: { itemId: number }) {
  const { data: item, isLoading } = useItem(itemId);

  return (
    <WowLink
      href={`/lab/inspector/item/${itemId}`}
      name={item?.name}
      fallback={`Item ${itemId}`}
      isLoading={isLoading}
    />
  );
}

"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Tree, type TreeNode } from "@/components/ui/tree";
import { cn } from "@/lib/utils";
import type { DocEntry } from "@/lib/docs";

type DocTreeProps = {
  items: DocEntry[];
  basePath?: string;
  activeSlug?: string;
};

function extractNumber(slug: string): string | null {
  const lastSegment = slug.split("/").pop() ?? slug;
  const match = lastSegment.match(/^(\d+)-/);
  return match ? String(parseInt(match[1], 10) + 1) : null;
}

function docEntryToTreeNodes(items: DocEntry[], basePath: string): TreeNode[] {
  return items.map((item) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return {
        id: `group:${item.slug}`,
        label: <span className="font-medium text-sm">{item.title}</span>,
        children: docEntryToTreeNodes(item.children!, basePath),
      };
    }

    const href = `${basePath}/${item.slug}`;

    return {
      id: href,
      label: null,
      _href: href,
      _item: item,
    } as TreeNode & { _href: string; _item: DocEntry };
  });
}

function ItemNumber({ slug }: { slug: string }) {
  const number = extractNumber(slug);

  if (number) {
    return (
      <span className="text-muted-foreground font-mono text-xs tabular-nums w-4 text-right shrink-0">
        {number}.
      </span>
    );
  }

  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function DocTree({
  items,
  basePath = "/docs",
  activeSlug,
}: DocTreeProps) {
  const nodes = docEntryToTreeNodes(items, basePath);
  const activeHref = activeSlug ? `${basePath}/${activeSlug}` : null;

  const renderLeaf = (node: TreeNode) => {
    const extended = node as TreeNode & { _href: string; _item: DocEntry };
    const isActive = extended._href === activeHref;

    return (
      <Link
        href={extended._href}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
          isActive
            ? "bg-muted text-foreground"
            : "hover:bg-muted/50 text-muted-foreground",
        )}
      >
        <ItemNumber slug={extended._item.slug} />
        <span className="font-medium text-sm">{extended._item.title}</span>
      </Link>
    );
  };

  return (
    <Tree
      nodes={nodes}
      renderLeaf={renderLeaf}
      defaultOpen
      className="space-y-1"
    />
  );
}

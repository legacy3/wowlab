"use client";

import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocMeta } from "@/lib/docs";

type DocTreeProps = {
  items: DocMeta[];
  basePath?: string;
};

function extractNumber(slug: string): string | null {
  const match = slug.match(/^(\d+)-/);
  return match ? String(parseInt(match[1], 10) + 1) : null;
}

const rowStyles = cn(
  "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted transition-colors",
);

function ItemLabel({ item }: { item: DocMeta }) {
  return (
    <div className="flex-1 min-w-0">
      <span className="font-medium text-sm">{item.title}</span>
      {item.description && (
        <span className="text-muted-foreground text-xs ml-2 hidden sm:inline">
          {item.description}
        </span>
      )}
    </div>
  );
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

export function DocTree({ items, basePath = "/docs" }: DocTreeProps) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <DocTreeNode key={item.slug} item={item} basePath={basePath} />
      ))}
    </ul>
  );
}

type DocTreeNodeProps = {
  item: DocMeta;
  basePath: string;
  depth?: number;
};

function DocTreeNode({ item, basePath, depth = 0 }: DocTreeNodeProps) {
  const hasChildren = item.children && item.children.length > 0;
  const href = `${basePath}/${item.slug}`;
  const indent = depth > 0 && "ml-4";

  if (!hasChildren) {
    return (
      <li>
        <Link href={href} className={cn(rowStyles, indent)}>
          <ItemNumber slug={item.slug} />
          <ItemLabel item={item} />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Collapsible
        defaultOpen
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger className={cn(rowStyles, indent, "w-full")}>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform shrink-0" />
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">{item.title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-1 mt-1">
            {item.children!.map((child) => (
              <DocTreeNode
                key={child.slug}
                item={child}
                basePath={`${basePath}/${item.slug}`}
                depth={depth + 1}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

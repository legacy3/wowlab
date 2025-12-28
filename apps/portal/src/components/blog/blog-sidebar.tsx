"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogEntry } from "@/lib/blog/types";
import type { TocEntry } from "@/lib/content/types";

type Heading = {
  id: string;
  text: string;
  level: number;
};

type BlogSidebarProps = {
  entry: BlogEntry;
};

function flattenToc(entries: TocEntry[], result: Heading[] = []): Heading[] {
  for (const entry of entries) {
    if (entry.id && entry.depth >= 2) {
      result.push({
        id: entry.id,
        text: entry.value,
        level: entry.depth,
      });
    }

    if (entry.children) {
      flattenToc(entry.children, result);
    }
  }

  return result;
}

function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headingIds]);

  return activeId;
}

function ArticleMeta({ entry }: { entry: BlogEntry }) {
  const formattedDate = formatDate(entry.publishedAt, "d MMM yyyy");
  const readingMinutes = Math.max(
    1,
    Math.round(entry.readingTime?.minutes ?? 0),
  );

  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <time dateTime={entry.publishedAt}>{formattedDate}</time>
      </div>
      {readingMinutes > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatInt(readingMinutes)} min read</span>
        </div>
      )}
    </div>
  );
}

function TableOfContents({
  headings,
  activeId,
}: {
  headings: Heading[];
  activeId: string;
}) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </h3>
      <nav className="space-y-1.5" aria-label="Table of contents">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "block text-[13px] leading-snug transition-colors",
              heading.level === 3 && "pl-3 border-l border-border/50",
              activeId === heading.id
                ? "text-primary font-medium"
                : "text-muted-foreground/70 hover:text-muted-foreground",
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function BlogSidebar({ entry }: BlogSidebarProps) {
  const headings = flattenToc(entry.tableOfContents ?? []);
  const headingIds = headings.map((h) => h.id);
  const activeId = useActiveHeading(headingIds);

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 space-y-6">
        <ArticleMeta entry={entry} />

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="capitalize text-xs bg-muted/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <TableOfContents headings={headings} activeId={activeId} />
      </div>
    </aside>
  );
}

"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, ChevronDown, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import type { BlogEntry } from "@/lib/blog/types";

type BlogListProps = {
  posts: BlogEntry[];
  tags: string[];
};

function BlogListItem({ post }: { post: BlogEntry }) {
  const formattedDate = formatDate(post.publishedAt, "d MMM yyyy");

  return (
    <article>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-center gap-3 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors px-4 -mx-4"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {post.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {post.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {post.tags?.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="capitalize text-xs hidden md:inline-flex"
            >
              {tag}
            </Badge>
          ))}
          <time
            dateTime={post.publishedAt}
            className="text-xs text-muted-foreground whitespace-nowrap tabular-nums"
          >
            {formattedDate}
          </time>
        </div>
      </Link>
    </article>
  );
}

export function BlogList({ posts, tags }: BlogListProps) {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const tagFilteredPosts = useMemo(() => {
    if (activeTag === "all") {
      return posts;
    }

    return posts.filter((post) => post.tags?.includes(activeTag));
  }, [posts, activeTag]);

  const { results: filteredPosts } = useFuzzySearch({
    items: tagFilteredPosts,
    query: search,
    keys: ["title", "description"],
    threshold: 0.4,
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 64, []), // py-3 (24px) + title (18px) + desc (16px) + border
    overscan: 10,
  });

  const shouldVirtualize = filteredPosts.length > 20;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Tag className="h-3.5 w-3.5" />
              {activeTag === "all" ? "All tags" : activeTag}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={activeTag}
              onValueChange={setActiveTag}
            >
              <DropdownMenuRadioItem value="all">
                All tags
              </DropdownMenuRadioItem>
              {tags.map((tag) => (
                <DropdownMenuRadioItem
                  key={tag}
                  value={tag}
                  className="capitalize"
                >
                  {tag}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {filteredPosts.length} posts
        </span>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No posts found.
        </p>
      ) : shouldVirtualize ? (
        <div ref={parentRef} className="h-[500px] overflow-auto -mx-4 px-4">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const post = filteredPosts[virtualRow.index];
              if (!post) {
                return null;
              }

              return (
                <div
                  key={post.slug}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <BlogListItem post={post} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <BlogListItem key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

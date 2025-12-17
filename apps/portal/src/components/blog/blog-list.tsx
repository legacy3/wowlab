"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BlogEntry } from "@/lib/blog/types";

type BlogListProps = {
  posts: BlogEntry[];
  tags: string[];
};

function TagFilter({
  tags,
  activeTag,
  onTagChange,
}: {
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onTagChange(null)}
        className={cn(
          "px-2.5 py-1 text-xs rounded-md transition-colors",
          activeTag === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagChange(tag)}
          className={cn(
            "px-2.5 py-1 text-xs rounded-md transition-colors capitalize",
            activeTag === tag
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

function BlogListItem({ post }: { post: BlogEntry }) {
  const formattedDate = format(parseISO(post.publishedAt), "d MMM yyyy");

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-center gap-3 py-3 border-t border-border/50 hover:bg-muted/20 transition-colors -mx-2 px-2 rounded"
    >
      <h3 className="flex-1 min-w-0 text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
        {post.title}
      </h3>

      <div className="flex items-center gap-3 shrink-0">
        {post.tags?.slice(0, 2).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="capitalize text-xs hidden sm:inline-flex"
          >
            {tag}
          </Badge>
        ))}
        <time className="text-xs text-muted-foreground whitespace-nowrap w-20 text-right">
          {formattedDate}
        </time>
      </div>
    </Link>
  );
}

export function BlogList({ posts, tags }: BlogListProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    // TODO Improve this with an actual fuzzy-search algorithm
    return posts.filter((post) => {
      const matchesTag = activeTag === null || post.tags?.includes(activeTag);
      const matchesSearch =
        search === "" ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase());

      return matchesTag && matchesSearch;
    });
  }, [posts, activeTag, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />
        <Input
          type="search"
          placeholder="Search blog"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-48 h-8 text-sm"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No posts found.
        </p>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <BlogListItem key={post.slug} post={post} />
          ))}
          <p className="text-muted-foreground/50 text-center text-xs py-4">
            {filteredPosts.length} posts
          </p>
        </div>
      )}
    </div>
  );
}

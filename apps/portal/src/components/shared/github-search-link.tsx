"use client";

import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

export function GithubSearchLink({
  query,
  label,
  className,
  mode = "text",
}: {
  query: string;
  label: string;
  className?: string;
  mode?: "text" | "icon";
}) {
  const href = `${env.GITHUB_URL}/search?q=${encodeURIComponent(query)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        mode === "icon"
          ? "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          : "flex items-center gap-1 text-xs text-muted-foreground font-mono shrink-0 hover:text-foreground transition-colors",
        className,
      )}
      aria-label={`Search ${label} in GitHub`}
      title={`Search ${label} in GitHub`}
    >
      <Code2 className={cn(mode === "icon" ? "h-4 w-4" : "h-3 w-3")} />
      {mode === "text" ? label : <span className="sr-only">{label}</span>}
    </a>
  );
}

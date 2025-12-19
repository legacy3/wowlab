"use client";

import { type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";

interface InsertableCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  snippet: string;
  onInsert: (snippet: string) => void;
  insertLabel?: string;
  meta?: ReactNode;
  className?: string;
}

export function InsertableCard({
  title,
  subtitle,
  description,
  snippet,
  onInsert,
  insertLabel = "Insert",
  meta,
  className,
}: InsertableCardProps) {
  const { copied, copy } = useCopyFeedback();

  return (
    <div
      className={cn(
        "group rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <code className="text-xs font-semibold text-primary">{title}</code>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {subtitle}
            </p>
          )}
          {meta}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copy(snippet)}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500 animate-in zoom-in-50 duration-200" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onInsert(snippet)}
          >
            {insertLabel}
          </Button>
        </div>
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

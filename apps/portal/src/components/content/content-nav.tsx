"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKeyboardEvent } from "@react-hookz/web";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/content/types";

type ContentNavProps = {
  prev: NavItem;
  next: NavItem;
  showSubtitle?: boolean;
  className?: string;
};

export function ContentNav({
  prev,
  next,
  showSubtitle = false,
  className,
}: ContentNavProps) {
  const router = useRouter();

  useKeyboardEvent(
    true,
    (e) => {
      if (e.key === "ArrowLeft" && prev) {
        router.push(prev.href);
      } else if (e.key === "ArrowRight" && next) {
        router.push(next.href);
      }
    },
    [],
    { eventOptions: { passive: true } },
  );

  return (
    <nav
      className={cn(
        "not-prose mt-12 pt-6 border-t border-border flex justify-between",
        className,
      )}
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {showSubtitle ? (
            <div className="flex flex-col">
              <span className="text-xs">Previous</span>
              <span className="font-medium">{prev.title}</span>
            </div>
          ) : (
            <span>{prev.title}</span>
          )}
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className={cn(
            "group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors",
            showSubtitle && "text-right",
          )}
        >
          {showSubtitle ? (
            <div className="flex flex-col">
              <span className="text-xs">Next</span>
              <span className="font-medium">{next.title}</span>
            </div>
          ) : (
            <span>{next.title}</span>
          )}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKeyboardEvent } from "@react-hookz/web";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DocMeta } from "@/lib/docs";

type DocNavProps = {
  prev: DocMeta | null;
  next: DocMeta | null;
};

export function DocNav({ prev, next }: DocNavProps) {
  const router = useRouter();

  useKeyboardEvent(
    true,
    (e) => {
      if (e.key === "ArrowLeft" && prev) {
        router.push(`/docs/${prev.slug}`);
      } else if (e.key === "ArrowRight" && next) {
        router.push(`/docs/${next.slug}`);
      }
    },
    [],
    { eventOptions: { passive: true } },
  );

  return (
    <nav className="mt-12 pt-6 border-t border-border flex justify-between">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{next.title}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

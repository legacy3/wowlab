"use client";

import { docsIndex } from "@/lib/docs";
import { DocTree } from "./doc-tree";

interface DocSidebarProps {
  currentSlug: string;
}

export function DocSidebar({ currentSlug }: DocSidebarProps) {
  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <nav className="sticky top-20">
        <DocTree items={docsIndex} activeSlug={currentSlug} />
      </nav>
    </aside>
  );
}

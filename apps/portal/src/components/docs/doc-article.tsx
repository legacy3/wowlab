import { cn } from "@/lib/utils";
import { DocUpdatedAt } from "./doc-updated-at";
import type { DocMeta } from "@/lib/docs";

type DocArticleProps = {
  children: React.ReactNode;
  meta?: DocMeta;
  className?: string;
  footer?: React.ReactNode;
};

export function DocArticle({
  children,
  meta,
  className,
  footer,
}: DocArticleProps) {
  return (
    <article className={cn("prose prose-invert max-w-3xl", className)}>
      {children}
      <DocUpdatedAt date={meta?.updatedAt} />
      {footer}
    </article>
  );
}

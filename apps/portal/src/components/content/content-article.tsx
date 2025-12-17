import { cn } from "@/lib/utils";

type ContentArticleProps = {
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  afterContent?: React.ReactNode;
};

export function ContentArticle({
  children,
  className,
  footer,
  afterContent,
}: ContentArticleProps) {
  return (
    <article className={cn("prose prose-invert max-w-none", className)}>
      {children}
      {afterContent}
      {footer}
    </article>
  );
}

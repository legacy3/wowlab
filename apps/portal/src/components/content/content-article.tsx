import type { ReactNode } from "react";

import { Box } from "styled-system/jsx";
import { prose } from "styled-system/recipes";

type ContentArticleProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  afterContent?: ReactNode;
};

export function ContentArticle({
  afterContent,
  children,
  className,
  footer,
}: ContentArticleProps) {
  return (
    <Box as="article" className={`${prose()} ${className ?? ""}`}>
      {children}
      {afterContent}
      {footer}
    </Box>
  );
}

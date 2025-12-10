import type { MDXComponents } from "mdx/types";
import {
  MdH1,
  MdH2,
  MdH3,
  MdH4,
  MdParagraph,
  MdBlockquote,
  MdUl,
  MdOl,
  MdLi,
  MdLink,
  MdTable,
  MdThead,
  MdTbody,
  MdTr,
  MdTh,
  MdTd,
  MdPre,
  MdCode,
} from "@/components/docs";

// prettier-ignore
const components: MDXComponents = {
  h1: ({ children }) => <MdH1>{children}</MdH1>,
  h2: ({ children }) => <MdH2>{children}</MdH2>,
  h3: ({ children }) => <MdH3>{children}</MdH3>,
  h4: ({ children }) => <MdH4>{children}</MdH4>,
  p: ({ children }) => <MdParagraph>{children}</MdParagraph>,
  blockquote: ({ children }) => <MdBlockquote>{children}</MdBlockquote>,
  ul: ({ children }) => <MdUl>{children}</MdUl>,
  ol: ({ children }) => <MdOl>{children}</MdOl>,
  li: ({ children }) => <MdLi>{children}</MdLi>,
  a: ({ href, children }) => <MdLink href={href}>{children}</MdLink>,
  table: ({ children }) => <MdTable>{children}</MdTable>,
  thead: ({ children }) => <MdThead>{children}</MdThead>,
  tbody: ({ children }) => <MdTbody>{children}</MdTbody>,
  tr: ({ children }) => <MdTr>{children}</MdTr>,
  th: ({ children }) => <MdTh>{children}</MdTh>,
  td: ({ children }) => <MdTd>{children}</MdTd>,
  pre: ({ children }) => <MdPre>{children}</MdPre>,
  code: ({ className, children }) => <MdCode className={className}>{children}</MdCode>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

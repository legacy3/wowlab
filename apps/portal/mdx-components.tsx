import type { MDXComponents } from "mdx/types";

import { MdCode, MdPre } from "@/components/content/md/md-code";
import {
  MdH2,
  MdH3,
  MdH4,
  MdH5,
  MdH6,
} from "@/components/content/md/md-heading";
import { MdImg } from "@/components/content/md/md-img";
import { MdLink } from "@/components/content/md/md-link";
import { MdLi, MdOl, MdUl } from "@/components/content/md/md-list";
import {
  MdTable,
  MdTbody,
  MdTd,
  MdTh,
  MdThead,
  MdTr,
} from "@/components/content/md/md-table";
import {
  MdBlockquote,
  MdDel,
  MdEm,
  MdHr,
  MdParagraph,
  MdStrong,
} from "@/components/content/md/md-text";

/* eslint-disable perfectionist/sort-objects */

// prettier-ignore
const components: MDXComponents = {
  // Headings
  h1: () => null, // Title shown in PageLayout, skip h1 from markdown
  h2: ({ id, children }) => <MdH2 id={id}>{children}</MdH2>,
  h3: ({ id, children }) => <MdH3 id={id}>{children}</MdH3>,
  h4: ({ id, children }) => <MdH4 id={id}>{children}</MdH4>,
  h5: ({ id, children }) => <MdH5 id={id}>{children}</MdH5>,
  h6: ({ id, children }) => <MdH6 id={id}>{children}</MdH6>,

  // Block elements
  p: ({ children }) => <MdParagraph>{children}</MdParagraph>,
  blockquote: ({ children }) => <MdBlockquote>{children}</MdBlockquote>,
  hr: () => <MdHr />,

  // Lists
  ul: ({ children }) => <MdUl>{children}</MdUl>,
  ol: ({ children }) => <MdOl>{children}</MdOl>,
  li: ({ children }) => <MdLi>{children}</MdLi>,

  // Inline elements
  a: ({ href, children }) => <MdLink href={href}>{children}</MdLink>,
  em: ({ children }) => <MdEm>{children}</MdEm>,
  strong: ({ children }) => <MdStrong>{children}</MdStrong>,
  del: ({ children }) => <MdDel>{children}</MdDel>,

  // Media
  img: ({ src, alt }) => <MdImg src={src} alt={alt} />,

  // Tables
  table: ({ children }) => <MdTable>{children}</MdTable>,
  thead: ({ children }) => <MdThead>{children}</MdThead>,
  tbody: ({ children }) => <MdTbody>{children}</MdTbody>,
  tr: ({ children }) => <MdTr>{children}</MdTr>,
  th: ({ children }) => <MdTh>{children}</MdTh>,
  td: ({ children }) => <MdTd>{children}</MdTd>,

  // Code
  pre: ({ children }) => <MdPre>{children}</MdPre>,
  code: ({ className, children }) => <MdCode className={className}>{children}</MdCode>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

import type { ComponentType } from "react";

import * as runtime from "react/jsx-runtime";

import {
  MdAlert,
  MdBadge,
  MdBibliography,
  MdBlockquote,
  MdCard,
  MdCardGrid,
  MdCite,
  MdCode,
  MdCollapsible,
  MdDel,
  MdEm,
  MdFeatureCard,
  MdH2,
  MdH3,
  MdH4,
  MdH5,
  MdH6,
  MdHr,
  MdIcon,
  MdImg,
  MdKbd,
  MdLi,
  MdLink,
  MdOl,
  MdParagraph,
  MdPre,
  MdStep,
  MdSteps,
  MdStrong,
  MdTabContent,
  MdTable,
  MdTabList,
  MdTabs,
  MdTabTrigger,
  MdTbody,
  MdTd,
  MdTh,
  MdThead,
  MdTr,
  MdUl,
} from "@/components/content/md";

const nativeComponents = {
  a: MdLink,
  blockquote: MdBlockquote,
  code: MdCode,
  del: MdDel,
  em: MdEm,
  h2: MdH2,
  h3: MdH3,
  h4: MdH4,
  h5: MdH5,
  h6: MdH6,
  hr: MdHr,
  img: MdImg,
  li: MdLi,
  ol: MdOl,
  p: MdParagraph,
  pre: MdPre,
  strong: MdStrong,
  table: MdTable,
  tbody: MdTbody,
  td: MdTd,
  th: MdTh,
  thead: MdThead,
  tr: MdTr,
  ul: MdUl,
};

const customComponents = {
  Alert: MdAlert,
  Badge: MdBadge,
  Bibliography: MdBibliography,
  Card: MdCard,
  CardGrid: MdCardGrid,
  Cite: MdCite,
  Collapsible: MdCollapsible,
  FeatureCard: MdFeatureCard,
  Icon: MdIcon,
  Kbd: MdKbd,
  Step: MdStep,
  Steps: MdSteps,
  TabContent: MdTabContent,
  TabList: MdTabList,
  Tabs: MdTabs,
  TabTrigger: MdTabTrigger,
};

type MDXContentProps = {
  code: string;
  components?: Record<string, ComponentType>;
};

export function MDXContent({ code, components }: MDXContentProps) {
  const fn = new Function(code);
  const Component = fn({ ...runtime }).default;

  return (
    <Component
      components={{ ...nativeComponents, ...customComponents, ...components }}
    />
  );
}

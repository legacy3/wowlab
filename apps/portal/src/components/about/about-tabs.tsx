"use client";

import { useQueryState } from "nuqs";

import type { AboutPage } from "@/lib/content/about";

import { ContentArticle } from "@/components/content/content-article";
import { MDXContent } from "@/components/content/mdx-content";
import * as Tabs from "@/components/ui/tabs";

type AboutTabsProps = {
  pages: AboutPage[];
};

export function AboutTabs({ pages }: AboutTabsProps) {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: pages[0] ? toTabId(pages[0].slug) : "",
  });

  const activePage = findByTab(tab, pages);

  return (
    <Tabs.Root
      value={activePage ? toTabId(activePage.slug) : ""}
      onValueChange={(e) => setTab(e.value)}
    >
      <Tabs.List mb="6">
        {pages.map((page) => (
          <Tabs.Trigger key={page.slug} value={toTabId(page.slug)}>
            {page.title}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator />
      </Tabs.List>

      {pages.map((page) => (
        <Tabs.Content key={page.slug} value={toTabId(page.slug)}>
          <ContentArticle>
            <MDXContent code={page.body} />
          </ContentArticle>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function findByTab(tab: string, pages: AboutPage[]) {
  return pages.find((p) => toTabId(p.slug) === tab) ?? pages[0];
}

function toTabId(slug: string) {
  return slug.replace(/^about\//, "");
}

import { PageLayout } from "@/components/page";
import { UrlTabs } from "@/components/ui/url-tabs";
import { DocArticle } from "@/components/docs";

import * as MdOverview from "@/content/about/overview.md";
import * as MdTerms from "@/content/about/terms-of-service.md";
import * as MdPrivacy from "@/content/about/privacy-policy.md";

export default function AboutPage() {
  return (
    <PageLayout
      title="About"
      description="What is WoW Lab and how does it work"
      breadcrumbs={[{ label: "About", href: "/about" }]}
    >
      <UrlTabs
        paramName="tab"
        defaultTab="about"
        tabs={[
          {
            value: "about",
            label: MdOverview.meta.title,
            content: (
              <DocArticle meta={MdOverview.meta}>
                <MdOverview.default />
              </DocArticle>
            ),
          },
          {
            value: "terms-of-service",
            label: MdTerms.meta.title,
            content: (
              <DocArticle meta={MdTerms.meta}>
                <MdTerms.default />
              </DocArticle>
            ),
          },
          {
            value: "privacy-policy",
            label: MdPrivacy.meta.title,
            content: (
              <DocArticle meta={MdPrivacy.meta}>
                <MdPrivacy.default />
              </DocArticle>
            ),
          },
        ]}
      />
    </PageLayout>
  );
}

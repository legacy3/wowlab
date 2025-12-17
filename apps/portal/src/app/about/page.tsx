import { UrlTabs } from "@/components/ui/url-tabs";
import { ContentArticle } from "@/components/content/content-article";

import * as MdOverview from "@/content/about/overview.md";
import * as MdTerms from "@/content/about/terms-of-service.md";
import * as MdPrivacy from "@/content/about/privacy-policy.md";

export default function AboutPage() {
  return (
    <UrlTabs
      paramName="tab"
      defaultTab="about"
      tabs={[
        {
          value: "about",
          label: MdOverview.meta.title,
          content: (
            <ContentArticle>
              <MdOverview.default />
            </ContentArticle>
          ),
        },
        {
          value: "terms-of-service",
          label: MdTerms.meta.title,
          content: (
            <ContentArticle>
              <MdTerms.default />
            </ContentArticle>
          ),
        },
        {
          value: "privacy-policy",
          label: MdPrivacy.meta.title,
          content: (
            <ContentArticle>
              <MdPrivacy.default />
            </ContentArticle>
          ),
        },
      ]}
    />
  );
}

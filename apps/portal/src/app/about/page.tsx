import { PageLayout } from "@/components/page";
import { UrlTabs } from "@/components/ui/url-tabs";
import AboutContent from "@/content/about/overview.md";
import TermsContent from "@/content/about/terms-of-service.md";
import PrivacyContent from "@/content/about/privacy-policy.md";

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
            label: "Overview",
            content: (
              <article className="prose prose-invert max-w-3xl">
                <AboutContent />
              </article>
            ),
          },
          {
            value: "terms-of-service",
            label: "Terms of Service",
            content: (
              <article className="prose prose-invert max-w-3xl">
                <TermsContent />
              </article>
            ),
          },
          {
            value: "privacy-policy",
            label: "Privacy Policy",
            content: (
              <article className="prose prose-invert max-w-3xl">
                <PrivacyContent />
              </article>
            ),
          },
        ]}
      />
    </PageLayout>
  );
}

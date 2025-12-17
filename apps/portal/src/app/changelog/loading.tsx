import { PageLayout } from "@/components/page";
import { ChangelogSkeleton } from "@/components/changelog/changelog";

export default function ChangelogLoading() {
  return (
    <PageLayout
      title="Changelog"
      description="Stay up to date with new features, improvements, and bug fixes"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Changelog" }]}
    >
      <ChangelogSkeleton />
    </PageLayout>
  );
}

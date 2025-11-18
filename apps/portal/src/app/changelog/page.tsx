import { PageLayout } from "@/components/page";
import { Changelog } from "@/components/changelog/changelog";

export default function ChangelogPage() {
  return (
    <PageLayout
      title="Changelog"
      description="Stay up to date with new features, improvements, and bug fixes"
      breadcrumbs={[{ label: "Changelog", href: "/changelog" }]}
    >
      <Changelog />
    </PageLayout>
  );
}

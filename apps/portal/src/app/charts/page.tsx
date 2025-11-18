import { PageLayout } from "@/components/page";
import { ChartsContent } from "@/components/charts";

export default function ChartsPage() {
  return (
    <PageLayout
      title="Charts & Analytics"
      description="View detailed performance analytics"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Charts" }]}
    >
      <ChartsContent />
    </PageLayout>
  );
}

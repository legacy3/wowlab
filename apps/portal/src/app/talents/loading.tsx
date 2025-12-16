import { PageLayout } from "@/components/page";
import { TalentCalculatorSkeleton } from "@/components/talents/calculator";

export default function TalentsLoading() {
  return (
    <PageLayout
      title="Talent Calculator"
      description="View and share talent builds using talent strings"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Talents" }]}
    >
      <TalentCalculatorSkeleton />
    </PageLayout>
  );
}

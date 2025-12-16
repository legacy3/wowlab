import { PageLayout } from "@/components/page";
import { TalentCalculatorContent } from "@/components/talents/calculator";

export default function TalentsPage() {
  return (
    <PageLayout
      title="Talent Calculator"
      description="View and share talent builds using talent strings"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Talents" }]}
    >
      <TalentCalculatorContent />
    </PageLayout>
  );
}

import { PageLayout } from "@/components/page";
import { TalentCalculatorContent } from "@/components/lab/talent-calculator";

export default function TalentCalculatorPage() {
  return (
    <PageLayout
      title="Talent Calculator"
      description="View and share talent builds using talent strings"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Talent Calculator" },
      ]}
    >
      <TalentCalculatorContent />
    </PageLayout>
  );
}

import { PageLayout } from "@/components/page";
import { ComputingContent } from "@/components/computing";

export default function ComputingPage() {
  return (
    <PageLayout
      title="Computing Jobs"
      description="Monitor long-running simulations"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Computing" }]}
    >
      <ComputingContent />
    </PageLayout>
  );
}

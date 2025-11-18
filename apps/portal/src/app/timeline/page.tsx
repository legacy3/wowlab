import { PageLayout } from "@/components/page";
import { TimelineDashboard } from "@/components/timeline";

export default function TimelinePage() {
  return (
    <PageLayout
      title="Combat Timeline"
      description="View detailed combat event timeline"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Timeline" }]}
    >
      <TimelineDashboard />
    </PageLayout>
  );
}

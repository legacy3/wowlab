import { PageLayout } from "@/components/page";
import { TimelineContent } from "@/components/timeline";

export default function TimelinePage() {
  return (
    <PageLayout
      title="Combat Timeline"
      description="Canvas-based timeline visualization"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Timeline" }]}
    >
      <TimelineContent />
    </PageLayout>
  );
}

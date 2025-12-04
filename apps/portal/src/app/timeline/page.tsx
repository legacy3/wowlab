import { PageLayout } from "@/components/page";
import { TimelineContent } from "@/components/timeline";

export default function TimelinePage() {
  return (
    <PageLayout
      title="Combat Timeline"
      description="Compare timeline rendering approaches"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Timeline" }]}
    >
      <TimelineContent />
    </PageLayout>
  );
}

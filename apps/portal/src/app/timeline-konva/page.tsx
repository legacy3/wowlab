import { PageLayout } from "@/components/page";
import { TimelineKonvaContent } from "@/components/timeline-konva";

export default function TimelineKonvaPage() {
  return (
    <PageLayout
      title="Combat Timeline (Konva)"
      description="Canvas-based timeline visualization using Konva"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Timeline Konva" }]}
    >
      <TimelineKonvaContent />
    </PageLayout>
  );
}

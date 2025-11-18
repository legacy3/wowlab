import { PageLayout } from "@/components/page";
import { RotationsBrowse } from "@/components/rotations/rotations-content";

export default function RotationsPage() {
  return (
    <PageLayout
      title="Browse Rotations"
      description="Explore community-created rotation simulations"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rotations" }]}
    >
      <RotationsBrowse />
    </PageLayout>
  );
}

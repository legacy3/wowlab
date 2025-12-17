import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpecCoverageLoading() {
  return (
    <PageLayout
      title="Spec Coverage"
      description="Track implementation status of spells, items, and abilities across all specs."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab" },
        { label: "Spec Coverage" },
      ]}
    >
      <div className="grid gap-4">
        {/* Overview Card Skeleton */}
        <Skeleton className="h-56 rounded-xl" />

        {/* Matrix Card Skeleton */}
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    </PageLayout>
  );
}

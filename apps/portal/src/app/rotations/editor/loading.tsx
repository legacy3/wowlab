import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function RotationEditorLoading() {
  return (
    <PageLayout
      title="New Rotation"
      description="Create a new custom rotation"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "New" },
      ]}
    >
      <div className="flex flex-col h-[600px] rounded-lg border overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="flex-1 rounded-none" />
        <Skeleton className="h-14 w-full rounded-none" />
      </div>
    </PageLayout>
  );
}

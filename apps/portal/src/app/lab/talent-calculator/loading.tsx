import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentCalculatorLoading() {
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
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="h-[700px] w-full" />
      </div>
    </PageLayout>
  );
}

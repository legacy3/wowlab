import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function SimulateLoading() {
  return (
    <PageLayout
      title="Simulate"
      description="Configure your character and run a simulation"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Simulate" }]}
    >
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </PageLayout>
  );
}

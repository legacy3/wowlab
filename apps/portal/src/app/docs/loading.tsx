import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocsLoading() {
  return (
    <PageLayout
      title="Docs"
      description="Technical documentation and resources for contributors"
      breadcrumbs={[{ label: "Docs", href: "/docs" }]}
    >
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </PageLayout>
  );
}

import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function AccountLoading() {
  return (
    <PageLayout
      title="Account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Account" }]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-48 mt-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

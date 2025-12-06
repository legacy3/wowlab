import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RankingsLoading() {
  return (
    <PageLayout
      title="Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[160px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

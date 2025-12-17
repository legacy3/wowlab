import { PageLayout } from "@/components/page";
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RankingsLoading() {
  return (
    <PageLayout
      title="Rankings"
      description="Explore rankings, loot demand, and standout public simulations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rankings" }]}
    >
      <div className="flex flex-col gap-6">
        <TabsSkeleton
          tabCount={4}
          className="w-full max-w-xl justify-start overflow-x-auto"
        />
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

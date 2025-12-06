import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OptimizeLoading() {
  return (
    <PageLayout
      title="Optimize"
      description="Find optimal gear upgrades for your character"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Optimize" }]}
    >
      <div className="space-y-4">
        <div className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px]">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-md" />
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <div className="grid gap-2 md:grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

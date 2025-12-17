import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InspectorSearchLoading() {
  return (
    <PageLayout
      title="Data Inspector"
      description="Query and inspect spell or item data by ID"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

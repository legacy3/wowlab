import { PageLayout } from "@/components/page";
import { Skeleton, ProfileHeaderSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function UserProfileLoading() {
  return (
    <PageLayout
      title="Profile"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
    >
      <div className="space-y-6">
        <ProfileHeaderSkeleton />

        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

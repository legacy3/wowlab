import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SignInLoading() {
  return (
    <PageLayout
      title="Sign In"
      description="Sign in to your account"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sign In" }]}
    >
      <div className="mx-auto max-w-md py-12">
        <div className="w-full space-y-6">
          <div className="flex flex-col space-y-2 text-center items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

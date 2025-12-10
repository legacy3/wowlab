import { PageLayout } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AboutLoading() {
  return (
    <PageLayout
      title="About"
      description="What is WoWLab and how does it work"
      breadcrumbs={[{ label: "About", href: "/about" }]}
    >
      <div className="max-w-3xl space-y-8">
        <section className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </section>

        <Separator />

        <section className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </section>

        <Separator />

        <section className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

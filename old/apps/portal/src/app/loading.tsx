import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-5 w-72" />
      </header>

      {/* Dashboard grid - matches LandingContent layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recent card - spans 2 cols */}
        <Skeleton className="h-48 sm:col-span-2" />
        {/* Quick sim card - spans 2 cols */}
        <Skeleton className="h-48 sm:col-span-2" />
        {/* Feature cards */}
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        {/* Lab card - spans 2 cols */}
        <Skeleton className="h-32 sm:col-span-2" />
      </div>
    </main>
  );
}

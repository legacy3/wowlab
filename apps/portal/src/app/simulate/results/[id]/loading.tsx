import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";

export default function SimulationResultLoading() {
  return (
    <div className="space-y-4">
      <TabsSkeleton tabCount={4} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

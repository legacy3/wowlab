import {
  Skeleton,
  SearchBarSkeleton,
  CardGridSkeleton,
} from "@/components/ui/skeleton";

export default function RotationsLoading() {
  return (
    <div className="space-y-4">
      <SearchBarSkeleton />
      <Skeleton className="h-4 w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <CardGridSkeleton count={3} columns={3} cardHeight="h-48" />
        </div>
      ))}
    </div>
  );
}

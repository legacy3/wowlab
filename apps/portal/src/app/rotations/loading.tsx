import { Skeleton } from "@/components/ui/skeleton";

export default function RotationsLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-48" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

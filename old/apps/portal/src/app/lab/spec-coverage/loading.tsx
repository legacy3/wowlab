import { Skeleton } from "@/components/ui/skeleton";

export default function SpecCoverageLoading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function SimulateLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

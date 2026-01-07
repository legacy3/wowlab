import { Skeleton } from "@/components/ui/skeleton";

export default function RotationFlowLoading() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex h-[calc(100dvh-8rem)] rounded-lg border overflow-hidden">
        <Skeleton className="w-52 h-full rounded-none" />
        <Skeleton className="flex-1 h-full rounded-none" />
        <Skeleton className="w-56 h-full rounded-none" />
      </div>
    </div>
  );
}

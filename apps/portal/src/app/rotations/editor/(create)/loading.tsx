import { Skeleton } from "@/components/ui/skeleton";

export default function RotationEditorCreateLoading() {
  return (
    <div className="flex flex-col h-[600px] rounded-lg border overflow-hidden">
      <Skeleton className="h-12 w-full rounded-none" />
      <Skeleton className="flex-1 rounded-none" />
      <Skeleton className="h-14 w-full rounded-none" />
    </div>
  );
}

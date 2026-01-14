import { Skeleton } from "@/components/ui/skeleton";
import { CardLoader } from "@/components/ui/flask-loader";

export function RotationEditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        <Skeleton className="size-7" />
        <Skeleton className="h-5 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-24" />
      </header>

      {/* Body */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-60 border-r bg-muted/30 p-2 space-y-1.5">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <CardLoader message="Loading rotation..." />
        </div>
      </div>
    </div>
  );
}

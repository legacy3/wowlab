import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

function TabsSkeleton({
  tabCount = 3,
  className,
}: {
  tabCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px]",
        className,
      )}
    >
      {Array.from({ length: tabCount }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-24 rounded-md" />
      ))}
    </div>
  );
}

function ProseSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-3xl space-y-4", className)}>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-6 w-1/2 mt-6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function TreeSkeleton({
  itemCount = 5,
  className,
}: {
  itemCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-2">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton
            className="h-4"
            style={{ width: `${Math.max(30, 80 - i * 10)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

function CardGridSkeleton({
  count = 3,
  columns = 3,
  cardHeight = "h-48",
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  cardHeight?: string;
  className?: string;
}) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-3", gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cardHeight} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  TabsSkeleton,
  ProseSkeleton,
  TreeSkeleton,
  SearchBarSkeleton,
  CardGridSkeleton,
};

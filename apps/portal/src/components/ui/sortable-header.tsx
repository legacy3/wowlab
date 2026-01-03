import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

export type SortDirection = "asc" | "desc";

interface SortableHeaderProps<T extends string | null> {
  children: React.ReactNode;
  sortKey: T;
  currentSort: T;
  currentDir: SortDirection;
  onSort: (key: T) => void;
  className?: string;
}

export function SortableHeader<T extends string | null>({
  children,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
}: SortableHeaderProps<T>) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded"
      >
        {children}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

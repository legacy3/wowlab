"use client";

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  readonly className?: string;
  readonly page?: number;
  readonly pageCount?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
};

const noop = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
};

export function TablePagination({
  className,
  page = 1,
  pageCount = 5,
  pageSize = 10,
  totalCount = 50,
}: TablePaginationProps) {
  const clampedPage = Math.min(Math.max(page, 1), Math.max(1, pageCount));
  const start = totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, totalCount);
  const paginationItems = React.useMemo<(number | "ellipsis")[]>(() => {
    if (pageCount <= 1) {
      return [1];
    }

    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    if (clampedPage <= 3) {
      return [1, 2, 3, 4, "ellipsis", pageCount];
    }

    if (clampedPage >= pageCount - 2) {
      return [
        1,
        "ellipsis",
        pageCount - 3,
        pageCount - 2,
        pageCount - 1,
        pageCount,
      ];
    }

    return [
      1,
      "ellipsis",
      clampedPage - 1,
      clampedPage,
      clampedPage + 1,
      "ellipsis",
      pageCount,
    ];
  }, [clampedPage, pageCount]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <span className="tabular-nums whitespace-nowrap">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {totalCount.toLocaleString()}
      </span>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={noop}
              className={cn(
                clampedPage === 1 && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
          {paginationItems.map((entry, index) =>
            entry === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  href="#"
                  onClick={noop}
                  isActive={entry === clampedPage}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={noop}
              className={cn(
                clampedPage === pageCount && "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

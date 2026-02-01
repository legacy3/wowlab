"use client";

import type {
  BaseRecord,
  HttpError,
  UseInfiniteListProps,
} from "@refinedev/core";

import { useInfiniteList } from "@refinedev/core";
import { useMemoizedFn } from "ahooks";
import { useEffect } from "react";

import { useVirtualList, type UseVirtualListResult } from "./use-virtual-list";

export interface UseVirtualInfiniteListOptions<
  T extends BaseRecord,
> extends Omit<UseInfiniteListProps<T, HttpError, T>, "pagination"> {
  estimateSize: number | ((index: number) => number);
  fetchThreshold?: number;
  overscan?: number;
  pageSize?: number;
}

export interface UseVirtualInfiniteListResult<
  T extends BaseRecord,
> extends UseVirtualListResult {
  error: HttpError | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  items: T[];
  total: number | undefined;
}

export function useVirtualInfiniteList<T extends BaseRecord>({
  estimateSize,
  fetchThreshold = 10,
  overscan = 5,
  pageSize = 50,
  queryOptions,
  ...infiniteListProps
}: UseVirtualInfiniteListOptions<T>): UseVirtualInfiniteListResult<T> {
  const { query, result } = useInfiniteList<T, HttpError, T>({
    ...infiniteListProps,
    pagination: { pageSize },
    queryOptions: {
      ...queryOptions,
      getNextPageParam: (lastPage, allPages) => {
        const loadedCount = allPages.reduce((acc, p) => acc + p.data.length, 0);
        const total = lastPage.total ?? 0;
        if (loadedCount >= total) return undefined;
        return { current: allPages.length + 1 };
      },
    },
  });

  const {
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = query;

  const pages = result.data?.pages ?? [];
  const items = pages.flatMap((page) => page.data) as T[];
  const total = pages[0]?.total;

  const { parentRef, virtualizer } = useVirtualList({
    count: hasNextPage ? items.length + 1 : items.length,
    estimateSize,
    overscan,
  });

  const checkAndFetch = useMemoizedFn(() => {
    const lastItem = virtualizer.getVirtualItems().at(-1);
    if (!lastItem || !hasNextPage || isFetchingNextPage) return;
    if (lastItem.index >= items.length - fetchThreshold) {
      fetchNextPage();
    }
  });

  useEffect(() => {
    checkAndFetch();
  }, [checkAndFetch, hasNextPage, isFetchingNextPage, items.length]);

  return {
    error: error ?? null,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    items,
    parentRef,
    total,
    virtualizer,
  };
}

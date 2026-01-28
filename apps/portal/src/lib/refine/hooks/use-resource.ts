"use client";

import type {
  BaseRecord,
  HttpError,
  UseListProps,
  UseManyProps,
  UseOneProps,
} from "@refinedev/core";

import { useList, useMany, useOne } from "@refinedev/core";

export function useResource<T extends BaseRecord>(
  options: UseOneProps<T, HttpError, T>,
) {
  const result = useOne<T>(options);
  const data = result.query.data?.data as T | undefined;
  return {
    data,
    error: result.query.error,
    isError: result.query.isError,
    isFetching: result.query.isFetching,
    isLoading: result.query.isLoading,
    isPending: result.query.isPending,
    isSuccess: result.query.isSuccess,
    query: result.query,
  };
}

export function useResourceList<T extends BaseRecord>(
  options: UseListProps<T, HttpError, T>,
) {
  const result = useList<T>(options);
  const data = (result.query.data?.data ?? []) as T[];
  return {
    data,
    error: result.query.error,
    isError: result.query.isError,
    isFetching: result.query.isFetching,
    isLoading: result.query.isLoading,
    isPending: result.query.isPending,
    isSuccess: result.query.isSuccess,
    query: result.query,
  };
}

export function useResourceMany<T extends BaseRecord>(
  options: UseManyProps<T, HttpError, T>,
) {
  const result = useMany<T>(options);
  const data = (result.query.data?.data ?? []) as T[];
  return {
    data,
    error: result.query.error,
    isError: result.query.isError,
    isFetching: result.query.isFetching,
    isLoading: result.query.isLoading,
    isPending: result.query.isPending,
    isSuccess: result.query.isSuccess,
    query: result.query,
  };
}

"use client";

import { ErrorPage } from "@/components/page/error";

export default function Error({
  error,
  reset,
}: {
  error: { digest?: string } & Error;
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
}

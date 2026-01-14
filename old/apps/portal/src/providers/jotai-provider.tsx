"use client";

import { Provider } from "jotai";
import type { PropsWithChildren } from "react";

export function JotaiProvider({ children }: PropsWithChildren) {
  return <Provider>{children}</Provider>;
}

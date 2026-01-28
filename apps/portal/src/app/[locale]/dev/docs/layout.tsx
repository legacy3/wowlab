import type { ReactNode } from "react";

import { DocsSearchProvider } from "@/providers";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsSearchProvider>{children}</DocsSearchProvider>;
}

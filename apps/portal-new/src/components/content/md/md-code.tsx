"use client";

import type { ReactNode } from "react";

import { Code } from "@/components/ui/code";

import { MdMermaid } from "./md-mermaid";

type MdCodeProps = {
  className?: string;
  children: ReactNode;
};

export function MdCode({ children, className = "" }: MdCodeProps) {
  const language = className.replace("language-", "") || undefined;
  const code = String(children).trimEnd();

  if (language === "mermaid") {
    return <MdMermaid chart={code} />;
  }

  return <Code language={language}>{children}</Code>;
}

export function MdPre({ children }: MdCodeProps) {
  return <>{children}</>;
}

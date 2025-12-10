"use client";

import { CodeBlock } from "@/components/ui/code-block";

interface JsonViewProps {
  data: unknown;
  maxHeight?: string;
}

export function JsonView({ data, maxHeight }: JsonViewProps) {
  const json = JSON.stringify(data, null, 2);

  return <CodeBlock code={json} language="json" maxHeight={maxHeight} />;
}

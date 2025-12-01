"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface JsonViewProps {
  data: unknown;
  maxHeight?: string;
}

export function JsonView({ data, maxHeight }: JsonViewProps) {
  const json = JSON.stringify(data, null, 2);

  return (
    <div className={cn("relative rounded-md overflow-auto group", maxHeight)}>
      <CopyButton
        value={json}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      />
      <SyntaxHighlighter
        language="json"
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
        }}
      >
        {json}
      </SyntaxHighlighter>
    </div>
  );
}

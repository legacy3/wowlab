"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: string;
  showCopy?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  maxHeight,
  showCopy = true,
  className,
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        "group relative rounded-md overflow-auto",
        maxHeight,
        className,
      )}
    >
      {showCopy && (
        <CopyButton
          value={code}
          label="Code"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        />
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
          fontSize: "0.8rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MdMermaid } from "./md-mermaid";

type MdInlineCodeProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdInlineCode({ children, className }: MdInlineCodeProps) {
  return (
    <code
      className={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className,
      )}
    >
      {children}
    </code>
  );
}

type MdCodeBlockProps = {
  children: React.ReactNode;
  className?: string;
};

export function MdPre({ children }: MdCodeBlockProps) {
  return <>{children}</>;
}

export function MdCode({ className, children }: MdCodeBlockProps) {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");
  const language = match?.[1];

  if (language === "mermaid") {
    return <MdMermaid chart={code} />;
  }

  if (match) {
    return (
      <div className="my-6 rounded-lg overflow-hidden">
        <SyntaxHighlighter style={oneDark} language={language} PreTag="div">
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return <MdInlineCode>{children}</MdInlineCode>;
}

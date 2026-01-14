"use client";

import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/code-block";
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
    return <CodeBlock code={code} language={language} className="my-6" />;
  }

  return <MdInlineCode>{children}</MdInlineCode>;
}

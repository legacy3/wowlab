"use client";

import { css } from "styled-system/css";

import { Expandable } from "@/components/ui/expandable";
import * as Tabs from "@/components/ui/tabs";

import type { CodeRenderer } from "./renderers/index";

const codeStyles = css({
  bg: "gray.a3",
  borderRadius: "lg",
  display: "block",
  fontFamily: "code",
  fontSize: "sm",
  lineHeight: "relaxed",
  overflow: "auto",
  p: "4",
  whiteSpace: "pre",
});

type CodePreviewProps = {
  code: string;
  language: string;
  renderer: CodeRenderer;
};

export function CodePreview({
  code,
  language,
  renderer: Renderer,
}: CodePreviewProps) {
  return (
    <Tabs.Root defaultValue="preview" my="6">
      <Tabs.List>
        <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        <Tabs.Trigger value="code">{language}</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Content value="preview">
        <Expandable variant="diagram">
          <Renderer code={code} />
        </Expandable>
      </Tabs.Content>
      <Tabs.Content value="code">
        <code className={codeStyles}>{code}</code>
      </Tabs.Content>
    </Tabs.Root>
  );
}

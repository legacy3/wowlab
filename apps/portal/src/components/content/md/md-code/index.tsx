"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";
import { code as inlineCode } from "styled-system/recipes";

import { CodePreview } from "./preview";
import { renderers } from "./renderers/index";

type MdCodeProps = {
  className?: string;
  children: ReactNode;
  "data-language"?: string;
};

type MdPreProps = {
  className?: string;
  children: ReactNode;
  "data-language"?: string;
  "data-theme"?: string;
};

const preStyles = css({
  "& [data-highlighted-chars]": {
    bg: "amber.a4",
    borderRadius: "sm",
    px: "1",
  },
  "& [data-highlighted-line]": {
    bg: "amber.a3",
  },
  "& [data-line]": {
    mx: "-4",
    px: "4",
  },
  "& code": {
    bg: "transparent",
    border: "none",
    display: "block",
    fontFamily: "inherit",
    fontSize: "inherit",
    p: "0",
  },
  bg: "gray.a3",
  borderRadius: "lg",
  fontFamily: "code",
  fontSize: "sm",
  lineHeight: "relaxed",
  my: "6",
  overflow: "auto",
  p: "4",
  position: "relative",
});

const badgeStyles = css({
  backdropFilter: "blur(4px)",
  bg: "bg.default/80",
  borderRadius: "sm",
  color: "fg.muted",
  fontFamily: "code",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  position: "absolute",
  px: "1.5",
  py: "0.5",
  right: "2",
  textTransform: "uppercase",
  top: "2",
  zIndex: "1",
});

export function MdCode({ children, className, ...props }: MdCodeProps) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export function MdInlineCode({ children, className }: MdCodeProps) {
  return (
    <code className={`${inlineCode()} ${className ?? ""}`}>{children}</code>
  );
}

export function MdPre({ children, className, ...props }: MdPreProps) {
  const language = props["data-language"];

  if (language && language in renderers) {
    const code = extractTextContent(children);

    return (
      <CodePreview
        code={code}
        language={language}
        renderer={renderers[language]}
      />
    );
  }

  return (
    <Box position="relative">
      {language && <Box className={badgeStyles}>{language}</Box>}
      <pre className={`${preStyles} ${className ?? ""}`} {...props}>
        {children}
      </pre>
    </Box>
  );
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string") {
    return node;
  }

  if (typeof node === "number") {
    return String(node);
  }

  if (!isValidElement(node)) {
    return "";
  }

  const element = node as ReactElement<{ children?: ReactNode }>;
  const children = element.props.children;

  if (!children) {
    return "";
  }

  return Children.toArray(children).map(extractTextContent).join("");
}

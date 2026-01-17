"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";
import { code } from "styled-system/recipes";

export interface CodeProps {
  children: ReactNode;
  className?: string;
  language?: string;
}

const blockStyles = css({
  "& code": {
    bg: "transparent",
    border: "none",
    display: "block",
    fontFamily: "inherit",
    fontSize: "inherit",
    p: "0",
  },
  "& pre": {
    bg: "transparent !important",
    m: "0 !important",
    p: "4 !important",
  },
  bg: "gray.a3",
  borderRadius: "lg",
  fontFamily: "code",
  fontSize: "sm",
  lineHeight: "relaxed",
  my: "6",
  overflow: "auto",
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

const placeholderStyles = css({
  bg: "gray.a3",
  borderRadius: "lg",
  fontFamily: "code",
  fontSize: "sm",
  lineHeight: "relaxed",
  my: "6",
  overflow: "auto",
  p: "4",
  whiteSpace: "pre",
});

export function Code({ children, className, language }: CodeProps) {
  const [html, setHtml] = useState<string | null>(null);
  const codeString = String(children).trimEnd();

  useEffect(() => {
    if (!language) {
      return;
    }

    let cancelled = false;

    codeToHtml(codeString, {
      lang: language,
      theme: "css-variables",
    }).then((result) => {
      if (!cancelled) {
        setHtml(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [codeString, language]);

  if (language) {
    if (!html) {
      return <Box className={placeholderStyles}>{codeString}</Box>;
    }

    return (
      <Box className={`${blockStyles} ${className ?? ""}`}>
        <Box className={badgeStyles}>{language}</Box>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Box>
    );
  }

  return <code className={`${code()} ${className ?? ""}`}>{children}</code>;
}

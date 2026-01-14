"use client";

import type { ReactNode } from "react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";
import { code } from "styled-system/recipes";

export interface CodeProps {
  children: ReactNode;
  className?: string;
  language?: string;
}

const blockStyles = css({
  "& .token.atrule, & .token.attr-value": {
    color: { _dark: "#a78bfa", _light: "#7c3aed" },
  },
  "& .token.boolean, & .token.number": {
    color: { _dark: "#fbbf24", _light: "#b45309" },
  },
  "& .token.class-name": {
    color: { _dark: "#fbbf24", _light: "#b45309" },
  },
  "& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata": {
    color: { _dark: "slate.9", _light: "slate.9" },
    fontStyle: "italic",
  },
  "& .token.function": {
    color: { _dark: "#60a5fa", _light: "#2563eb" },
  },
  "& .token.keyword": {
    color: { _dark: "#e879f9", _light: "#c026d3" },
  },
  "& .token.operator, & .token.entity, & .token.url, & .token.variable": {
    color: { _dark: "#38bdf8", _light: "#0284c7" },
  },
  "& .token.property, & .token.tag, & .token.constant, & .token.symbol, & .token.deleted":
    {
      color: { _dark: "#fb923c", _light: "#c2410c" },
    },
  "& .token.punctuation": {
    color: { _dark: "slate.11", _light: "slate.11" },
  },
  "& .token.regex, & .token.important": {
    color: { _dark: "#fb923c", _light: "#ea580c" },
  },
  "& .token.selector, & .token.attr-name, & .token.string, & .token.char, & .token.builtin, & .token.inserted":
    {
      color: { _dark: "#4ade80", _light: "#16a34a" },
    },
  "& pre": {
    bg: "gray.a3 !important",
    color: { _dark: "slate.12", _light: "slate.12" },
    fontSize: "sm !important",
    lineHeight: "relaxed !important",
    m: "0 !important",
    p: "4 !important",
  },
  "& pre, & code, & pre *, & code *": {
    fontFamily: "code !important",
  },
  borderRadius: "lg",
  my: "6",
  overflow: "hidden",
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

export function Code({ children, className, language }: CodeProps) {
  if (language) {
    return (
      <Box className={`${blockStyles} ${className ?? ""}`}>
        <Box className={badgeStyles}>{language}</Box>
        <SyntaxHighlighter
          language={language}
          useInlineStyles={false}
          codeTagProps={{ style: { fontFamily: "inherit" } }}
        >
          {String(children).trimEnd()}
        </SyntaxHighlighter>
      </Box>
    );
  }

  return <code className={`${code()} ${className ?? ""}`}>{children}</code>;
}

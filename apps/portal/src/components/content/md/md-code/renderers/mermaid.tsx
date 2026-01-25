"use client";

import { slate, slateDark } from "@radix-ui/colors";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { ErrorBox } from "@/components/ui/error-box";
import { Text } from "@/components/ui/text";

function getColors(isDark: boolean) {
  const s = isDark ? slateDark : slate;

  return {
    accent: s.slate4,
    altSection: s.slate1,
    bg: "transparent",
    cluster: s.slate2,
    clusterBorder: s.slate6,
    line: s.slate9,
    node: s.slate3,
    nodeBorder: s.slate7,
    text: s.slate12,
    textMuted: s.slate11,
  };
}

function initializeMermaid(isDark: boolean) {
  const colors = getColors(isDark);

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      activationBkgColor: colors.accent,
      activationBorderColor: colors.nodeBorder,
      actorBkg: colors.node,

      actorBorder: colors.nodeBorder,
      actorLineColor: colors.line,
      actorTextColor: colors.text,

      altBackground: colors.cluster,
      altSectionBkgColor: colors.altSection,
      background: colors.bg,

      classText: colors.text,
      clusterBkg: colors.cluster,
      clusterBorder: colors.clusterBorder,

      defaultLinkColor: colors.line,
      edgeLabelBackground: colors.node,

      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "14px",
      gridColor: colors.clusterBorder,

      labelBoxBkgColor: colors.node,
      labelBoxBorderColor: colors.nodeBorder,
      labelColor: colors.text,
      labelTextColor: colors.text,
      lineColor: colors.line,
      loopTextColor: colors.text,
      nodeBorder: colors.nodeBorder,
      noteBkgColor: colors.accent,
      noteBorderColor: colors.nodeBorder,
      noteTextColor: colors.text,
      primaryBorderColor: colors.nodeBorder,
      primaryColor: colors.node,
      primaryTextColor: colors.text,

      secondaryBorderColor: colors.nodeBorder,
      secondaryColor: colors.accent,
      secondaryTextColor: colors.text,
      sectionBkgColor: colors.cluster,
      sequenceNumberColor: colors.text,

      signalColor: colors.text,
      signalTextColor: colors.text,
      taskBkgColor: colors.node,
      taskBorderColor: colors.nodeBorder,
      taskTextColor: colors.text,
      taskTextDarkColor: colors.text,
      taskTextOutsideColor: colors.text,
      tertiaryBorderColor: colors.nodeBorder,
      tertiaryColor: colors.accent,

      tertiaryTextColor: colors.text,
      textColor: colors.text,
      todayLineColor: colors.line,
    },
  });
}

const styles = css({
  "& svg": {
    height: "auto",
    maxWidth: "100%",
  },
  display: "flex",
  fontFamily: "mono",

  justifyContent: "center",
});

export function MermaidRenderer({ code }: { code: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const renderCountRef = useRef(0);

  const isDark = resolvedTheme === "dark";
  const cleanCode = code.trim();

  useEffect(() => {
    const renderChart = async () => {
      const renderCount = ++renderCountRef.current;
      const renderId = `mermaid-${id.replace(/:/g, "")}-${renderCount}`;

      initializeMermaid(isDark);

      try {
        const { svg } = await mermaid.render(renderId, cleanCode);

        if (renderCount === renderCountRef.current) {
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (renderCount === renderCountRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      }
    };

    renderChart();
  }, [id, cleanCode, isDark]);

  if (error) {
    return (
      <ErrorBox>
        <Text fontWeight="medium">Diagram Error</Text>
        <Box
          as="pre"
          mt="2"
          textStyle="xs"
          whiteSpace="pre-wrap"
          fontFamily="mono"
        >
          {error}
        </Box>
      </ErrorBox>
    );
  }

  if (!svg) {
    return (
      <Box
        p="4"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border.muted"
        bg="bg.muted"
        h="32"
        animation="pulse"
      />
    );
  }

  return <Box className={styles} dangerouslySetInnerHTML={{ __html: svg }} />;
}

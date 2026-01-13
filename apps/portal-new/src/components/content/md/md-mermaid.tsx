"use client";

import matter from "gray-matter";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { Box } from "styled-system/jsx";

import { ErrorBox } from "@/components/ui/error-box";
import { Expandable } from "@/components/ui/expandable";
import { Text } from "@/components/ui/text";

// TODO: Add dark theme support - detect color mode and re-render on theme change
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
});

type MdMermaidProps = {
  chart: string;
};

export function MdMermaid({ chart }: MdMermaidProps) {
  const { title } = matter(chart).data;
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    const renderChart = async () => {
      const currentRenderId = ++renderIdRef.current;

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (currentRenderId === renderIdRef.current) {
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (currentRenderId === renderIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <ErrorBox my="6">
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
        my="6"
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

  return (
    <Expandable variant="diagram" title={title}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </Expandable>
  );
}

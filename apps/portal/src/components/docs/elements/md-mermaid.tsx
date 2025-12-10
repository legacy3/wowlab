"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { MdImage } from "./md-image";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#3b82f6",
    primaryTextColor: "#fff",
    primaryBorderColor: "#1e40af",
    lineColor: "#64748b",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0f172a",
    mainBkg: "#1e293b",
    textColor: "#e2e8f0",
    nodeBorder: "#3b82f6",
  },
});

type MdMermaidProps = {
  chart: string;
};

export function MdMermaid({ chart }: MdMermaidProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        setSvg(svg);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to render diagram",
        );
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <p className="font-medium">Diagram Error</p>
        <pre className="mt-2 text-xs whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 p-4 rounded-lg border border-border/50 bg-muted/30 animate-pulse h-32" />
    );
  }

  return (
    <MdImage>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </MdImage>
  );
}

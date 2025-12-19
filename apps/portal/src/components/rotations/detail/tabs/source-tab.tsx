"use client";

import { memo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import type { Rotation } from "@/lib/supabase/types";

interface SourceTabProps {
  rotation: Rotation;
}

export const SourceTab = memo(function SourceTab({ rotation }: SourceTabProps) {
  const handleDownload = () => {
    const blob = new Blob([rotation.script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rotation.slug || rotation.name.toLowerCase().replace(/\s+/g, "-")}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lineCount = rotation.script.split("\n").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{lineCount} lines</span>
        <div className="flex items-center gap-1">
          <CopyButton value={rotation.script} label="Source" />
          <Button variant="ghost" size="icon-sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-[#0a0a0b] overflow-hidden">
        <pre className="p-4 text-sm font-mono overflow-x-auto">
          <code className="text-foreground/90">{rotation.script}</code>
        </pre>
      </div>
    </div>
  );
});

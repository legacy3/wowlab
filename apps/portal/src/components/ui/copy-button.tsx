"use client";

import { Check, Copy, Loader2, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  className?: string;
  value: string | (() => Promise<string>);
  label: string;
  title: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export function CopyButton({
  className,
  value,
  label,
  title,
  icon: Icon = Copy,
  disabled,
}: CopyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard(label);

  const handleCopy = async () => {
    if (typeof value === "string") {
      copyToClipboard(value);
    } else {
      setLoading(true);

      try {
        const resolved = await value();
        copyToClipboard(resolved);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button
      data-slot="copy-button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
      onClick={handleCopy}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : state.copied ? (
        <Check className="text-green-500 animate-in zoom-in-50 duration-200" />
      ) : (
        <Icon />
      )}
    </Button>
  );
}

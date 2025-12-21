"use client";

import { Link2 } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { createShortUrl } from "@/lib/short-url";

interface ShareButtonProps {
  className?: string;
  path: string;
}

export function ShareButton({ className, path }: ShareButtonProps) {
  return (
    <CopyButton
      className={className}
      value={() => createShortUrl(path)}
      label="short link"
      title="Copy short link"
      icon={Link2}
    />
  );
}

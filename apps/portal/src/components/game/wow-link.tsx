"use client";

import { ExternalLink, Loader2, AlertTriangle } from "lucide-react";

interface WowLinkProps {
  href: string;
  name: string | undefined;
  fallback: string;
  isLoading: boolean;
}

export function WowLink({ href, name, fallback, isLoading }: WowLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      {name ?? fallback}
      {isLoading && <Loader2 className="h-3 w-3 animate-spin opacity-50" />}
      {!isLoading && !name && <AlertTriangle className="h-3 w-3 opacity-50" />}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}

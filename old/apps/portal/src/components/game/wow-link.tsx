"use client";

import { ExternalLink, AlertTriangle } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

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
      {isLoading && <FlaskInlineLoader className="h-3 w-3 opacity-50" />}
      {!isLoading && !name && <AlertTriangle className="h-3 w-3 opacity-50" />}
      <ExternalLink className="h-3 w-3 opacity-50" />
    </a>
  );
}

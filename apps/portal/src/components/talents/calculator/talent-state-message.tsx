"use client";

import type { ReactNode } from "react";

export function TalentStateMessage({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[700px] w-full items-center justify-center text-center text-muted-foreground">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs">{description}</p> : null}
      </div>
    </div>
  );
}

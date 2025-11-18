"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Wrench, AlertTriangle } from "lucide-react";
import { changelogEntriesAtom } from "@/atoms/changelog";

const changeTypeConfig = {
  feature: {
    label: "New",
    variant: "default" as const,
    icon: Sparkles,
    color: "text-blue-500",
  },
  improvement: {
    label: "Improved",
    variant: "secondary" as const,
    icon: TrendingUp,
    color: "text-purple-500",
  },
  fix: {
    label: "Fixed",
    variant: "outline" as const,
    icon: Wrench,
    color: "text-green-500",
  },
  breaking: {
    label: "Breaking",
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-500",
  },
};

function ChangelogInner() {
  const [entries] = useAtom(changelogEntriesAtom);

  return (
    <div className="relative">
      <div className="space-y-8 relative">
        {entries.map((entry, entryIdx) => (
          <div key={entry.version} className="relative pl-12">
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-6 w-10 h-10 rounded-full flex items-center justify-center ring-8 ring-background ${
                entryIdx === 0 ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${entryIdx === 0 ? "bg-primary-foreground" : "bg-muted-foreground"}`}
              />
            </div>
            {/* Timeline connector */}
            {entryIdx !== entries.length - 1 && (
              <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-border -mb-8" />
            )}

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {entry.version}
                    </h2>
                    <time className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  {entryIdx === 0 && (
                    <Badge variant="default" className="ml-2">
                      Latest
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-6">
                  {entry.changes.map((change, idx) => {
                    const config = changeTypeConfig[change.type];
                    const Icon = config.icon;

                    return (
                      <li key={idx} className="flex gap-3">
                        <div
                          className={`flex-shrink-0 mt-0.5 ${config.color}`}
                          title={config.label}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <h3 className="font-semibold text-base">
                            {change.title}
                          </h3>
                          {change.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {change.description}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChangelogSkeleton() {
  return (
    <div className="relative">
      <div className="space-y-8 relative">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative pl-12">
            <div className="absolute left-0 top-6 w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-8 ring-background">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
            {i !== 3 && (
              <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-border -mb-8" />
            )}

            <Card>
              <CardHeader className="pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex gap-3">
                      <Skeleton className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Changelog() {
  return (
    <Suspense fallback={<ChangelogSkeleton />}>
      <ChangelogInner />
    </Suspense>
  );
}

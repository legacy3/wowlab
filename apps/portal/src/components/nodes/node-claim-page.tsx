"use client";

import { useState, Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NodeClaimForm } from "./node-claim-form";
import { NodeDownloadModal } from "./node-download-modal";

function NodeClaimPageInner() {
  const [token] = useQueryState("token", parseAsString);
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account/nodes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Nodes
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Claim Your Node</CardTitle>
          <CardDescription>
            Enter the 6-character code displayed by your node application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NodeClaimForm
            initialToken={token ?? undefined}
            onDownload={() => setDownloadOpen(true)}
          />
          <NodeDownloadModal
            open={downloadOpen}
            onOpenChange={setDownloadOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function NodeClaimPage() {
  return (
    <Suspense fallback={<NodeClaimSkeleton />}>
      <NodeClaimPageInner />
    </Suspense>
  );
}

export function NodeClaimSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-md">
        <Skeleton className="h-9 w-32" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="mx-auto h-12 w-72" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { redirect } from "next/navigation";
import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import type { UserIdentity } from "@/lib/supabase/types";
import { NodeClaimForm } from "./node-claim-form";
import { env } from "@/lib/env";
import { WindowsIcon, AppleIcon, LinuxIcon } from "@/lib/icons";

export function NodeClaimPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<UserIdentity>();

  if (authLoading || identityLoading) {
    return <NodeClaimSkeleton />;
  }

  if (!auth?.authenticated || !identity) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Back Navigation */}
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account/nodes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Nodes
          </Link>
        </Button>
      </div>

      {/* Claim Form Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Claim Your Node</CardTitle>
          <CardDescription>
            Enter the 6-character code displayed by your node application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NodeClaimForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Don&apos;t have the app?
              </span>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download WowLab Node</DialogTitle>
                <DialogDescription>
                  Choose your platform to download the node application
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  asChild
                >
                  <a
                    href={`${env.APP_URL}/go/node-windows`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WindowsIcon className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Windows</div>
                      <div className="text-xs text-muted-foreground">
                        x64 installer
                      </div>
                    </div>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  asChild
                >
                  <a
                    href={`${env.APP_URL}/go/node-macos`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AppleIcon className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">macOS</div>
                      <div className="text-xs text-muted-foreground">
                        Universal (Apple Silicon & Intel)
                      </div>
                    </div>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  asChild
                >
                  <a
                    href={`${env.APP_URL}/go/node-linux`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinuxIcon className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Linux</div>
                      <div className="text-xs text-muted-foreground">
                        x64 AppImage
                      </div>
                    </div>
                  </a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
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

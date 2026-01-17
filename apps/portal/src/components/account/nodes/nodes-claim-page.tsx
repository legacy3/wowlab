"use client";

import { useExtracted } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Box, Stack } from "styled-system/jsx";

import { Alert, Card, Skeleton, Text } from "@/components/ui";
import { routes } from "@/lib/routing";
import { useClaimNode, useUser } from "@/lib/state";

import { NodeClaimForm } from "./node-claim-form";
import { NodeDownloadDialog } from "./node-download-dialog";

export function ClaimPageSkeleton() {
  return (
    <Stack gap="6" maxW="md" mx="auto">
      <Stack gap="2" textAlign="center">
        <Skeleton h="4" w="64" mx="auto" />
      </Stack>
      <Card.Root>
        <Card.Body py="8">
          <Stack gap="6" alignItems="center">
            <Skeleton h="6" w="48" />
            <Skeleton h="4" w="64" />
            <Box display="flex" gap="2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} h="14" w="12" borderRadius="md" />
              ))}
            </Box>
            <Skeleton h="10" w="full" />
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}

export function NodesClaimPage() {
  const t = useExtracted();
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;

  const { claimNode, error, isClaiming, isVerifying, pendingNode, verifyCode } =
    useClaimNode();

  const [showDownload, setShowDownload] = useState(false);

  const handleVerify = async (code: string) => {
    try {
      const result = await verifyCode.mutateAsync(code);
      return {
        name: result.name,
        platform: result.platform,
        totalCores: result.total_cores,
        version: "latest",
      };
    } catch {
      return null;
    }
  };

  const handleClaim = async (data: {
    code: string;
    name: string;
    workers: number;
  }) => {
    if (!userId || !pendingNode) return;

    try {
      await claimNode.mutateAsync({
        maxParallel: data.workers,
        name: data.name,
        nodeId: pendingNode.id,
        userId,
      });
      router.push(routes.account.nodes.index.path);
    } catch {
      // Error is handled by the hook
    }
  };

  if (isUserLoading || !userId) {
    return <ClaimPageSkeleton />;
  }

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <Stack gap="6" maxW="md" mx="auto">
      <Stack gap="2" textAlign="center">
        <Text textStyle="sm" color="fg.muted">
          {t("Download and run the WoW Lab Node application on your computer")}
        </Text>
      </Stack>

      {errorMessage && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("Error")}</Alert.Title>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <NodeClaimForm
        onVerify={handleVerify}
        onClaim={handleClaim}
        onDownloadClick={() => setShowDownload(true)}
        isVerifying={isVerifying}
        isClaiming={isClaiming}
      />

      <NodeDownloadDialog open={showDownload} onOpenChange={setShowDownload} />
    </Stack>
  );
}

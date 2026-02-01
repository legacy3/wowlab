"use client";

import { useBoolean, useTimeout } from "ahooks";
import {
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  RefreshCwIcon,
  TerminalIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Box, Grid, HStack, Stack, styled } from "styled-system/jsx";

import {
  Badge,
  Button,
  Dialog,
  IconButton,
  SecretValue,
  Text,
  Tooltip,
} from "@/components/ui";
import { useDetectedPlatform } from "@/hooks/use-detected-platform";
import { AppleIcon, DockerIcon, LinuxIcon, WindowsIcon } from "@/lib/icons";
import { useClaimToken } from "@/lib/refine/services/claim-token";
import { href, routes } from "@/lib/routing";

import type { NodePlatform } from "./downloads";

import { DOCKER_URL, getNodeDownloadUrl, PLATFORM_INFO } from "./downloads";

const PLATFORM_ICONS: Record<NodePlatform, typeof AppleIcon> = {
  linux: LinuxIcon,
  "linux-arm": LinuxIcon,
  macos: AppleIcon,
  windows: WindowsIcon,
};

// TODO Get this from lib/env
const DOCKER_IMAGE = "ghcr.io/legacy3/wowlab-node";

const cardStyles = {
  borderRadius: "lg",
  borderWidth: "1px",
  p: "3",
} as const;

interface NodeSetupDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface PlatformCardProps {
  arch: string;
  id: NodePlatform;
  isDetected: boolean;
  name: string;
}

export function NodeSetupDialog({ onOpenChange, open }: NodeSetupDialogProps) {
  const content = useIntlayer("account").setupDialog;
  const detectedPlatform = useDetectedPlatform();
  const { isLoading, isRegenerating, regenerate, token } = useClaimToken();

  const [
    showRegenerateConfirm,
    {
      set: setShowRegenerateConfirm,
      setFalse: closeRegenerateConfirm,
      setTrue: openRegenerateConfirm,
    },
  ] = useBoolean(false);
  const [
    dockerCopied,
    { setFalse: clearDockerCopied, setTrue: setDockerCopied },
  ] = useBoolean(false);
  const [tokenRevealed, { set: setTokenRevealed, setFalse: hideToken }] =
    useBoolean(false);

  useTimeout(clearDockerCopied, dockerCopied ? 2000 : undefined);

  const handleRegenerate = async () => {
    await regenerate();
    hideToken();
    closeRegenerateConfirm();
  };

  const handleCopyDocker = async () => {
    if (!token) return;
    const cmd = `docker run -e WOWLAB_CLAIM_TOKEN=${token} ${DOCKER_IMAGE}`;
    await navigator.clipboard.writeText(cmd);
    setDockerCopied();
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w={{ base: "full", sm: "lg" }}>
            <Dialog.Header>
              <Dialog.Title>{content.title}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="5">
                <Stack gap="2">
                  <Text textStyle="sm" color="fg.muted" textAlign="center">
                    {content.claimTokenDescription}
                  </Text>
                  <HStack gap="2">
                    <SecretValue
                      value={
                        isLoading
                          ? "ct_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          : (token ?? "")
                      }
                      hiddenLength={35}
                      size="md"
                      variant="field"
                      revealed={tokenRevealed}
                      onRevealedChange={setTokenRevealed}
                      copyable
                    />
                    <Tooltip content={content.regenerateToken}>
                      <IconButton
                        size="sm"
                        variant="plain"
                        onClick={openRegenerateConfirm}
                        disabled={!token || isRegenerating}
                        loading={isRegenerating}
                      >
                        <RefreshCwIcon size={14} />
                      </IconButton>
                    </Tooltip>
                  </HStack>
                  <styled.a
                    href={href(routes.dev.docs.page, { slug: "nodes" })}
                    target="_blank"
                    textStyle="xs"
                    color="fg.muted"
                    textAlign="center"
                    _hover={{
                      color: "fg.default",
                      textDecoration: "underline",
                    }}
                  >
                    {content.readMore}
                  </styled.a>
                </Stack>

                <Stack gap="3">
                  <Text fontWeight="medium" textStyle="sm">
                    {content.downloadTitle}
                  </Text>
                  <Grid columns={{ base: 1, sm: 2 }} gap="3">
                    {PLATFORM_INFO.map(({ arch, id, name }) => (
                      <PlatformCard
                        key={id}
                        arch={arch}
                        id={id}
                        isDetected={id === detectedPlatform}
                        name={name}
                      />
                    ))}
                  </Grid>

                  <HStack
                    {...cardStyles}
                    gap="3"
                    borderColor="border.default"
                    justify="space-between"
                  >
                    <HStack gap="3">
                      <DockerIcon width={20} height={20} />
                      <Stack gap="0">
                        <Text fontWeight="medium" textStyle="sm">
                          Docker
                        </Text>
                        <Text textStyle="xs" color="fg.muted">
                          {content.multiArchContainer}
                        </Text>
                      </Stack>
                    </HStack>
                    <HStack gap="2">
                      <Tooltip
                        content={
                          dockerCopied ? content.copied : content.copyDocker
                        }
                      >
                        <IconButton
                          size="xs"
                          variant="outline"
                          onClick={handleCopyDocker}
                          disabled={!token}
                        >
                          {dockerCopied ? (
                            <CheckIcon size={12} />
                          ) : (
                            <ClipboardIcon size={12} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Button size="xs" variant="outline" asChild>
                        <styled.a
                          href={DOCKER_URL}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content.view}
                        </styled.a>
                      </Button>
                    </HStack>
                  </HStack>
                </Stack>
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root
        open={showRegenerateConfirm}
        onOpenChange={(e) => setShowRegenerateConfirm(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{content.regenerateConfirmTitle}</Dialog.Title>
              <Dialog.Description>
                {content.regenerateConfirmDescription}
              </Dialog.Description>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Text textStyle="sm">{content.regenerateWarning}</Text>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={closeRegenerateConfirm}>
                {content.cancel}
              </Button>
              <Button
                colorPalette="red"
                onClick={handleRegenerate}
                loading={isRegenerating}
              >
                {content.regenerate}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

function PlatformCard({ arch, id, isDetected, name }: PlatformCardProps) {
  const content = useIntlayer("account").setupDialog;
  const Icon = PLATFORM_ICONS[id];

  return (
    <Box
      {...cardStyles}
      position="relative"
      borderColor={isDetected ? "fg.default" : "border.default"}
    >
      {isDetected && (
        <Badge position="absolute" top="-2" left="3" size="sm" variant="solid">
          {content.detected}
        </Badge>
      )}
      <Stack gap="2" alignItems="center" textAlign="center">
        <Box color="fg.default">
          <Icon width={32} height={32} />
        </Box>
        <Stack gap="0">
          <Text fontWeight="semibold" textStyle="sm">
            {name}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {arch}
          </Text>
        </Stack>
        <HStack gap="2">
          <Button size="xs" asChild>
            <a href={getNodeDownloadUrl(id, "gui")}>
              <DownloadIcon size={12} />
              {content.desktop}
            </a>
          </Button>
          <Tooltip content={content.downloadCliHeadless}>
            <IconButton size="xs" variant="outline" asChild>
              <a href={getNodeDownloadUrl(id, "headless")}>
                <TerminalIcon size={12} />
              </a>
            </IconButton>
          </Tooltip>
        </HStack>
      </Stack>
    </Box>
  );
}

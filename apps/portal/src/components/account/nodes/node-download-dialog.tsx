"use client";

import { DownloadIcon, TerminalIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { Box, Grid, HStack, Stack, styled } from "styled-system/jsx";

import {
  Badge,
  Button,
  Dialog,
  IconButton,
  Text,
  Tooltip,
} from "@/components/ui";
import { useDetectedPlatform } from "@/hooks/use-detected-platform";
import { AppleIcon, DockerIcon, LinuxIcon, WindowsIcon } from "@/lib/icons";

import type { NodePlatform } from "./downloads";

import { DOCKER_URL, getNodeDownloadUrl, PLATFORM_INFO } from "./downloads";

const PLATFORM_ICONS: Record<NodePlatform, typeof AppleIcon> = {
  linux: LinuxIcon,
  "linux-arm": LinuxIcon,
  macos: AppleIcon,
  windows: WindowsIcon,
};

const cardStyles = {
  borderRadius: "lg",
  borderWidth: "1px",
  p: "4",
} as const;

interface NodeDownloadDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface PlatformCardProps {
  arch: string;
  id: NodePlatform;
  isDetected: boolean;
  name: string;
}

export function NodeDownloadDialog({
  onOpenChange,
  open,
}: NodeDownloadDialogProps) {
  const t = useExtracted();
  const detectedPlatform = useDetectedPlatform();

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Positioner>
        <Dialog.Content w="fit-content">
          <Dialog.Header>
            <Dialog.Title>{t("Get the Node")}</Dialog.Title>
            <Dialog.Description>
              {t("Run local simulations or share compute with others")}
            </Dialog.Description>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <Stack gap="4">
              <Grid columns={{ base: 1, sm: 2 }} gap="4">
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
                  <DockerIcon width={24} height={24} />
                  <Stack gap="0">
                    <Text fontWeight="medium">Docker</Text>
                    <Text textStyle="sm" color="fg.muted">
                      {t("Multi-arch container for servers")}
                    </Text>
                  </Stack>
                </HStack>
                <Button size="sm" variant="outline" asChild>
                  <styled.a href={DOCKER_URL} target="_blank" rel="noreferrer">
                    {t("View")}
                  </styled.a>
                </Button>
              </HStack>
            </Stack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function PlatformCard({ arch, id, isDetected, name }: PlatformCardProps) {
  const t = useExtracted();
  const Icon = PLATFORM_ICONS[id];

  return (
    <Box
      {...cardStyles}
      position="relative"
      borderColor={isDetected ? "fg.default" : "border.default"}
    >
      {isDetected && (
        <Badge position="absolute" top="-2" left="3" size="sm" variant="solid">
          {t("Detected")}
        </Badge>
      )}
      <Stack gap="3" alignItems="center" textAlign="center">
        <Box color="fg.default">
          <Icon width={40} height={40} />
        </Box>
        <Stack gap="0">
          <Text fontWeight="semibold">{name}</Text>
          <Text textStyle="sm" color="fg.muted">
            {arch}
          </Text>
        </Stack>
        <HStack gap="2">
          <Button size="sm" asChild>
            <a href={getNodeDownloadUrl(id, "gui")}>
              <DownloadIcon size={14} />
              {t("Desktop")}
            </a>
          </Button>
          <Tooltip content={t("Download CLI (headless)")}>
            <IconButton size="sm" variant="outline" asChild>
              <a href={getNodeDownloadUrl(id, "headless")}>
                <TerminalIcon size={14} />
              </a>
            </IconButton>
          </Tooltip>
        </HStack>
      </Stack>
    </Box>
  );
}

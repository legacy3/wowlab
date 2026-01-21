"use client";

import type { ReactNode } from "react";

import { GlobeIcon, LockIcon, PencilIcon, XIcon } from "lucide-react";
import { HStack, VStack } from "styled-system/jsx";

import type { RotationsRow } from "@/lib/engine";

import { href, routes, useLocalizedRouter } from "@/lib/routing";

import { Badge, Button, Drawer, IconButton, Link, Text } from "../ui";

interface RotationPreviewDrawerProps {
  children?: ReactNode;
  getClassColor: (specId: number) => string | null;
  getSpecLabel: (specId: number) => string | null;
  rotation: RotationsRow;
}

export function RotationPreviewDrawer({
  children,
  getClassColor,
  getSpecLabel,
  rotation,
}: RotationPreviewDrawerProps) {
  const router = useLocalizedRouter();
  const specLabel = getSpecLabel(rotation.spec_id);
  const classColor = getClassColor(rotation.spec_id);

  const handleClose = () => {
    router.back();
  };

  return (
    <Drawer.Root open onOpenChange={(e) => !e.open && handleClose()}>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <VStack alignItems="start" gap="1" flex="1">
              <Drawer.Title>{rotation.name}</Drawer.Title>
              {specLabel && (
                <HStack gap="2">
                  <span
                    style={{
                      backgroundColor: classColor ?? undefined,
                      borderRadius: "50%",
                      display: "inline-block",
                      height: 8,
                      width: 8,
                    }}
                  />
                  <Text textStyle="sm" color="fg.muted">
                    {specLabel}
                  </Text>
                </HStack>
              )}
            </VStack>
            <Drawer.CloseTrigger asChild>
              <IconButton variant="plain" size="sm">
                <XIcon />
              </IconButton>
            </Drawer.CloseTrigger>
          </Drawer.Header>

          <Drawer.Body>
            <VStack alignItems="stretch" gap="4">
              <HStack gap="2">
                {rotation.is_public ? (
                  <Badge size="sm" variant="subtle" colorPalette="green">
                    <GlobeIcon size={12} />
                    Public
                  </Badge>
                ) : (
                  <Badge size="sm" variant="subtle">
                    <LockIcon size={12} />
                    Private
                  </Badge>
                )}
              </HStack>

              {rotation.description && (
                <VStack alignItems="start" gap="1">
                  <Text textStyle="sm" fontWeight="medium">
                    Description
                  </Text>
                  <Text textStyle="sm" color="fg.muted">
                    {rotation.description}
                  </Text>
                </VStack>
              )}

              {children}
            </VStack>
          </Drawer.Body>

          <Drawer.Footer gap="3">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button asChild>
              <Link
                href={href(routes.rotations.editor.edit, { id: rotation.id })}
              >
                <PencilIcon size={16} />
                Open in Editor
              </Link>
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

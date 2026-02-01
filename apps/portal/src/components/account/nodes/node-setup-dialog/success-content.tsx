"use client";

import { useIntlayer } from "next-intlayer";
import { Stack, styled } from "styled-system/jsx";

import { Button, Loader, Text } from "@/components/ui";

interface SuccessContentProps {
  onClose: () => void;
}

export function SuccessContent({ onClose }: SuccessContentProps) {
  const content = useIntlayer("account").setupDialog;

  return (
    <styled.div
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      py="8"
      gap="6"
      colorPalette="grass"
    >
      <styled.div color="colorPalette.solid.bg">
        <Loader size="lg" />
      </styled.div>
      <Stack gap="2" alignItems="center" textAlign="center">
        <Text fontWeight="semibold" textStyle="lg">
          {content.nodeConnected}
        </Text>
        <Text textStyle="sm" color="fg.muted">
          {content.nodeConnectedDescription}
        </Text>
      </Stack>
      <Button onClick={onClose} size="lg">
        {content.closeAndViewNodes}
      </Button>
    </styled.div>
  );
}

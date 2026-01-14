"use client";

import { CheckCircle, CircleAlert } from "lucide-react";
import { useExtracted } from "next-intl";
import { HStack } from "styled-system/jsx";

import { Alert, ErrorBox, Icon, InlineLoader, Text } from "@/components/ui";

export interface ParseErrorProps {
  error: string;
  title?: string;
}

export interface ParseLoadingProps {
  message?: string;
}

export interface ParseSuccessProps {
  message?: string;
}

export function ParseError({ error, title }: ParseErrorProps) {
  const t = useExtracted();

  return (
    <Alert.Root status="error" variant="surface">
      <Alert.Indicator>
        <Icon size="sm">
          <CircleAlert />
        </Icon>
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title ?? t("Failed to parse")}</Alert.Title>
        <Alert.Description>
          <ErrorBox>{error}</ErrorBox>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export function ParseLoading({ message }: ParseLoadingProps) {
  const t = useExtracted();

  return (
    <HStack gap="2" justify="center" color="fg.muted" py="2">
      <InlineLoader />
      <Text textStyle="sm">{message ?? t("Parsing...")}</Text>
    </HStack>
  );
}

export function ParseSuccess({ message }: ParseSuccessProps) {
  const t = useExtracted();

  return (
    <Alert.Root status="success" variant="surface">
      <Alert.Indicator>
        <Icon size="sm">
          <CheckCircle />
        </Icon>
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Description>
          {message ?? t("Parsed successfully")}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

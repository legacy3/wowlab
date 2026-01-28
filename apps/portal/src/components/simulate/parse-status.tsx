"use client";

import { CheckCircle, CircleAlert } from "lucide-react";
import { useIntlayer } from "next-intlayer";
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
  const { parseStatus: content } = useIntlayer("simulate");

  return (
    <Alert.Root status="error" variant="surface">
      <Alert.Indicator>
        <Icon size="sm">
          <CircleAlert />
        </Icon>
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title ?? content.failedToParse}</Alert.Title>
        <Alert.Description>
          <ErrorBox>{error}</ErrorBox>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export function ParseLoading({ message }: ParseLoadingProps) {
  const { parseStatus: content } = useIntlayer("simulate");

  return (
    <HStack gap="2" justify="center" color="fg.muted" py="2">
      <InlineLoader />
      <Text textStyle="sm">{message ?? content.parsing}</Text>
    </HStack>
  );
}

export function ParseSuccess({ message }: ParseSuccessProps) {
  const { parseStatus: content } = useIntlayer("simulate");

  return (
    <Alert.Root status="success" variant="surface">
      <Alert.Indicator>
        <Icon size="sm">
          <CheckCircle />
        </Icon>
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Description>
          {message ?? content.parsedSuccessfully}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

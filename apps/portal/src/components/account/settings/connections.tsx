"use client";

import { LinkIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Box, HStack, Stack } from "styled-system/jsx";

import { Alert, Button, Switch, Text } from "@/components/ui";
import { OAUTH_PROVIDERS, type ProviderMeta } from "@/lib/providers";
import { useUser } from "@/lib/state";

export function ConnectionsList() {
  return (
    <Stack gap="0">
      {OAUTH_PROVIDERS.map((meta, i) => (
        <ProviderRow
          key={meta.provider}
          meta={meta}
          isLast={i === OAUTH_PROVIDERS.length - 1}
        />
      ))}
    </Stack>
  );
}

export function DiscordLinkBanner() {
  const content = useIntlayer("account").discordLink;
  const { data: user, isLoading, linkIdentity } = useUser();
  const [linking, setLinking] = useState(false);

  const isLinked = user?.identities.includes("discord") ?? false;

  if (isLinked) {
    return null;
  }

  const handleLink = async () => {
    setLinking(true);
    try {
      await linkIdentity("discord");
    } catch {
      setLinking(false);
    }
  };

  return (
    <Alert.Root status="warning">
      <Alert.Content>
        <Alert.Description>
          <HStack gap="2" justify="space-between">
            <Text textStyle="sm">{content.bannerText}</Text>
            <Button
              size="xs"
              variant="outline"
              onClick={handleLink}
              loading={linking}
              disabled={isLoading}
            >
              <LinkIcon size={12} />
              {content.linkButton}
            </Button>
          </HStack>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

function ProviderRow({
  isLast,
  meta,
}: {
  meta: ProviderMeta;
  isLast: boolean;
}) {
  const { data: user, isLoading, linkIdentity } = useUser();
  const [linking, setLinking] = useState(false);

  const isLinked = user?.identities.includes(meta.provider) ?? false;
  const Icon = meta.icon;

  const handleLink = async () => {
    if (isLinked || !meta.enabled) {
      return;
    }

    setLinking(true);

    try {
      await linkIdentity(meta.provider);
    } catch {
      setLinking(false);
    }
  };

  return (
    <Box
      py="3"
      borderBottomWidth={isLast ? "0" : "1px"}
      borderColor="border.subtle"
    >
      <Switch.Root
        checked={isLinked}
        onCheckedChange={() => handleLink()}
        disabled={!meta.enabled || isLinked || isLoading || linking}
      >
        <Switch.Control />
        <Switch.Label>
          <HStack gap="2.5">
            <Box color="fg.muted">
              <Icon width={16} height={16} />
            </Box>
            <Text textStyle="sm" fontWeight="medium">
              {meta.label}
            </Text>
          </HStack>
        </Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>
    </Box>
  );
}

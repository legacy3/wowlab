"use client";

import { useBoolean } from "ahooks";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Box, Flex, Grid, Stack, styled } from "styled-system/jsx";

import type { OAuthProvider } from "@/lib/state";

import {
  Button,
  Card,
  CardLoader,
  ErrorBox,
  Link,
  Text,
} from "@/components/ui";
import { OAUTH_PROVIDERS } from "@/lib/providers";
import { href, routes } from "@/lib/routing";
import { useUser } from "@/lib/state";

interface SignInFormProps {
  redirectTo?: string;
}

const IconButton = styled(Button, {
  base: {
    gap: "2",
    h: "11",
  },
});

export function SignInForm({ redirectTo }: SignInFormProps) {
  const { signInForm: content } = useIntlayer("auth");
  const [error, setError] = useState<string | null>(null);
  const [loading, { setFalse: stopLoading, setTrue: startLoading }] =
    useBoolean(false);
  const { login } = useUser();

  const handleOAuthSignIn = (provider: OAuthProvider) => {
    setError(null);
    startLoading();
    login(provider, redirectTo);
  };

  if (loading) {
    return (
      <Card.Root w="full" maxW="md">
        <Card.Body>
          <CardLoader message={content.signingYouIn} />
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Stack gap="6" w="full" maxW="md">
      <Card.Root>
        <Card.Header textAlign="center">
          <Card.Title fontSize="2xl">{content.signInToContinue}</Card.Title>
          <Card.Description>{content.chooseMethod}</Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            {error && <ErrorBox>{error}</ErrorBox>}

            <Grid columns={2} gap="2">
              {OAUTH_PROVIDERS.map(
                ({ enabled, icon: Icon, label, provider }) => (
                  <IconButton
                    key={provider}
                    variant="outline"
                    onClick={() => handleOAuthSignIn(provider)}
                    disabled={!enabled}
                  >
                    <Icon width={16} height={16} />
                    {label}
                  </IconButton>
                ),
              )}
            </Grid>

            <Flex align="center" gap="3">
              <Box flex="1" h="1px" bg="border" />
              <Text fontSize="xs" color="fg.subtle" textTransform="uppercase">
                {content.secureAuth}
              </Text>
              <Box flex="1" h="1px" bg="border" />
            </Flex>

            <Text textAlign="center" fontSize="xs" color="fg.muted">
              {content.termsPrefix}
              <Link href={href(routes.about.terms)}>
                {content.termsOfService}
              </Link>
              {content.and}
              <Link href={href(routes.about.privacy)}>
                {content.privacyPolicy}
              </Link>
              {content.termsSuffix}
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Text textAlign="center" fontSize="xs" color="fg.subtle">
        {content.newHere}
      </Text>
    </Stack>
  );
}

"use client";

import { useBoolean } from "ahooks";
import { useState } from "react";
import { Box, Flex, Grid, Stack, styled } from "styled-system/jsx";

import type { OAuthProvider } from "@/lib/refine";

import { Button, Card, CardLoader, Link, Text } from "@/components/ui";
import { DiscordIcon, GitHubIcon, GoogleIcon, TwitchIcon } from "@/lib/icons";
import { routes } from "@/lib/routes";
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
          <CardLoader message="Signing you in..." />
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Stack gap="6" w="full" maxW="md">
      <Card.Root>
        <Card.Header textAlign="center">
          <Card.Title fontSize="2xl">Sign in to continue</Card.Title>
          <Card.Description>
            Choose your preferred authentication method
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            {error && (
              <Box bg="red.3" color="red.11" p="3" rounded="l2" fontSize="sm">
                {error}
              </Box>
            )}

            <Grid columns={2} gap="2">
              <IconButton
                variant="outline"
                onClick={() => handleOAuthSignIn("discord")}
              >
                <DiscordIcon width={16} height={16} />
                Discord
              </IconButton>
              <IconButton
                variant="outline"
                onClick={() => handleOAuthSignIn("github")}
              >
                <GitHubIcon width={16} height={16} />
                GitHub
              </IconButton>
              <IconButton
                variant="outline"
                onClick={() => handleOAuthSignIn("google")}
                disabled
              >
                <GoogleIcon width={16} height={16} />
                Google
              </IconButton>
              <IconButton
                variant="outline"
                onClick={() => handleOAuthSignIn("twitch")}
                disabled
              >
                <TwitchIcon width={16} height={16} />
                Twitch
              </IconButton>
            </Grid>

            <Flex align="center" gap="3">
              <Box flex="1" h="1px" bg="border" />
              <Text fontSize="xs" color="fg.subtle" textTransform="uppercase">
                Secure authentication
              </Text>
              <Box flex="1" h="1px" bg="border" />
            </Flex>

            <Text textAlign="center" fontSize="xs" color="fg.muted">
              By continuing, you agree to our{" "}
              <Link href={routes.about.terms}>Terms of Service</Link> and{" "}
              <Link href={routes.about.privacy}>Privacy Policy</Link>
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Text textAlign="center" fontSize="xs" color="fg.subtle">
        New here? Signing in creates an account automatically.
      </Text>
    </Stack>
  );
}

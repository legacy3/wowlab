"use client";

import { useIntlayer } from "next-intlayer";
import { Grid, Stack } from "styled-system/jsx";

import { Card, Field, Input, SecretValue } from "@/components/ui";
import { useUser } from "@/lib/state";

import { ConnectionsList, DiscordLinkBanner } from "./connections";

export function SettingsPage() {
  const content = useIntlayer("account").settingsPage;
  const { data: user } = useUser();

  return (
    <Stack gap="5">
      <DiscordLinkBanner />

      <Card.Root>
        <Card.Header pb="0">
          <Card.Title>{content.profileTitle}</Card.Title>
          <Card.Description>{content.profileDescription}</Card.Description>
        </Card.Header>
        <Card.Body>
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <Field.Root>
              <Field.Label>{content.email}</Field.Label>
              <SecretValue
                value={user?.email ?? ""}
                hiddenLength={16}
                variant="field"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{content.handle}</Field.Label>
              <Input value={user?.handle ?? ""} disabled readOnly />
            </Field.Root>
          </Grid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header pb="0">
          <Card.Title>{content.connectionsTitle}</Card.Title>
          <Card.Description>{content.connectionsDescription}</Card.Description>
        </Card.Header>
        <Card.Body>
          <ConnectionsList />
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}

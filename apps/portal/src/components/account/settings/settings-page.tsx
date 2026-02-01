"use client";

import { useBoolean } from "ahooks";
import { Trash2Icon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useState } from "react";
import { Grid, Stack, styled } from "styled-system/jsx";

import {
  Alert,
  Button,
  Card,
  Code,
  Dialog,
  Field,
  Input,
  SecretValue,
  Text,
} from "@/components/ui";
import { useUser } from "@/lib/state";

import { ConnectionsList, DiscordLinkBanner } from "./connections";

export function SettingsPage() {
  const content = useIntlayer("account").settingsPage;
  const { data: user, deleteAccount } = useUser();

  const [
    showDeleteConfirm,
    { setFalse: closeDeleteConfirm, setTrue: openDeleteConfirm },
  ] = useBoolean(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      window.location.href = "/";
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            <Card.Description>
              {content.connectionsDescription}
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <ConnectionsList />
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header pb="0">
            <Card.Title>{content.actionsTitle}</Card.Title>
            <Card.Description>{content.actionsDescription}</Card.Description>
          </Card.Header>
          <Card.Body>
            <Stack gap="3">
              <Button variant="outline" disabled>
                {content.resetPreferences}
              </Button>
              <Button
                variant="outline"
                colorPalette="red"
                onClick={openDeleteConfirm}
              >
                <Trash2Icon size={14} />
                {content.deleteAccount}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>

      <Dialog.Root
        open={showDeleteConfirm}
        onOpenChange={(e) => {
          if (e.open) {
            openDeleteConfirm();
          } else {
            closeDeleteConfirm();
            setDeleteConfirmText("");
          }
        }}
      >
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{content.deleteAccount}</Dialog.Title>
              <Dialog.Description>
                {content.deleteDialogDescription}
              </Dialog.Description>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="5">
                <Alert.Root status="error">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{content.deleteWarningTitle}</Alert.Title>
                    <Alert.Description>
                      {content.deleteWarningDescription}
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <Stack gap="2">
                  <Text textStyle="sm" fontWeight="medium">
                    {content.whatGetsDeleted}
                  </Text>
                  <styled.ul
                    listStyleType="disc"
                    pl="5"
                    display="flex"
                    flexDirection="column"
                    gap="1"
                  >
                    <styled.li textStyle="sm" color="fg.muted">
                      {content.deletedRotations}
                    </styled.li>
                    <styled.li textStyle="sm" color="fg.muted">
                      {content.deletedNodes}
                    </styled.li>
                    <styled.li textStyle="sm" color="fg.muted">
                      {content.deletedJobs}
                    </styled.li>
                    <styled.li textStyle="sm" color="fg.muted">
                      {content.deletedHandle}
                    </styled.li>
                  </styled.ul>
                </Stack>

                <Stack gap="2">
                  <Text textStyle="sm">{content.typeHandleToConfirm}</Text>
                  <Code>{user?.handle}</Code>
                  <Input
                    placeholder={user?.handle ?? ""}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </Stack>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={closeDeleteConfirm}>
                {content.cancel}
              </Button>
              <Button
                colorPalette="red"
                disabled={deleteConfirmText !== user?.handle}
                onClick={handleDelete}
                loading={isDeleting}
              >
                {content.deleteAccount}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { useExtracted } from "next-intl";
import { HStack } from "styled-system/jsx";

import { Card, Text } from "@/components/ui";
import { useJobs } from "@/lib/state";

export function StatusCard() {
  const t = useExtracted();
  const lastError = useJobs(
    (s) => s.jobs.find((j) => j.status === "failed")?.error,
  );

  return (
    <Card.Root h="full">
      <Card.Body
        p="4"
        display="flex"
        flexDir="column"
        alignItems="center"
        textAlign="center"
      >
        <HStack gap="2" color="fg.muted">
          {lastError && (
            <AlertTriangle
              style={{ color: "var(--colors-red-10)", height: 14, width: 14 }}
            />
          )}
          <Text textStyle="xs">{t("Status")}</Text>
        </HStack>
        <Text
          textStyle="2xl"
          fontWeight="bold"
          mt="1"
          color={lastError ? "red.10" : "green.10"}
        >
          {lastError ? t("Error") : t("OK")}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}

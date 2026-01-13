"use client";

import { Cpu } from "lucide-react";
import { useExtracted } from "next-intl";
import { HStack } from "styled-system/jsx";

import { Card, HelpText, Text } from "@/components/ui";
import { useClientHardware } from "@/hooks/use-client-hardware";
import { href, routes } from "@/lib/routing";

export function CpuCoresCard() {
  const t = useExtracted();
  const { cores } = useClientHardware();

  return (
    <Card.Root h="full">
      <Card.Body
        p="4"
        display="flex"
        flexDir="column"
        alignItems="center"
        textAlign="center"
      >
        <HStack gap="1.5" color="fg.muted" textStyle="xs">
          <Cpu style={{ height: 14, width: 14 }} />
          <HelpText
            content={t("Browsers may limit reported cores")}
            href={href(routes.dev.docs.page, {
              slug: "reference/03-browser-cpu-limits",
            })}
          >
            {t("CPU Cores")}
          </HelpText>
        </HStack>
        <Text
          textStyle="2xl"
          fontWeight="bold"
          mt="1"
          fontVariantNumeric="tabular-nums"
        >
          {cores ?? "\u2014"}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}

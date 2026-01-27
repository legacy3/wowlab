"use client";

import { useLocale } from "next-intlayer";
import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import { Badge, Code, Text } from "@/components/ui";

import { DemoBox, DemoLabel, Section, Subsection } from "../../shared";

// TODO All of these formatters have to come from intlayer
export function I18nSection() {
  const { locale } = useLocale();
  const localeStr = String(locale);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(localeStr, options).format(value);

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(localeStr, options).format(date);

  const formatRelativeTime = (date: Date, now: Date) => {
    const diff = date.getTime() - now.getTime();
    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(localeStr, { numeric: "auto" });

    if (Math.abs(days) >= 1) {
      return rtf.format(days, "day");
    }

    if (Math.abs(hours) >= 1) {
      return rtf.format(hours, "hour");
    }

    if (Math.abs(minutes) >= 1) {
      return rtf.format(minutes, "minute");
    }

    return rtf.format(seconds, "second");
  };

  const now = new Date();

  const formatPlural = (count: number) => {
    if (count === 0) {
      return "No items";
    }

    if (count === 1) {
      return "One item";
    }

    return `${count} items`;
  };

  const formatSelect = (status: string) => {
    switch (status) {
      case "offline":
        return "Offline";

      case "online":
        return "Online";
        
      default:
        return "Unknown";
    }
  };

  return (
    <Section id="i18n" title="i18n Formatting" lazy minHeight={1623}>
      <Stack gap="8">
        <HStack gap="2">
          <Text color="fg.muted">Locale:</Text>
          <Badge variant="outline">{locale}</Badge>
        </HStack>

        <Subsection title="Numbers">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <DemoBox>
              <DemoLabel>integer</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row label="1234" value={formatNumber(1234)} />
                <Row label="1234567" value={formatNumber(1234567)} />
                <Row label="9876543210" value={formatNumber(9876543210)} />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>compact</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="1234"
                  value={formatNumber(1234, { notation: "compact" })}
                />
                <Row
                  label="1234567"
                  value={formatNumber(1234567, { notation: "compact" })}
                />
                <Row
                  label="9876543210"
                  value={formatNumber(9876543210, { notation: "compact" })}
                />
              </Stack>
            </DemoBox>
          </Grid>
        </Subsection>

        <Subsection title="Dates">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <DemoBox>
              <DemoLabel>dateTime</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="short"
                  value={formatDate(new Date(), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <Row
                  label="medium"
                  value={formatDate(new Date(), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
                <Row
                  label="full"
                  value={formatDate(new Date(), { dateStyle: "full" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>relativeTime</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="5 min ago"
                  value={formatRelativeTime(
                    new Date(now.getTime() - 5 * 60 * 1000),
                    now,
                  )}
                />
                <Row
                  label="2 hours ago"
                  value={formatRelativeTime(
                    new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    now,
                  )}
                />
                <Row
                  label="3 days ago"
                  value={formatRelativeTime(
                    new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                    now,
                  )}
                />
              </Stack>
            </DemoBox>
          </Grid>
        </Subsection>

        <Subsection title="Units">
          <Grid columns={{ base: 1, md: 3 }} gap="4">
            <DemoBox>
              <DemoLabel>seconds</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="1"
                  value={formatNumber(1, { style: "unit", unit: "second" })}
                />
                <Row
                  label="30"
                  value={formatNumber(30, { style: "unit", unit: "second" })}
                />
                <Row
                  label="90.5"
                  value={formatNumber(90.5, { style: "unit", unit: "second" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>percent</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="0.1"
                  value={formatNumber(0.1, { style: "percent" })}
                />
                <Row
                  label="0.5"
                  value={formatNumber(0.5, { style: "percent" })}
                />
                <Row
                  label="0.995"
                  value={formatNumber(0.995, { style: "percent" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>currency</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="9.99"
                  value={formatNumber(9.99, {
                    currency: "USD",
                    style: "currency",
                  })}
                />
                <Row
                  label="99"
                  value={formatNumber(99, {
                    currency: "USD",
                    style: "currency",
                  })}
                />
                <Row
                  label="1234.56"
                  value={formatNumber(1234.56, {
                    currency: "USD",
                    style: "currency",
                  })}
                />
              </Stack>
            </DemoBox>
          </Grid>
        </Subsection>

        <Subsection title="ICU Messages">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <DemoBox>
              <DemoLabel>plurals</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between">
                  <Code>count: 0</Code>
                  <Text>{formatPlural(0)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>count: 1</Code>
                  <Text>{formatPlural(1)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>count: 42</Code>
                  <Text>{formatPlural(42)}</Text>
                </HStack>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>select</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between">
                  <Code>status: online</Code>
                  <Text>{formatSelect("online")}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>status: offline</Code>
                  <Text>{formatSelect("offline")}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>status: away</Code>
                  <Text>{formatSelect("away")}</Text>
                </HStack>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>interpolation</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <Text>Hello, World!</Text>
                <Text>You have 5 new messages</Text>
                <Text>Price: $9.99</Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>number in message</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between">
                  <Code>1234567</Code>
                  <Text>{formatNumber(1234567)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>0.75 (percent)</Code>
                  <Text>{formatNumber(0.75, { style: "percent" })}</Text>
                </HStack>
              </VStack>
            </DemoBox>
          </Grid>
        </Subsection>

        <Subsection title="Rich Text">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <DemoBox>
              <DemoLabel>basic tags</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text>
                  This is <strong>bold</strong> text
                </Text>
                <Text>
                  This is <em>italic</em> text
                </Text>
                <Text>
                  This has <Code>inline code</Code>
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>nested tags</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text>
                  Click <strong>here</strong> to <em>continue</em>
                </Text>
                <Text>
                  Status:{" "}
                  <Badge variant="outline" size="sm">
                    Active
                  </Badge>
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>with variables</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text>
                  Welcome back, <strong>User</strong>!
                </Text>
                <Text>
                  You have{" "}
                  <Text as="span" color="accent.11" fontWeight="bold">
                    3
                  </Text>{" "}
                  notifications
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>complex</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text textStyle="sm">
                  Read our{" "}
                  <Text as="span" color="accent.11" textDecoration="underline">
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text as="span" color="accent.11" textDecoration="underline">
                    Privacy Policy
                  </Text>
                </Text>
              </VStack>
            </DemoBox>
          </Grid>
        </Subsection>
      </Stack>
    </Section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" py="1">
      <Text color="fg.muted" textStyle="sm">
        {label}
      </Text>
      <Text fontVariantNumeric="tabular-nums">{value}</Text>
    </HStack>
  );
}

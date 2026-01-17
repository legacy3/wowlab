"use client";

import { useExtracted, useFormatter, useLocale, useNow } from "next-intl";
import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import { Badge, Code, Text } from "@/components/ui";

import { DemoBox, DemoLabel, Section, Subsection } from "../../shared";

export function I18nSection() {
  const locale = useLocale();
  const t = useExtracted();
  const format = useFormatter();
  const now = useNow();

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
                <Row label="1234" value={format.number(1234)} />
                <Row label="1234567" value={format.number(1234567)} />
                <Row label="9876543210" value={format.number(9876543210)} />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>compact</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="1234"
                  value={format.number(1234, { notation: "compact" })}
                />
                <Row
                  label="1234567"
                  value={format.number(1234567, { notation: "compact" })}
                />
                <Row
                  label="9876543210"
                  value={format.number(9876543210, { notation: "compact" })}
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
                  value={format.dateTime(new Date(), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <Row
                  label="medium"
                  value={format.dateTime(new Date(), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
                <Row
                  label="full"
                  value={format.dateTime(new Date(), { dateStyle: "full" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>relativeTime</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="5 min ago"
                  value={format.relativeTime(
                    new Date(now.getTime() - 5 * 60 * 1000),
                    now,
                  )}
                />
                <Row
                  label="2 hours ago"
                  value={format.relativeTime(
                    new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    now,
                  )}
                />
                <Row
                  label="3 days ago"
                  value={format.relativeTime(
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
                  value={format.number(1, { style: "unit", unit: "second" })}
                />
                <Row
                  label="30"
                  value={format.number(30, { style: "unit", unit: "second" })}
                />
                <Row
                  label="90.5"
                  value={format.number(90.5, { style: "unit", unit: "second" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>percent</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="0.1"
                  value={format.number(0.1, { style: "percent" })}
                />
                <Row
                  label="0.5"
                  value={format.number(0.5, { style: "percent" })}
                />
                <Row
                  label="0.995"
                  value={format.number(0.995, { style: "percent" })}
                />
              </Stack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>currency</DemoLabel>
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="9.99"
                  value={format.number(9.99, {
                    currency: "USD",
                    style: "currency",
                  })}
                />
                <Row
                  label="99"
                  value={format.number(99, {
                    currency: "USD",
                    style: "currency",
                  })}
                />
                <Row
                  label="1234.56"
                  value={format.number(1234.56, {
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
                  <Text>
                    {t(
                      "{count, plural, =0 {No items} =1 {One item} other {# items}}",
                      { count: 0 },
                    )}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>count: 1</Code>
                  <Text>
                    {t(
                      "{count, plural, =0 {No items} =1 {One item} other {# items}}",
                      { count: 1 },
                    )}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>count: 42</Code>
                  <Text>
                    {t(
                      "{count, plural, =0 {No items} =1 {One item} other {# items}}",
                      { count: 42 },
                    )}
                  </Text>
                </HStack>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>select</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between">
                  <Code>status: online</Code>
                  <Text>
                    {t(
                      "{status, select, online {Online} offline {Offline} other {Unknown}}",
                      { status: "online" },
                    )}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>status: offline</Code>
                  <Text>
                    {t(
                      "{status, select, online {Online} offline {Offline} other {Unknown}}",
                      { status: "offline" },
                    )}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>status: away</Code>
                  <Text>
                    {t(
                      "{status, select, online {Online} offline {Offline} other {Unknown}}",
                      { status: "away" },
                    )}
                  </Text>
                </HStack>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>interpolation</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <Text>{t("Hello, {name}!", { name: "World" })}</Text>
                <Text>
                  {t("You have {count} new messages", { count: "5" })}
                </Text>
                <Text>{t("Price: {price}", { price: "$9.99" })}</Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>number in message</DemoLabel>
              <VStack gap="2" alignItems="stretch">
                <HStack justify="space-between">
                  <Code>1234567</Code>
                  <Text>{t("{value, number}", { value: 1234567 })}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Code>0.75 (percent)</Code>
                  <Text>{t("{value, number, percent}", { value: 0.75 })}</Text>
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
                  {t.rich("This is <b>bold</b> text", {
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </Text>
                <Text>
                  {t.rich("This is <i>italic</i> text", {
                    i: (chunks) => <em>{chunks}</em>,
                  })}
                </Text>
                <Text>
                  {t.rich("This has <code>inline code</code>", {
                    code: (chunks) => <Code>{chunks}</Code>,
                  })}
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>nested tags</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text>
                  {t.rich("Click <b>here</b> to <i>continue</i>", {
                    b: (chunks) => <strong>{chunks}</strong>,
                    i: (chunks) => <em>{chunks}</em>,
                  })}
                </Text>
                <Text>
                  {t.rich("Status: <badge>{status}</badge>", {
                    badge: (chunks) => (
                      <Badge variant="outline" size="sm">
                        {chunks}
                      </Badge>
                    ),
                    status: "Active",
                  })}
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>with variables</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text>
                  {t.rich("Welcome back, <b>{name}</b>!", {
                    b: (chunks) => <strong>{chunks}</strong>,
                    name: "User",
                  })}
                </Text>
                <Text>
                  {t.rich("You have <b>{count}</b> notifications", {
                    b: (chunks) => (
                      <Text as="span" color="accent.11" fontWeight="bold">
                        {chunks}
                      </Text>
                    ),
                    count: "3",
                  })}
                </Text>
              </VStack>
            </DemoBox>
            <DemoBox>
              <DemoLabel>complex</DemoLabel>
              <VStack gap="3" alignItems="stretch">
                <Text textStyle="sm">
                  {t.rich(
                    "Read our <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>",
                    {
                      privacy: (chunks) => (
                        <Text
                          as="span"
                          color="accent.11"
                          textDecoration="underline"
                        >
                          {chunks}
                        </Text>
                      ),
                      terms: (chunks) => (
                        <Text
                          as="span"
                          color="accent.11"
                          textDecoration="underline"
                        >
                          {chunks}
                        </Text>
                      ),
                    },
                  )}
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

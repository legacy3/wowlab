"use client";

import { useExtracted, useFormatter, useLocale } from "next-intl";
import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import { Badge, Code, Text } from "@/components/ui";

import { ComponentCard, Section, Subsection } from "../../shared";

export function I18nSection() {
  const locale = useLocale();
  const t = useExtracted();
  const format = useFormatter();

  return (
    <Section id="i18n" title="i18n Formatting">
      <Stack gap="8">
        <HStack gap="2">
          <Text color="fg.muted">Locale:</Text>
          <Badge variant="outline">{locale}</Badge>
        </HStack>

        <Subsection title="Numbers">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="integer">
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row label="1234" value={format.number(1234)} />
                <Row label="1234567" value={format.number(1234567)} />
                <Row label="9876543210" value={format.number(9876543210)} />
              </Stack>
            </ComponentCard>
            <ComponentCard title="compact">
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
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Dates">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="dateTime">
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
            </ComponentCard>
            <ComponentCard title="relativeTime">
              <Stack gap="0" divideY="1px" divideColor="border.muted">
                <Row
                  label="5 min ago"
                  value={format.relativeTime(
                    new Date(Date.now() - 5 * 60 * 1000),
                  )}
                />
                <Row
                  label="2 hours ago"
                  value={format.relativeTime(
                    new Date(Date.now() - 2 * 60 * 60 * 1000),
                  )}
                />
                <Row
                  label="3 days ago"
                  value={format.relativeTime(
                    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                  )}
                />
              </Stack>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Units">
          <Grid columns={{ base: 1, md: 3 }} gap="4">
            <ComponentCard title="seconds">
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
            </ComponentCard>
            <ComponentCard title="percent">
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
            </ComponentCard>
            <ComponentCard title="currency">
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
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="ICU Messages">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="plurals">
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
            </ComponentCard>
            <ComponentCard title="select">
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
            </ComponentCard>
            <ComponentCard title="interpolation">
              <VStack gap="2" alignItems="stretch">
                <Text>{t("Hello, {name}!", { name: "World" })}</Text>
                <Text>
                  {t("You have {count} new messages", { count: "5" })}
                </Text>
                <Text>{t("Price: {price}", { price: "$9.99" })}</Text>
              </VStack>
            </ComponentCard>
            <ComponentCard title="number in message">
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
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Rich Text">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="basic tags">
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
            </ComponentCard>
            <ComponentCard title="nested tags">
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
            </ComponentCard>
            <ComponentCard title="with variables">
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
            </ComponentCard>
            <ComponentCard title="complex">
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
            </ComponentCard>
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

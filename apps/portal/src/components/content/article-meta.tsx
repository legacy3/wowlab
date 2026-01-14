"use client";

import { Calendar, Clock, Pencil, User } from "lucide-react";
import { useExtracted, useFormatter } from "next-intl";
import { Flex } from "styled-system/jsx";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { env } from "@/lib/env";

type ArticleMetaProps = {
  author?: string;
  date?: string;
  editPath?: string;
  readingTime?: number;
};

export function ArticleMeta({
  author,
  date,
  editPath,
  readingTime,
}: ArticleMetaProps) {
  const t = useExtracted();
  const format = useFormatter();
  const formatted = date
    ? format.dateTime(new Date(date), {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const editUrl = editPath ? `${env.GITHUB_URL}/edit/main/${editPath}` : null;
  const computedReadingTime = readingTime
    ? Math.max(1, Math.round(readingTime))
    : undefined;

  const hasContent = formatted || author || readingTime || editUrl;

  if (!hasContent) {
    return null;
  }

  return (
    <Flex alignItems="center" gap="4" flexWrap="wrap">
      {formatted && (
        <MetaItem icon={Calendar}>
          <Text as="time" textStyle="xs">
            {formatted}
          </Text>
        </MetaItem>
      )}
      {author && (
        <MetaItem icon={User}>
          <Text textStyle="xs">{author}</Text>
        </MetaItem>
      )}
      {computedReadingTime !== undefined && (
        <MetaItem icon={Clock}>
          <Text textStyle="xs">
            {t("{count, plural, other {# min read}}", {
              count: computedReadingTime,
            })}
          </Text>
        </MetaItem>
      )}
      {editUrl && (
        <Link
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="plain"
          textStyle="xs"
          color="fg.muted"
          _hover={{ color: "fg.default" }}
        >
          <Flex alignItems="center" gap="1.5">
            <Icon size="xs">
              <Pencil />
            </Icon>
            {t("Edit")}
          </Flex>
        </Link>
      )}
    </Flex>
  );
}

function MetaItem({
  children,
  icon: IconComponent,
}: {
  icon: typeof Calendar;
  children: React.ReactNode;
}) {
  return (
    <Flex alignItems="center" gap="1.5" color="fg.muted">
      <Icon size="xs">
        <IconComponent />
      </Icon>
      {children}
    </Flex>
  );
}

import { Calendar, Pencil } from "lucide-react";
import { Flex } from "styled-system/jsx";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils/date";

type DocMetaProps = {
  date?: string;
  slug?: string;
};

export function DocMeta({ date, slug }: DocMetaProps) {
  const formatted = date ? formatDate(date, "MMM d, yyyy") : null;
  const editUrl = slug
    ? `${env.GITHUB_URL}/edit/main/apps/portal-new/src/content/docs/${slug}.md`
    : null;

  if (!formatted && !editUrl) {
    return null;
  }

  return (
    <Flex alignItems="center" gap="3" flexWrap="wrap">
      {formatted && (
        <Flex alignItems="center" gap="1.5" color="fg.muted">
          <Icon size="xs">
            <Calendar />
          </Icon>
          <Text textStyle="xs">{formatted}</Text>
        </Flex>
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
            Edit
          </Flex>
        </Link>
      )}
    </Flex>
  );
}

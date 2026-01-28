"use client";

import { XIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Flex, HStack } from "styled-system/jsx";

import { IconButton, Text, Tooltip } from "@/components/ui";
import { hashString } from "@/lib/hash";
import {
  type RecentProfile,
  useCharacterInput,
  useRecentProfiles,
} from "@/lib/sim";

import { ProfileBadge } from "./profile-badge";

interface RecentProfileBadgeProps {
  onRemove: () => void;
  onSelect: () => void;
  recent: RecentProfile;
}

export function RecentProfiles() {
  const { recentProfiles: content } = useIntlayer("simulate");
  const recent = useRecentProfiles((s) => s.recent);
  const removeRecent = useRecentProfiles((s) => s.removeRecent);
  const setInput = useCharacterInput((s) => s.setInput);

  if (recent.length === 0) {
    return null;
  }

  return (
    <Flex direction="column" gap="2">
      <Text textStyle="xs" color="fg.muted" fontWeight="medium">
        {content.title}
      </Text>
      <HStack gap="2" flexWrap="wrap">
        {recent.map((r) => (
          <RecentProfileBadge
            key={hashString(r.simc)}
            recent={r}
            onSelect={() => setInput(r.simc)}
            onRemove={() => removeRecent(r.simc)}
          />
        ))}
      </HStack>
    </Flex>
  );
}

function RecentProfileBadge({
  onRemove,
  onSelect,
  recent,
}: RecentProfileBadgeProps) {
  return (
    <ProfileBadge profile={recent.profile} onClick={onSelect} pr="1">
      <Tooltip content="Remove">
        <IconButton
          variant="plain"
          size="2xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <XIcon size={12} />
        </IconButton>
      </Tooltip>
    </ProfileBadge>
  );
}

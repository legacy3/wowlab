"use client";

import { Code2Icon } from "lucide-react";
import { useExtracted } from "next-intl";
import { Flex, HStack, VStack } from "styled-system/jsx";

import { RotationCard } from "@/components/rotations";
import { Link as IntlLink } from "@/i18n/navigation";
import { href, routes } from "@/lib/routing";
import { useClassesAndSpecs, useUserProfile } from "@/lib/state";

import { Avatar, Empty, Skeleton, Text } from "../ui";

interface UserProfilePageProps {
  handle: string;
}

export function UserProfilePage({ handle }: UserProfilePageProps) {
  const t = useExtracted();
  const { isLoading, notFound, profile, rotations } = useUserProfile(handle);
  const { getSpecIcon, getSpecLabel } = useClassesAndSpecs();

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <Empty.Root size="lg" variant="outline">
        <Empty.Content>
          <Empty.Title>{t("User not found")}</Empty.Title>
          <Empty.Description>
            {t("@{handle} does not exist", { handle })}
          </Empty.Description>
        </Empty.Content>
      </Empty.Root>
    );
  }

  const initials = profile.handle.slice(0, 2).toUpperCase();

  return (
    <VStack gap="6" alignItems="stretch">
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="4"
        align={{ base: "start", sm: "center" }}
        justify="space-between"
      >
        <HStack gap="4">
          <Avatar.Root size="xl">
            {profile.avatarUrl && (
              <Avatar.Image
                src={profile.avatarUrl}
                alt={t("{handle}'s avatar", { handle: profile.handle })}
              />
            )}
            <Avatar.Fallback initials={initials} />
          </Avatar.Root>
          <IntlLink
            href={href(routes.users.profile, { handle: profile.handle })}
          >
            <Text textStyle="xl" fontWeight="semibold">
              @{profile.handle}
            </Text>
          </IntlLink>
        </HStack>

        <HStack gap="4" color="fg.muted" textStyle="sm">
          <HStack gap="1.5">
            <Code2Icon size={16} />
            <Text fontWeight="medium" fontVariantNumeric="tabular-nums">
              {rotations.length}
            </Text>
            <Text>
              {rotations.length === 1 ? t("rotation") : t("rotations")}
            </Text>
          </HStack>
        </HStack>
      </Flex>

      <VStack gap="4" alignItems="stretch">
        <Text textStyle="lg" fontWeight="semibold">
          {t("Public Rotations")}
        </Text>

        {rotations.length > 0 ? (
          <VStack gap="2" alignItems="stretch">
            {rotations.map((rotation) => (
              <RotationCard
                key={rotation.id}
                id={rotation.id}
                name={rotation.name}
                specIcon={getSpecIcon(rotation.specId)}
                specLabel={getSpecLabel(rotation.specId)}
                updatedAt={rotation.updatedAt}
              />
            ))}
          </VStack>
        ) : (
          <Empty.Root size="lg" variant="outline">
            <Empty.Content>
              <Empty.Title>{t("No public rotations")}</Empty.Title>
              <Empty.Description>
                {t("@{handle} has not published any rotations yet", { handle })}
              </Empty.Description>
            </Empty.Content>
          </Empty.Root>
        )}
      </VStack>
    </VStack>
  );
}

export function UserProfileSkeleton() {
  return (
    <VStack gap="6" alignItems="stretch">
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap="4"
        align={{ base: "start", sm: "center" }}
        justify="space-between"
      >
        <HStack gap="4">
          <Skeleton w="14" h="14" rounded="full" />
          <Skeleton w="32" h="6" />
        </HStack>
        <Skeleton w="24" h="5" />
      </Flex>

      <VStack gap="4" alignItems="stretch">
        <Skeleton w="36" h="6" />
        <VStack gap="2" alignItems="stretch">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="16" rounded="lg" />
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
}

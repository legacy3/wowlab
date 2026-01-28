"use client";

import { Code2Icon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Flex, HStack, VStack } from "styled-system/jsx";

import { RotationCard } from "@/components/rotations";
import { href, routes } from "@/lib/routing";
import { useClassesAndSpecs, useUserProfile } from "@/lib/state";

import { Avatar, Empty, Link, Skeleton, Text } from "../ui";

interface UserProfilePageProps {
  handle: string;
}

export function UserProfilePage({ handle }: UserProfilePageProps) {
  const { userProfilePage: content } = useIntlayer("users");
  const { isLoading, notFound, profile, rotations } = useUserProfile(handle);
  const { getSpecIcon, getSpecLabel } = useClassesAndSpecs();

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <Empty.Root size="lg" variant="outline">
        <Empty.Content>
          <Empty.Title>{content.userNotFound}</Empty.Title>
          <Empty.Description>
            {content.handleDoesNotExist({ handle })}
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
            {profile.avatar_url && (
              <Avatar.Image
                src={profile.avatar_url}
                alt={content.avatarAlt({ handle: profile.handle })}
              />
            )}
            <Avatar.Fallback initials={initials} />
          </Avatar.Root>
          <Link href={href(routes.users.profile, { handle: profile.handle })}>
            <Text textStyle="xl" fontWeight="semibold">
              @{profile.handle}
            </Text>
          </Link>
        </HStack>

        <HStack gap="4" color="fg.muted" textStyle="sm">
          <HStack gap="1.5">
            <Code2Icon size={16} />
            <Text fontWeight="medium" fontVariantNumeric="tabular-nums">
              {rotations.length}
            </Text>
            <Text>{content.rotationCount(rotations.length)}</Text>
          </HStack>
        </HStack>
      </Flex>

      <VStack gap="4" alignItems="stretch">
        <Text textStyle="lg" fontWeight="semibold">
          {content.publicRotations}
        </Text>

        {rotations.length > 0 ? (
          <VStack gap="2" alignItems="stretch">
            {rotations.map((rotation) => (
              <RotationCard
                key={rotation.id}
                id={rotation.id}
                name={rotation.name}
                specIcon={getSpecIcon(rotation.spec_id)}
                specLabel={getSpecLabel(rotation.spec_id)}
                updatedAt={rotation.updated_at}
              />
            ))}
          </VStack>
        ) : (
          <Empty.Root size="lg" variant="outline">
            <Empty.Content>
              <Empty.Title>{content.noPublicRotations}</Empty.Title>
              <Empty.Description>
                {content.noRotationsYet({ handle })}
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

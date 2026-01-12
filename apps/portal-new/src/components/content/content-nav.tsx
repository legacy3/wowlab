"use client";

import { useKeyPress } from "ahooks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box, Flex, VStack } from "styled-system/jsx";

import type { NavItem } from "@/lib/content/types";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { useRouter } from "@/i18n/navigation";

type ContentNavProps = {
  prev: NavItem;
  next: NavItem;
  showSubtitle?: boolean;
  className?: string;
};

export function ContentNav({
  className,
  next,
  prev,
  showSubtitle = false,
}: ContentNavProps) {
  const router = useRouter();

  useKeyPress("leftarrow", () => prev && router.push(prev.href));
  useKeyPress("rightarrow", () => next && router.push(next.href));

  return (
    <Flex
      as="nav"
      mt="12"
      pt="6"
      borderTopWidth="1px"
      borderColor="border.default"
      justifyContent="space-between"
      className={className}
    >
      {prev ? (
        <Link
          href={prev.href}
          variant="plain"
          color="fg.muted"
          _hover={{ color: "fg.default" }}
        >
          <Flex alignItems="center" gap="2">
            <Icon size="sm">
              <ChevronLeft />
            </Icon>
            {showSubtitle ? (
              <VStack alignItems="flex-start" gap="0">
                <Text textStyle="xs" color="fg.subtle">
                  Previous
                </Text>
                <Text fontWeight="medium">{prev.title}</Text>
              </VStack>
            ) : (
              <Text>{prev.title}</Text>
            )}
          </Flex>
        </Link>
      ) : (
        <Box />
      )}
      {next ? (
        <Link
          href={next.href}
          variant="plain"
          color="fg.muted"
          _hover={{ color: "fg.default" }}
          textAlign={showSubtitle ? "right" : undefined}
        >
          <Flex alignItems="center" gap="2">
            {showSubtitle ? (
              <VStack alignItems="flex-end" gap="0">
                <Text textStyle="xs" color="fg.subtle">
                  Next
                </Text>
                <Text fontWeight="medium">{next.title}</Text>
              </VStack>
            ) : (
              <Text>{next.title}</Text>
            )}
            <Icon size="sm">
              <ChevronRight />
            </Icon>
          </Flex>
        </Link>
      ) : (
        <Box />
      )}
    </Flex>
  );
}

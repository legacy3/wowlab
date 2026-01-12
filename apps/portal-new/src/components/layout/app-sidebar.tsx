"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Stack, styled } from "styled-system/jsx";

import { Collapsible, Link, Text } from "@/components/ui";
import {
  type MenuItem,
  type MenuNavItem,
  navMain,
  navSecondary,
} from "@/lib/menu-config";
import { routes } from "@/lib/routes";

import { useSidebar } from "./sidebar-context";

const SidebarLink = styled(NextLink, {
  base: {
    _hover: {
      bg: "gray.3",
      color: "fg.default",
    },
    alignItems: "center",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    fontWeight: "medium",
    gap: "3",
    px: "3",
    py: "2",
    rounded: "l2",
    transition: "colors",
  },
  variants: {
    active: {
      true: {
        bg: "gray.3",
        color: "fg.default",
      },
    },
  },
});

export function AppSidebar() {
  const { isOpen } = useSidebar();

  return (
    <Box
      as="aside"
      position="fixed"
      left="0"
      top="0"
      h="100vh"
      w="64"
      bg="bg.canvas"
      borderRightWidth="1px"
      borderColor="border"
      display={{ base: isOpen ? "flex" : "none", lg: "flex" }}
      flexDirection="column"
      zIndex="50"
    >
      <Flex
        align="center"
        gap="3"
        px="4"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Link asChild variant="plain">
          <NextLink href={routes.home}>
            <Flex align="center" gap="3">
              <Image src="/logo.svg" alt="WoW Lab" width={32} height={32} />
              <Stack gap="0">
                <Text fontWeight="bold">WoW Lab</Text>
                <Text fontSize="xs" color="fg.muted">
                  Toolkit
                </Text>
              </Stack>
            </Flex>
          </NextLink>
        </Link>
      </Flex>

      <Stack gap="6" flex="1" overflow="auto" px="3" py="4">
        <Stack gap="1">
          {navMain.map((item) => (
            <NavGroup key={item.href} item={item} />
          ))}
        </Stack>

        <Stack gap="1">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.subtle"
            px="3"
            mb="1"
          >
            Dev
          </Text>
          {navSecondary.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </Stack>
      </Stack>

      <Flex
        px="4"
        py="3"
        borderTopWidth="1px"
        borderColor="border"
        justify="center"
        gap="2"
      >
        <Text fontSize="xs" color="fg.subtle">
          © 2025 WoW Lab
        </Text>
      </Flex>
    </Box>
  );
}

function NavGroup({ item }: { item: MenuNavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Collapsible.Root defaultOpen={isActive}>
      <Collapsible.Trigger asChild>
        <Flex
          align="center"
          justify="space-between"
          px="3"
          py="2"
          rounded="l2"
          cursor="pointer"
          color={isActive ? "fg.default" : "fg.muted"}
          bg={isActive ? "gray.3" : undefined}
          _hover={{ bg: "gray.3", color: "fg.default" }}
          transition="colors"
        >
          <Flex align="center" gap="3">
            <Icon size={18} />
            <Text fontSize="sm" fontWeight="medium">
              {item.label}
            </Text>
          </Flex>
          <Collapsible.Indicator>
            <ChevronRight size={16} />
          </Collapsible.Indicator>
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack gap="0.5" pl="9" mt="1">
          {item.items.map((subItem) => (
            <SidebarLink
              key={subItem.href}
              href={subItem.href}
              active={pathname === subItem.href}
            >
              {subItem.label}
            </SidebarLink>
          ))}
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function NavLink({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  return (
    <SidebarLink
      href={item.href}
      active={pathname === item.href || pathname.startsWith(item.href + "/")}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
    >
      <Icon size={18} />
      {item.label}
    </SidebarLink>
  );
}
